import { authConfig } from "@/lib/auth.config";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req) {
  const url = new URL(req.url);
  const { pathname } = url;
  const isLoggedIn = !!req.auth;

  const publicRoutes = [
    '/',
    '/auth/sign-in',
    '/auth/sign-up'
  ];

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  const isAuthApiRoute = pathname.startsWith('/api/auth');

  if (isPublicRoute || isAuthApiRoute || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const signInUrl = new URL('/auth/sign-in', req.url);
    
    // Preserve the original destination for redirect after login
    signInUrl.searchParams.set('callbackUrl', encodeURIComponent(url.pathname + url.search));
    
    return NextResponse.redirect(signInUrl);
  }

  // If user is authenticated, allow access to all other routes
  return NextResponse.next();
});

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};