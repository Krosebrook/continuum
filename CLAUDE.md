# CLAUDE.md

This file provides context for Claude Code when working on the Continuum project.

## Project Overview

**Continuum** is an AI-powered opportunity discovery platform. The current implementation is a production-ready landing page with waitlist functionality built for rapid deployment on Vercel.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4.x
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **Validation**: Zod 4.x for runtime input validation
- **Email**: Resend (optional, for confirmation emails)
- **Rate Limiting**: Upstash Redis + Ratelimit
- **Deployment**: Vercel

## Project Structure

```
continuum/
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── waitlist/         # Waitlist API endpoint
│   │   └── cron/health/      # Health check cron endpoint
│   ├── (auth)/               # Auth route group (login, signup, forgot/reset password)
│   ├── auth/callback/        # OAuth / magic-link callback handler
│   ├── dashboard/            # Protected dashboard pages (opportunities, ICPs, analytics, settings)
│   ├── unsubscribe/          # Unsubscribe page
│   ├── globals.css           # Tailwind + custom styles
│   ├── layout.tsx            # Root layout with metadata
│   └── page.tsx              # Homepage
├── components/               # React components
│   ├── Hero.tsx              # Hero section with value props
│   ├── WaitlistForm.tsx      # Form with validation
│   ├── Footer.tsx            # Footer with links
│   ├── ErrorBoundary.tsx     # Error boundary wrapper
│   ├── LoadingSpinner.tsx    # Loading spinner
│   └── ProtectedRoute.tsx    # Auth guard component
├── lib/                      # Utility libraries
│   ├── emails/               # Email templates
│   ├── hooks/                # React hooks (useAuth)
│   ├── schemas/              # Zod validation schemas
│   ├── supabase/             # Supabase clients (server, client, middleware)
│   └── types/                # TypeScript types (database, etc.)
├── __tests__/                # Vitest unit & integration tests
│   ├── api/waitlist.test.ts  # API route tests (10 tests)
│   └── components/WaitlistForm.test.tsx  # Component tests (7 tests)
├── supabase/                 # Database files
│   └── schema.sql            # Database schema
└── public/                   # Static assets
```

## Common Commands

```bash
# Development
npm run dev           # Start dev server at localhost:3000

# Build & Production
npm run build         # Build for production
npm start             # Start production server

# Code Quality
npm run lint          # Run ESLint
npm run type-check    # Run TypeScript type checking (tsc --noEmit)

# Testing
npm test              # Run all 17 Vitest unit tests
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E tests
```

## Key Files

- `app/api/waitlist/route.ts` - Main API endpoint for waitlist signups
- `components/WaitlistForm.tsx` - Client-side form with validation
- `lib/schemas/waitlist.ts` - Zod schema for input validation (shared by client and server)
- `lib/supabase/server.ts` - Server-side Supabase client
- `middleware.ts` - Auth session handling and route protection
- `supabase/schema.sql` - Database schema (run in Supabase SQL Editor)

## Environment Variables

Required variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

Optional:
- `RESEND_API_KEY` - For email confirmations
- `RESEND_FROM_EMAIL` - Sender email address
- `NEXT_PUBLIC_SITE_URL` - Site URL for links in emails
- `UPSTASH_REDIS_REST_URL` - For rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - For rate limiting

## Code Style & Conventions

- Use TypeScript strict mode - no `any` types
- Path aliases use `@/*` (e.g., `@/components/Hero`)
- Components are in `components/` directory
- API routes use Next.js Route Handlers in `app/api/`
- Server-side code uses async/await patterns
- Client components marked with `'use client'` directive

## Testing

17 unit tests across 2 test suites (all passing):

```bash
npm test              # Run all unit tests with Vitest
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E tests
```

Test files:
- `__tests__/api/waitlist.test.ts` — 10 API integration tests
- `__tests__/components/WaitlistForm.test.tsx` — 7 component tests

## Documentation

Key documentation files:
- `README.md` - Quick start and overview
- `DEPLOYMENT.md` - Deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- `API.md` - API endpoint documentation
- `ARCHITECTURE.md` - System architecture
- `SECURITY.md` - Security policy
