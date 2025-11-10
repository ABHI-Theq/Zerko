// 🔓 Routes that ANYONE can access (not logged in required)
export const publicRoutes: string[] = [
  '/',
  '/web-features',
  '/pricing',
  '/about',
  '/auth/sign-in',
  '/auth/sign-up',
];

// 🔐 Routes used for authentication (sign-in, sign-up, callbacks)
export const authRoutes: string[] = [
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/error',
  '/auth/reset-password',
];

// 🔌 Prefix for NextAuth API routes
// All of these must bypass auth and never redirect.
export const apiAuthPrefix = '/api/auth';

// 🔄 Where to redirect users after login
export const DEFAULT_LOGIN_REDIRECT = '/dashboard';
