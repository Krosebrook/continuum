import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
import { waitlistSchema } from '@/lib/schemas/waitlist';
import { getWaitlistWelcomeEmail } from '@/lib/emails/waitlist-welcome';

// Initialize rate limiter (optional - only if env vars are set)
function getRateLimiter() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn('Rate limiting not configured (missing UPSTASH env vars)');
    return null;
  }
  
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 requests per hour per IP
    analytics: true,
  });
}

// Initialize clients inline to handle missing env vars gracefully
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(url, key);
}

let resendClient: Resend | null | undefined;

function getResendClient() {
  if (resendClient !== undefined) {
    return resendClient;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    resendClient = null;
    return null; // Email is optional
  }
  resendClient = new Resend(key);
  return resendClient;
}

export async function POST(request: Request) {
  try {
    // Rate limiting (if configured)
    const ratelimiter = getRateLimiter();
    if (ratelimiter) {
      // Extract IP from headers, handling proxy headers safely
      const forwardedFor = request.headers.get('x-forwarded-for');
      const ip = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1';
      
      const { success, limit, reset, remaining } = await ratelimiter.limit(ip);
      
      if (!success) {
        return NextResponse.json(
          { 
            error: 'Too many requests. Please try again later.',
            limit,
            reset,
            remaining 
          },
          { status: 429 }
        );
      }
    }

    // Parse and validate input
    const body = await request.json();
    const validated = waitlistSchema.parse(body);

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', validated.email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This email is already on the waitlist!' },
        { status: 400 }
      );
    }

    // Insert into waitlist table
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: validated.email,
        name: validated.name || null,
        company: validated.company || null,
        source: 'landing_page',
        status: 'pending',
        // created_at is auto-set by database default
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist. Please try again.' },
        { status: 500 }
      );
    }

    // Send confirmation email (optional - won't fail if Resend not configured)
    const resend = getResendClient();
    if (resend) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://continuum.vercel.app';

        const emailContent = getWaitlistWelcomeEmail({
          name: validated.name,
          email: validated.email,
          siteUrl,
        });

        await resend.emails.send({
          from: fromEmail,
          to: validated.email,
          ...emailContent,
        });
      } catch (emailError) {
        // Don't fail the request if email fails - user is still on waitlist
        console.error('Email service error (non-fatal):', emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully joined the waitlist!',
        data: { id: data.id, email: data.email }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
