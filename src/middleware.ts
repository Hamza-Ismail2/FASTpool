import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname from the request
  const { pathname } = request.nextUrl;
  
  // Protected routes that require authentication
  const protectedRoutes = ['/rides', '/offer', '/my-rides', '/profile'];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Get the Firebase auth session cookie
  const session = request.cookies.get('__session');
  
  // If trying to access a protected route without auth, redirect to auth page
  if (isProtectedRoute && !session) {
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