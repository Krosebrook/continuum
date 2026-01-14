/**
 * Parameters for waitlist welcome email
 */
export interface WaitlistWelcomeEmailParams {
  name?: string;
  email: string;
  siteUrl: string;
}

/**
 * Generate waitlist welcome email content
 */
export function getWaitlistWelcomeEmail(params: WaitlistWelcomeEmailParams) {
  const { name, email, siteUrl } = params;

  return {
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

        <p style="font-size: 16px; margin-bottom: 16px;">Hi ${name || 'there'},</p>

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
          Don't want updates? <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #0284c7;">Unsubscribe</a>
        </p>
      </body>
      </html>
    `,
  };
}
