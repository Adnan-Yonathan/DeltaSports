import Link from 'next/link';

import { AuthForm } from '@/components/AuthForm';
import { login } from '@/app/(auth)/actions';
import { publicEnv } from '@/lib/env';

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const toMessage = (searchParams?: Record<string, string | string[] | undefined>) => {
  if (!searchParams) {
    return null;
  }

  if (searchParams.oauthError) {
    return 'OAuth provider returned an error. Please try again or use email.';
  }

  if (searchParams.pendingVerification) {
    const email = Array.isArray(searchParams.email) ? searchParams.email[0] : searchParams.email;
    return `Check ${email ?? 'your inbox'} for a verification email before logging in.`;
  }

  if (searchParams.resetSent) {
    return 'Password reset instructions have been emailed to you.';
  }

  if (searchParams.verificationRequired) {
    return 'Please confirm your email to unlock the Command Center.';
  }

  return null;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const message = toMessage(searchParams);
  const nextParam = (typeof searchParams?.next === 'string' && searchParams?.next) || undefined;
  const callbackUrl = nextParam?.startsWith('/') ? `${publicEnv.siteUrl}${nextParam}` : undefined;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {message ? (
        <div className="w-full max-w-md rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {message}
        </div>
      ) : null}
      <AuthForm
        action={login}
        title="Welcome back"
        description="Sign in with your credentials to access the Command Center."
        submitLabel="Log in"
        fields={[
          { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@example.com' },
          {
            name: 'password',
            label: 'Password',
            type: 'password',
            autoComplete: 'current-password',
            placeholder: '••••••••'
          }
        ]}
        hiddenFields={callbackUrl ? [{ name: 'callbackUrl', value: callbackUrl }] : undefined}
        oauthProviders={[
          { provider: 'google', label: 'Google', callbackUrl },
          { provider: 'github', label: 'GitHub', callbackUrl }
        ]}
        footer={
          <div className="space-y-2">
            <p>
              Need an account?{' '}
              <Link href="/signup" className="font-semibold text-white underline">
                Sign up
              </Link>
            </p>
            <p>
              Forgot your password?{' '}
              <Link href="/reset" className="font-semibold text-white underline">
                Reset it
              </Link>
            </p>
          </div>
        }
      />
    </div>
  );
}
