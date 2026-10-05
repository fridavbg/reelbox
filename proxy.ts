import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// A fast first check that sends visitors without a session cookie to sign-in.
// It only checks that the cookie exists; pages still validate the session
// with requireUser().
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/saves/:path*"],
};
