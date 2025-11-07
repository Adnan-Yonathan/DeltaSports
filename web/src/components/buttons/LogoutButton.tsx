'use client';

import { useFormStatus } from 'react-dom';

export function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="rounded-full border border-white/30 px-3 py-1 font-semibold text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      aria-live="polite"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
