// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";

import {
  publicRoutes,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
} from "@/route_util";

export default auth((req) => {
  // req is AuthRequest, so cast it to NextRequest to access nextUrl & url
  const request = req as unknown as NextRequest;

  const isLoggedIn = !!req.auth;
  const { pathname } = request.nextUrl;

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

  return NextResponse.next();
});

// Recommended matcher
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
