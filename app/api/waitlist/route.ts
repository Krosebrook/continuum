import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { z } from 'zod';

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

// Input validation schema
const waitlistSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2).max(100).optional(),
  company: z.string().max(100).optional(),
});

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
        created_at: new Date().toISOString(),
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

        await resend.emails.send({
          from: fromEmail,
          to: validated.email,
          subject: "You're on the Continuum waitlist!",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background: #0284c7; color: white; width: 48px; height: 48px; border-radius: 12px; font-size: 24px; font-weight: bold; line-height: 48px;">C</div>
              </div>

              <h1 style="color: #0284c7; font-size: 28px; margin-bottom: 16px; text-align: center;">Welcome to Continuum!</h1>

              <p style="font-size: 16px; margin-bottom: 16px;">Hi ${validated.name || 'there'},</p>

              <p style="font-size: 16px; margin-bottom: 24px;">Thanks for joining the waitlist! You're one of the first to discover AI-powered opportunity research.</p>

              <div style="background: #f0f9ff; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="color: #0369a1; font-size: 18px; margin: 0 0 16px 0;">What happens next?</h2>
                <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
                  <li style="margin-bottom: 8px;">We'll email you when beta spots open (within 2-4 weeks)</li>
                  <li style="margin-bottom: 8px;">First 100 users get <strong>3 months free</strong> ($147 value)</li>
                  <li style="margin-bottom: 8px;">You'll get early access to features before public launch</li>
                </ul>
              </div>

              <p style="font-size: 16px; margin-bottom: 8px;">Have questions? Just reply to this email.</p>

              <p style="font-size: 16px; margin-bottom: 32px;">- The Continuum Team</p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

              <p style="font-size: 12px; color: #6b7280; text-align: center;">
                Don't want updates? <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(validated.email)}" style="color: #0284c7;">Unsubscribe</a>
              </p>
            </body>
            </html>
          `,
        });
      } catch (emailError) {
        // Don't fail the request if email fails - user is still on waitlist
        console.error('Resend error (non-fatal):', emailError);
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
