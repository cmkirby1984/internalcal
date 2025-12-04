import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login'];

// Routes that should redirect to dashboard if authenticated
const AUTH_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for auth token in cookies (set by client-side)
  // Note: This is a basic check - the actual token validation happens on the client
  // and API requests. This middleware just handles initial redirects.
  const token = request.cookies.get('auth_token')?.value;
  
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  
  // If user has token and tries to access auth routes, redirect to dashboard
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If user doesn't have token and tries to access protected routes, redirect to login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};

