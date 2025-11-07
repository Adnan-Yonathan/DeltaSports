import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function CommandCenterLayout({ children }: { children: ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?next=/command-center`);
  }

  if (!session.user.email_confirmed_at) {
    redirect(`/login?verificationRequired=1&email=${encodeURIComponent(session.user.email ?? '')}`);
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id,email,role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error || !profile) {
    redirect('/?access=denied');
  }

  if (profile.role !== 'admin') {
    redirect('/?access=denied');
  }

  return <section className="flex flex-1 flex-col gap-8">{children}</section>;
}
