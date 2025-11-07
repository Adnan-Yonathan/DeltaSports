'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

import type { FormState } from '@/app/(auth)/actions';
import { signInWithOAuth } from '@/app/(auth)/actions';

const DEFAULT_STATE: FormState = { ok: false };

type FieldConfig = {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
};

type HiddenField = { name: string; value: string };

type OAuthProvider = 'google' | 'github';

type OAuthOption = {
  provider: OAuthProvider;
  label: string;
  callbackUrl?: string;
};

type AuthFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  title: string;
  description?: string;
  submitLabel: string;
  fields: FieldConfig[];
  hiddenFields?: HiddenField[];
  oauthProviders?: OAuthOption[];
  footer?: ReactNode;
};

export function AuthForm({
  action,
  title,
  description,
  submitLabel,
  fields,
  hiddenFields,
  oauthProviders,
  footer
}: AuthFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(action, DEFAULT_STATE);

  useEffect(() => {
    if (state?.ok && state.redirect) {
      router.replace(state.redirect);
    }
  }, [router, state]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/60 p-8 text-white shadow-xl shadow-black/40">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="text-sm text-slate-300">{description}</p> : null}
      </div>
      {oauthProviders && oauthProviders.length > 0 ? (
        <div className="mt-6 grid gap-3">
          {oauthProviders.map((provider) => (
            <form
              key={provider.provider}
              action={signInWithOAuth.bind(null, provider.provider)}
              className="flex"
            >
              {provider.callbackUrl ? (
                <input type="hidden" name="callbackUrl" value={provider.callbackUrl} />
              ) : null}
              <OAuthButton label={`Continue with ${provider.label}`} />
            </form>
          ))}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-px flex-1 bg-white/10" aria-hidden />
            <span>or use email</span>
            <span className="h-px flex-1 bg-white/10" aria-hidden />
          </div>
        </div>
      ) : null}
      <form action={formAction} className="mt-6 grid gap-4" noValidate>
        {fields.map((field) => (
          <label key={field.name} className="flex flex-col gap-2 text-left text-sm">
            <span className="text-xs uppercase tracking-widest text-slate-400">{field.label}</span>
            <input
              required
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
            />
          </label>
        ))}
        {hiddenFields?.map((field) => (
          <input key={field.name} type="hidden" name={field.name} value={field.value} />
        ))}
        <FormError message={state?.error} />
        <SubmitButton label={submitLabel} />
      </form>
      {footer ? <div className="mt-6 text-center text-sm text-slate-300">{footer}</div> : null}
    </div>
  );
}

type SubmitButtonProps = {
  label: string;
};

function SubmitButton({ label }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? 'Processing…' : label}
    </button>
  );
}

type OAuthButtonProps = {
  label: string;
};

function OAuthButton({ label }: OAuthButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? 'Redirecting…' : label}
    </button>
  );
}

type FormErrorProps = {
  message?: string;
};

function FormError({ message }: FormErrorProps) {
  return (
    <p
      className="min-h-[1.25rem] text-sm text-rose-300"
      aria-live="assertive"
      role={message ? 'alert' : undefined}
    >
      {message ?? ''}
    </p>
  );
}
