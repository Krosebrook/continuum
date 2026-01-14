import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/types/database';

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });

  // Get session from cookies
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;

  if (accessToken && refreshToken) {
    const { data: { session }, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (!error && session) {
      // Update cookies if tokens were refreshed
      if (session.access_token !== accessToken) {
        response.cookies.set('sb-access-token', session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });
      }
      if (session.refresh_token !== refreshToken) {
        response.cookies.set('sb-refresh-token', session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        });
      }
    }
  }

  return response;
}

export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/settings',
    '/icps',
    '/opportunities',
    '/analytics',
  ];

  return protectedRoutes.some(route => pathname.startsWith(route));
}

export function isAuthRoute(pathname: string): boolean {
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  return authRoutes.some(route => pathname.startsWith(route));
}
