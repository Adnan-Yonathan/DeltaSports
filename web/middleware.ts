import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/ssr';

import { publicEnv } from '@/lib/env';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response }, {
    supabaseUrl: publicEnv.supabaseUrl,
    supabaseKey: publicEnv.supabaseAnonKey
  });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const redirectToLogin = () => {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set('next', destination);
    return NextResponse.redirect(loginUrl);
  };

  if (!session) {
    return redirectToLogin();
  }

  if (!session.user.email_confirmed_at) {
    const verificationUrl = request.nextUrl.clone();
    verificationUrl.pathname = '/login';
    verificationUrl.searchParams.set('verificationRequired', '1');
    if (session.user.email) {
      verificationUrl.searchParams.set('email', session.user.email);
    }
    return NextResponse.redirect(verificationUrl);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'admin') {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.searchParams.set('access', 'denied');
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: ['/command-center/:path*']
};
