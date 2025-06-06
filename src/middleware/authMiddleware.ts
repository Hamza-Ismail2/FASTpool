import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the auth cookie or token (__session is set by our auth component)
  const sessionCookie = request.cookies.get('__session');
  
  // Get the pathname from the request
  const { pathname } = request.nextUrl;
  
  // Protected routes that require authentication
  const protectedRoutes = ['/rides', '/offer', '/my-rides', '/profile'];
  
  // Check if the current route is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // If trying to access a protected route without auth, redirect to auth page
  if (isProtectedRoute && !sessionCookie) {
    const url = new URL('/auth', request.url);
    url.searchParams.set('redirectTo', encodeURIComponent(pathname));
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: ['/rides/:path*', '/offer/:path*', '/my-rides/:path*', '/profile/:path*'],
}; 