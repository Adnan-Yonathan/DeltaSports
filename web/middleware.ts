import { NextResponse, type NextRequest } from "next/server";

const parseAccessToken = (value: string): string | null => {
  try {
    const parsed = JSON.parse(value) as
      | { access_token?: unknown; currentSession?: { access_token?: unknown } }
      | null;

    if (parsed && typeof parsed === "object") {
      if (typeof parsed.access_token === "string" && parsed.access_token.length > 0) {
        return parsed.access_token;
      }

      if (
        parsed.currentSession &&
        typeof parsed.currentSession.access_token === "string" &&
        parsed.currentSession.access_token.length > 0
      ) {
        return parsed.currentSession.access_token;
      }
    }
  } catch {
    // swallow parse errors; treat as missing token
  }

  return null;
};

const hasSupabaseSession = (request: NextRequest) =>
  request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token") && parseAccessToken(cookie.value));

const isProtectedRoute = (pathname: string) =>
  ["/dashboard", "/prompts", "/files", "/settings"].some((route) => pathname.startsWith(route));

const isAuthRoute = (pathname: string) => pathname === "/sign-in" || pathname === "/sign-up";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedRoute(pathname) && !isAuthRoute(pathname)) {
    return NextResponse.next();
  }

  const authenticated = hasSupabaseSession(request);

  if (isProtectedRoute(pathname) && !authenticated) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute(pathname) && authenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/prompts/:path*", "/files/:path*", "/settings/:path*", "/sign-in", "/sign-up"],
};
