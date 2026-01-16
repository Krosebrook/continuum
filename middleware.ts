import { NextRequest, NextResponse } from 'next/server';
import { updateSession, isProtectedRoute, isAuthRoute } from '@/lib/supabase/middleware';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update session cookies
  const response = await updateSession(request);

  // Check if route is protected
  if (isProtectedRoute(pathname)) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const supabase = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: false,
      },
    });

    // Get session from cookies
    const accessToken = request.cookies.get('sb-access-token')?.value;
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
      // No auth tokens, redirect to login
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Validate session
    const { data: { session }, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !session) {
      // Invalid session, redirect to login
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If user is logged in and trying to access auth routes, redirect to dashboard
  if (isAuthRoute(pathname)) {
    const accessToken = request.cookies.get('sb-access-token')?.value;
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;

    if (accessToken && refreshToken) {
      return NextResponse.redirect(new URL('/dashboard/opportunities', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
