export const runtime="nodejs"
import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
// import ratelimit from "@/lib/rateLimit"; // COMMENTED OUT: Rate limiting disabled

import {
  publicRoutes,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
} from "@/route_util";

export default auth(async (req) => {
  // req is AuthRequest, so cast it to NextRequest to access nextUrl & url
  const request = req as unknown as NextRequest;

  const isLoggedIn = !!req.auth;
  const { pathname } = request.nextUrl;

  // COMMENTED OUT: Rate limiting logic disabled
  // let rateLimitResult: { success: boolean; limit: number; reset: number; remaining: number } | null = null;

  // COMMENTED OUT: Apply rate limiting to all API routes
  // if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
  //   const ip = request.headers.get("x-forwarded-for") ?? 
  //             request.headers.get("x-real-ip") ?? 
  //             "127.0.0.1";
  //   rateLimitResult = await ratelimit.limit(ip);

  //   if (!rateLimitResult.success) {
  //     return new NextResponse(
  //       JSON.stringify({
  //         error: "Too many requests",
  //         message: "Rate limit exceeded. Please try again later.",
  //         limit: rateLimitResult.limit,
  //         remaining: rateLimitResult.remaining,
  //         reset: new Date(rateLimitResult.reset)
  //       }),
  //       {
  //         status: 429,
  //         headers: {
  //           "Content-Type": "application/json",
  //           "X-RateLimit-Limit": rateLimitResult.limit.toString(),
  //           "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
  //           "X-RateLimit-Reset": rateLimitResult.reset.toString(),
  //         },
  //       }
  //     );
  //   }
  // }

  const isPublic = publicRoutes.includes(pathname);
  const isAuthPage = authRoutes.includes(pathname);

  // If user is logged in and tries to access login/signup
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(
      new URL(DEFAULT_LOGIN_REDIRECT, request.url)
    );
  }

  // If user is NOT logged in and tries to access protected route
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/auth/sign-in", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Create response and add rate limit headers if this was an API request
  const response = NextResponse.next();
  
  // COMMENTED OUT: Rate limit headers disabled
  // if (rateLimitResult) {
  //   response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
  //   response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
  //   response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
  // }

  return response;
});

export const config = {
  matcher: [
    "/((?!(?:_next|static|public|.*\\..*|favicon.ico|api/auth)).*)",
  ],
  runtime: "nodejs",
};

