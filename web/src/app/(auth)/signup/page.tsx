import Link from 'next/link';

import { AuthForm } from '@/components/AuthForm';
import { signup } from '@/app/(auth)/actions';

type SignupPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const messageFromSearch = (searchParams?: Record<string, string | string[] | undefined>) => {
  if (!searchParams) {
    return null;
  }

  if (searchParams.error) {
    return 'We were unable to create your account. Please try again with a different email.';
  }

  return null;
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  const message = messageFromSearch(searchParams);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {message ? (
        <div className="w-full max-w-md rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {message}
        </div>
      ) : null}
      <AuthForm
        action={signup}
        title="Create your account"
        description="Spin up access to Delta's Command Center with secure email and password credentials."
        submitLabel="Sign up"
        fields={[
          { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@example.com' },
          {
            name: 'password',
            label: 'Password',
            type: 'password',
            autoComplete: 'new-password',
            placeholder: 'Minimum 8 characters'
          }
        ]}
        oauthProviders={[
          { provider: 'google', label: 'Google' },
          { provider: 'github', label: 'GitHub' }
        ]}
        footer={
          <p>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-white underline">
              Log in
            </Link>
          </p>
        }
      />
    </div>
  );
}
