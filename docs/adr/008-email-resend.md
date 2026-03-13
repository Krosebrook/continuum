# ADR-008: Resend for Transactional Email

**Status:** Accepted  
**Date:** 2026-01-20  
**Deciders:** Engineering team

---

## Context

The waitlist flow requires sending a welcome/confirmation email to new subscribers. Options evaluated:

1. **Resend** — Modern transactional email API, React Email support, generous free tier
2. **SendGrid** — Mature, complex UI, legacy API design
3. **Postmark** — Good deliverability, higher cost
4. **AWS SES** — Cheapest at scale, requires domain verification, more setup
5. **Nodemailer + SMTP** — Requires SMTP server, not serverless-friendly

## Decision

**Resend** for transactional email.

## Rationale

- **Developer-friendly API** — Simple REST API; `resend.emails.send()` in one line.
- **React Email** support — Email templates can be written as React components (planned).
- **Free tier** — 3,000 emails/month, 100/day; more than sufficient for waitlist phase.
- **Optional integration** — When `RESEND_API_KEY` is not configured, the code skips email sending and logs a warning; the waitlist signup still succeeds. This allows local development without Resend.
- **Deliverability** — Resend has strong deliverability defaults and requires domain verification.

## Current Template

`lib/emails/waitlist-welcome.ts` generates a plain HTML welcome email with:
- Personalised greeting (if `name` provided)
- Confirmation that the user is on the waitlist
- Unsubscribe link (`/unsubscribe?email=<encoded>`)

## Consequences

- **Positive:** Fast setup; email confirmed working in under an hour.
- **Positive:** No email infrastructure to manage.
- **Negative:** Resend vendor lock-in; migrating templates to another provider requires work.
- **Negative:** If `RESEND_FROM_EMAIL` domain is not verified, emails may land in spam.
- **Dependency:** `NEXT_PUBLIC_SITE_URL` must be set for unsubscribe links to resolve correctly.
