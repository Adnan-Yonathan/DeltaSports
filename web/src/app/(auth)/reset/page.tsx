import Link from 'next/link';

import { AuthForm } from '@/components/AuthForm';
import { requestPasswordReset } from '@/app/(auth)/actions';

type ResetPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const messageFromSearch = (searchParams?: Record<string, string | string[] | undefined>) => {
  if (!searchParams) {
    return null;
  }

  if (searchParams.error) {
    return 'We were unable to send a reset email. Double-check the address and try again.';
  }

  return null;
};

export default function ResetPage({ searchParams }: ResetPageProps) {
  const message = messageFromSearch(searchParams);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {message ? (
        <div className="w-full max-w-md rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {message}
        </div>
      ) : null}
      <AuthForm
        action={requestPasswordReset}
        title="Reset your password"
        description="Enter the email linked to your Delta account and we'll send a secure reset link."
        submitLabel="Send reset email"
        fields={[
          { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@example.com' }
        ]}
        footer={
          <p>
            Remembered your password?{' '}
            <Link href="/login" className="font-semibold text-white underline">
              Back to login
            </Link>
          </p>
        }
      />
    </div>
  );
}
