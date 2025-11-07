'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { publicEnv, adminEmailSet, getServerEnv } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/auth/rateLimiter';
import { createClient } from '@supabase/supabase-js';

const emailSchema = z.string().min(1, 'Email is required').email('Enter a valid email address');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must include a letter and a number');

const callbackSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith(publicEnv.siteUrl), 'Invalid redirect destination');

type ActionResult = {
  ok: boolean;
  error?: string;
  redirect?: string;
};

type FormState = ActionResult;

const getClientIp = () => {
  const forwarded = headers().get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? 'unknown';
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureAdminRole = async (userId: string, email: string) => {
  if (!adminEmailSet.has(email.toLowerCase())) {
    return;
  }

  const { serviceRoleKey } = getServerEnv();
  if (!serviceRoleKey) {
    return;
  }

  const adminClient = createClient(publicEnv.supabaseUrl, serviceRoleKey);
  await adminClient
    .from('profiles')
    .upsert({ id: userId, email, role: 'admin' }, { onConflict: 'id' });
};

export const signup = async (_prev: FormState, formData: FormData): Promise<FormState> => {
  const ip = getClientIp();
  const { allowed, retryAfter, backoff } = enforceRateLimit(`signup:${ip}`);

  if (!allowed) {
    return { ok: false, error: `Too many attempts. Retry in ${Math.ceil(retryAfter / 1000)} seconds.` };
  }

  const email = emailSchema.safeParse(formData.get('email'));
  const password = passwordSchema.safeParse(formData.get('password'));

  if (!email.success || !password.success) {
    return { ok: false, error: email.error?.issues?.[0]?.message ?? password.error.issues[0]?.message };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      emailRedirectTo: `${publicEnv.siteUrl}/command-center`
    }
  });

  if (error) {
    await wait(backoff);
    return { ok: false, error: error.message };
  }

  if (data.user) {
    await ensureAdminRole(data.user.id, email.data);
    revalidatePath('/');
  }

  return {
    ok: true,
    redirect: `/login?pendingVerification=1&email=${encodeURIComponent(email.data)}`
  };
};

export const login = async (_prev: FormState, formData: FormData): Promise<FormState> => {
  const ip = getClientIp();
  const { allowed, retryAfter, backoff } = enforceRateLimit(`login:${ip}`);

  if (!allowed) {
    return { ok: false, error: `Too many attempts. Retry in ${Math.ceil(retryAfter / 1000)} seconds.` };
  }

  const email = emailSchema.safeParse(formData.get('email'));
  const password = passwordSchema.safeParse(formData.get('password'));
  const callbackUrlRaw = formData.get('callbackUrl');
  const callbackUrl = typeof callbackUrlRaw === 'string' ? callbackSchema.safeParse(callbackUrlRaw) : null;

  if (!email.success || !password.success) {
    return { ok: false, error: email.error?.issues?.[0]?.message ?? password.error.issues[0]?.message };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data
  });

  if (error) {
    await wait(backoff);
    return { ok: false, error: error.message };
  }

  if (!data.session) {
    await wait(backoff);
    return { ok: false, error: 'Unable to establish a session. Please try again.' };
  }

  if (!data.session.user.email_confirmed_at) {
    return {
      ok: false,
      error: 'Email not verified. Please confirm your inbox before accessing the Command Center.'
    };
  }

  const target = callbackUrl?.success ? callbackUrl.data : publicEnv.redirectAfterLogin;

  revalidatePath('/command-center');
  revalidatePath('/');

  return { ok: true, redirect: target };
};

export const logout = async () => {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut({ scope: 'global' });
  revalidatePath('/');
  revalidatePath('/command-center');
  redirect(publicEnv.redirectAfterLogout);
};

export const requestPasswordReset = async (_prev: FormState, formData: FormData): Promise<FormState> => {
  const ip = getClientIp();
  const { allowed, retryAfter, backoff } = enforceRateLimit(`reset:${ip}`);

  if (!allowed) {
    return { ok: false, error: `Too many attempts. Retry in ${Math.ceil(retryAfter / 1000)} seconds.` };
  }

  const email = emailSchema.safeParse(formData.get('email'));

  if (!email.success) {
    return { ok: false, error: email.error.issues[0]?.message ?? 'Email is required' };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${publicEnv.siteUrl}/reset`
  });

  if (error) {
    await wait(backoff);
    return { ok: false, error: error.message };
  }

  return { ok: true, redirect: `/login?resetSent=1&email=${encodeURIComponent(email.data)}` };
};

type OAuthProvider = 'google' | 'github';

export const signInWithOAuth = async (provider: OAuthProvider, formData?: FormData) => {
  const supabase = createSupabaseServerClient();
  const callbackUrlInput = formData?.get('callbackUrl');
  const parsedCallback =
    typeof callbackUrlInput === 'string' && callbackSchema.safeParse(callbackUrlInput).success
      ? callbackUrlInput
      : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: parsedCallback ?? `${publicEnv.siteUrl}/command-center`,
      scopes: provider === 'google' ? 'email profile' : undefined
    }
  });

  if (error || !data.url) {
    redirect('/login?oauthError=1');
  }

  redirect(data.url);
};

export type { ActionResult, FormState };
