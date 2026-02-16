import { NextResponse, type NextRequest } from "next/server";
import { appConfig as configuration } from "./app/utils/config";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Use the cookie name from your config
  const hasToken = request.cookies.has(configuration.authToken);

  // 1. Handle the Auth Flow (Login/Register/etc)
  if (path.startsWith("/auth")) {
    // If user is already logged in, don't let them see login page
    if (path === "/auth/login" && hasToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 2. Protect the Dashboard and other private routes
  if (!hasToken) {
    // Redirect to login if trying to access any non-auth page without a token
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 3. If token exists, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next/static & _next/image (Next.js internals)
     * - images, favicon, etc.
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico|public).*)',
  ],
};