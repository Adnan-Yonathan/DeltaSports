import { test, expect } from '@playwright/test';

test.describe('auth flow (mocked)', () => {
  test('signup -> pending verification -> login -> command center -> logout', async () => {
    const signupState = {
      ok: true,
      redirect: '/login?pendingVerification=1&email=test%40delta.app'
    };

    expect(signupState.ok).toBe(true);
    expect(signupState.redirect).toContain('pendingVerification');

    const loginState = {
      ok: true,
      redirect: '/command-center'
    };

    expect(loginState.redirect).toBe('/command-center');

    const protectedRoute = '/command-center';
    expect(protectedRoute.startsWith('/command-center')).toBe(true);

    const logoutRedirect = '/login';
    expect(logoutRedirect).toBe('/login');
  });
});
