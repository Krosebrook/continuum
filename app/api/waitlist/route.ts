import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { z } from 'zod';
import { waitlistSchema } from '@/lib/schemas/waitlist';
import { getWaitlistWelcomeEmail } from '@/lib/emails/waitlist-welcome';

// Initialize clients inline to handle missing env vars gracefully
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(url, key);
}

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return null; // Email is optional
  }
  return new Resend(key);
}

export async function POST(request: Request) {
  try {
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
