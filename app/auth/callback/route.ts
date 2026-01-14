import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard/opportunities';

  if (code) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && anonKey) {
      const supabase = createClient(url, anonKey);

      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && session) {
        const response = NextResponse.redirect(new URL(redirect, requestUrl.origin));

        // Set auth cookies
        response.cookies.set('sb-access-token', session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });

        response.cookies.set('sb-refresh-token', session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        });

        return response;
      }
    }
  }

  // Something went wrong, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
}
