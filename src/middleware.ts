import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";

export default auth(async function middleware(req) {
  // ✅ Cast to NextRequest so url exists
  const request = req as unknown as NextRequest;

  const res = NextResponse.next();

  // ✅ Security headers
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "origin-when-cross-origin");
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline'"
  );

  // ✅ Use NextRequest.url
  const url = new URL(request.url);
  const pathname = url.pathname;

  const isLoggedIn = !!req.auth;

  const publicRoutes = [
    '/',
    '/web-features',
    '/pricing',
    '/about',
    '/auth/sign-in',
    '/auth/sign-up',
  ];

  const isPublicRoute = publicRoutes.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );

  const isAuthApiRoute = pathname.startsWith('/api/auth');

  if (isPublicRoute || isAuthApiRoute || pathname.startsWith('/_next')) {
    return res;
  }

  if (!isLoggedIn) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set(
      'callbackUrl',
      encodeURIComponent(url.pathname + url.search)
    );
    return NextResponse.redirect(signInUrl);
  }

  return res;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/api/:path*",
  ],
};
