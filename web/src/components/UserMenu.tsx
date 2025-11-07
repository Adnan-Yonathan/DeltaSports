import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';

import type { Profile } from '@/components/auth/SupabaseAuthProvider';
import { logout } from '@/app/(auth)/actions';

import { LogoutButton } from './buttons/LogoutButton';

type UserMenuProps = {
  session: Session | null;
  profile: Profile | null;
};

export function UserMenu({ session, profile }: UserMenuProps) {
  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white">
          Log in
        </Link>
        <Link href="/signup" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="text-left">
        <p className="font-semibold text-white">{session.user.email}</p>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{profile?.role ?? 'user'}</p>
      </div>
      <form action={logout}>
        <LogoutButton />
      </form>
    </div>
  );
}
