import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import {
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
} from "@/route_util";

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  // 🔐 Get session token (edge-safe, does NOT use Prisma)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;

  const pathname = nextUrl.pathname;

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  // Allow NextAuth API routes (signin, callback, etc)
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // If visiting auth pages (sign-in, sign-up)
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(DEFAULT_LOGIN_REDIRECT, nextUrl)
      );
    }
    return NextResponse.next();
  }

  // 🔒 Protected routes
  if (!isPublicRoute && !isLoggedIn) {
    const signInUrl = new URL("/auth/sign-in", nextUrl);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
