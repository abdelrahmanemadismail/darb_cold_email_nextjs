import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { betterFetch } from '@better-fetch/fetch';
import type { ExtendedSession } from '@/types/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Admin-only routes
  const adminOnlyRoutes = ['/dashboard/settings'];
  const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));

  // Get session cookie
  const sessionCookie = request.cookies.get('better-auth.session_token');

  // If user is not authenticated and trying to access protected route
  if (!sessionCookie && !isPublicPath && pathname !== '/') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access auth pages
  if (sessionCookie && isPublicPath) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Check admin-only routes
  if (sessionCookie && isAdminRoute) {
    try {
      const { data: session } = await betterFetch<ExtendedSession>(
        '/api/auth/get-session',
        {
          baseURL: request.nextUrl.origin,
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        }
      );

      if (session?.user && session.user.role !== 'admin') {
        const dashboardUrl = new URL('/dashboard', request.url);
        dashboardUrl.searchParams.set('error', 'admin_required');
        return NextResponse.redirect(dashboardUrl);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
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
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};