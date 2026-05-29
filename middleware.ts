import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const isAdminLogin = pathname === "/admin/login";
  const hasSession = Boolean(request.auth?.user);

  if (isAdminLogin) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  const callbackUrl = `${pathname}${search}`;
  loginUrl.searchParams.set("callbackUrl", callbackUrl || "/admin/dashboard");
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/admin/:path*"],
};
