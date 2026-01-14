# Architecture Documentation

## 📐 Overview

Continuum is built as a modern, scalable web application using Next.js 16 with the App Router, designed to grow from a landing page into a full-featured opportunity discovery platform.

### Tech Stack Summary

- **Framework**: Next.js 16 (App Router, React 19, Server Components)
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS 4.x
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Validation**: Zod 4.x
- **Email**: Resend (optional)
- **Deployment**: Vercel (Edge Runtime)

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Browser   │  │    Mobile    │  │   Tablet     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────┼─────────────────────────────────┐
│                    Vercel Edge Network                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js 16 App Router                    │   │
│  │  ┌──────────────┐  ┌──────────────┐                 │   │
│  │  │   Server     │  │   Client     │                 │   │
│  │  │  Components  │  │  Components  │                 │   │
│  │  └──────┬───────┘  └──────┬───────┘                 │   │
│  │         │                  │                          │   │
│  │         │   ┌──────────────┴───────────────┐        │   │
│  │         │   │      API Routes              │        │   │
│  │         │   │  - /api/waitlist             │        │   │
│  │         │   │  - Rate Limiting (Upstash)   │        │   │
│  │         │   └──────────┬───────────────────┘        │   │
│  └─────────┼──────────────┼──────────────────────────┘   │
└────────────┼──────────────┼──────────────────────────────┘
             │              │
    ┌────────┼──────────────┼────────┐
    │        │              │         │
┌───▼────────▼──┐    ┌──────▼─────┐  │
│   Supabase    │    │   Resend   │  │
│  ┌─────────┐  │    │   Email    │  │
│  │PostgreSQL│  │    └────────────┘  │
│  │   RLS    │  │                    │
│  └─────────┘  │    ┌────────────┐   │
│  ┌─────────┐  │    │   Upstash  │   │
│  │  Auth   │  │    │   Redis    │   │
│  └─────────┘  │    │ (Rate Limit)│   │
└───────────────┘    └────────────┘   │
```

## 📁 Project Structure

```
continuum/
├── app/                          # Next.js App Router
│   ├── api/                      # API Route Handlers
│   │   └── waitlist/
│   │       └── route.ts          # Waitlist submission endpoint
│   ├── unsubscribe/              # Unsubscribe page
│   │   └── page.tsx              # Unsubscribe confirmation
│   ├── globals.css               # Global styles + Tailwind
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Homepage (Server Component)
│
├── components/                   # React Components
│   ├── Hero.tsx                  # Hero section (Server Component)
│   ├── WaitlistForm.tsx          # Form with validation (Client Component)
│   └── Footer.tsx                # Footer (Server Component)
│
├── lib/                          # Utilities & Clients
│   ├── emails/                   # Email templates
│   │   └── waitlist-welcome.ts  # Welcome email template
│   ├── schemas/                  # Validation schemas
│   │   └── waitlist.ts           # Waitlist form schema
│   └── supabase-server.ts        # Supabase server client
│
├── supabase/                     # Database
│   └── schema.sql                # SQL schema + RLS policies
│
├── public/                       # Static assets
│
├── .github/                      # GitHub configuration
│   ├── workflows/                # CI/CD workflows
│   ├── agents/                   # Custom Copilot agents
│   └── CODEOWNERS                # Code ownership
│
├── .env.example                  # Environment variable template
├── .env.local                    # Local environment (gitignored)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── vercel.json                   # Vercel deployment config

```

## 🔄 Data Flow

### Waitlist Submission Flow

```
1. User fills out form
   └─> WaitlistForm.tsx (Client Component)
       └─> Validates with Zod schema
           └─> POST /api/waitlist

2. API Route Handler
   └─> Rate limiting check (Upstash Redis - optional)
       └─> Input validation (Zod schema)
           └─> Check for duplicate email
               └─> Supabase insert (parameterized queries prevent SQL injection)
                   ├─> Success: Send confirmation email (Resend - optional)
                   └─> Duplicate: Return 400 error

3. Database (Supabase)
   └─> RLS policy check (public inserts allowed for waitlist)
       └─> Insert into waitlist table
           └─> Auto-set created_at timestamp

4. Response to Client
   └─> Success: Show success message
   └─> Error: Display error to user
```

## 🎨 Component Architecture

### Server vs Client Components

**Server Components** (Default):
- `Hero.tsx` - Static content, no interactivity
- `Footer.tsx` - Static links and content
- `app/page.tsx` - Composes server components

**Client Components** (`'use client'`):
- `WaitlistForm.tsx` - Form with state management and event handlers

**Why Server Components?**
- Reduced JavaScript bundle size
- Better SEO (fully rendered HTML)
- Direct database access (when needed)
- Faster initial page load

### Component Patterns

1. **Composition over Inheritance**
   ```typescript
   // Good: Composing components
   <Hero />
   <WaitlistForm />
   <Footer />
   ```

2. **Single Responsibility**
   - Each component has one clear purpose
   - Easy to test and maintain

3. **Props Interface**
   ```typescript
   interface ComponentProps {
     variant?: 'primary' | 'secondary';
     children: React.ReactNode;
   }
   ```

## 🗄️ Database Design

### Schema Overview

```
┌─────────────────┐
│   waitlist      │
├─────────────────┤
│ id (uuid)       │◄── Primary Key
│ email (text)    │    Unique, Not Null
│ name (text)     │    Optional
│ company (text)  │    Optional
│ source (text)   │    Default: 'landing_page'
│ status (text)   │    Default: 'pending' (pending, invited, converted)
│ created_at      │    Timestamp
│ invited_at      │    Timestamp (nullable)
│ converted_at    │    Timestamp (nullable)
└─────────────────┘

Future tables (MVP):
┌──────────────────┐       ┌──────────────────┐
│  organizations   │       │      users       │
│  org_id (uuid)   │◄─────┤  user_id (uuid)  │
│  name            │       │  email           │
│  created_at      │       │  org_id (fk)     │
└──────────────────┘       │  role            │
                           └──────────────────┘
                                    │
                           ┌────────┴────────┐
                           │                 │
                    ┌──────▼─────┐    ┌─────▼────────┐
                    │    icps    │    │ opportunities│
                    │  icp_id    │    │  opp_id      │
                    │  org_id    │    │  org_id      │
                    │  criteria  │    │  company     │
                    └────────────┘    │  enrichment  │
                                      └──────────────┘
```

### Row-Level Security (RLS)

**Current**: Waitlist table
- Uses grant-based permissions (no RLS policies)
- Anonymous users can INSERT (for public waitlist signup)
- Authenticated users can SELECT, INSERT, UPDATE, DELETE
- Appropriate for public landing page functionality

```sql
-- Grant access to waitlist table (for landing page - anon access needed)
grant select, insert on waitlist to anon;
grant select, insert, update, delete on waitlist to authenticated;
```

**Future**: Multi-tenant isolation with RLS
```sql
-- Example: Users can only see data from their organization
create policy "org_isolation" on opportunities
  for select to authenticated
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);
```

## 🔐 Security Architecture

### Defense-in-Depth Layers

1. **Network Layer**
   - HTTPS enforced (Vercel automatic)
   - Security headers (CSP, HSTS, etc.)
   - DDoS protection (Vercel Edge Network)

2. **Application Layer**
   - Rate limiting (Upstash Redis - optional)
   - Input validation (Zod schemas)
   - Parameterized queries prevent injection
   - Error message sanitization

3. **Database Layer**
   - Row-Level Security (RLS)
   - Parameterized queries (Supabase)
   - Least-privilege API keys
   - Encrypted at rest

4. **Authentication Layer** (Future)
   - Supabase Auth (magic links)
   - JWT tokens (1 hour expiry)
   - Role-based access control

### Rate Limiting Strategy (Optional)

```typescript
// 3 submissions per hour per IP address
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
});
```

**Configuration:**
- Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables
- If not configured, rate limiting is skipped with a warning
- Graceful degradation ensures waitlist still works without rate limiting

**Why 3 per hour?**
- Prevents spam/bot attacks
- Allows legitimate retries
- Balances security and UX

## 🎯 API Design

### RESTful Endpoints

```
POST /api/waitlist
├── Headers: Content-Type: application/json
├── Body: { email, name?, company? }
├── Rate Limit: 3 requests per hour per IP (if Upstash configured)
├── Response: 201 Created | 400 Bad Request | 429 Too Many Requests | 500 Internal Error
└── Side Effects: Email sent (if Resend configured)

GET /api/waitlist
├── Response: 200 OK with health check status
└── Body: { status: 'ok', timestamp: ISO string }
```

### Error Handling

```typescript
try {
  // Business logic
} catch (error) {
  if (error instanceof z.ZodError) {
    // Validation error - return specific message
    return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
  }
  
  // Generic error - log details, return sanitized message
  console.error('Internal error:', error);
  return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
}
```

## 🚀 Deployment Architecture

### Vercel Edge Network

- **Regions**: Global edge locations
- **Runtime**: Node.js 18.x
- **Build**: Static optimization + ISR
- **CDN**: Automatic caching

### Environment-Specific Config

```
Development (localhost:3000)
├── Hot reload enabled
├── Source maps
├── Verbose logging
└── Test Supabase project

Production (vercel.app)
├── Minified bundles
├── Error tracking (Sentry)
├── Rate limiting strict
└── Production Supabase project
```

## 📊 Performance Optimizations

### Server Components
- Reduces client bundle by ~40%
- Faster Time to Interactive (TTI)
- Better SEO crawlability

### Code Splitting
- Automatic route-based splitting
- Dynamic imports for heavy components
- Lazy loading images

### Caching Strategy
```javascript
// Static assets: 1 year
Cache-Control: public, max-age=31536000, immutable

// API responses: No cache
Cache-Control: no-store, max-age=0

// HTML pages: Revalidate
Cache-Control: public, max-age=0, must-revalidate
```

## 🔮 Future Architecture

### Phase 1: Authentication (Week 1-2)
- Add Supabase Auth
- Implement magic link login
- Create protected dashboard route

### Phase 2: ICP Builder (Week 3-4)
- Form for defining ideal customer
- Save criteria to database
- Multi-step wizard UI

### Phase 3: n8n Integration (Week 5-6)
- n8n workflow for opportunity discovery
- Webhook endpoints for data sync
- Background job processing

### Phase 4: Dashboard (Week 7-8)
- Opportunity list view
- Filtering and search
- Enrichment data display

## 📚 Design Decisions

### Why Next.js 16?
- **App Router**: Better performance, simpler data fetching
- **React 19**: Latest features, better concurrent rendering
- **Server Components**: Reduced bundle size, better SEO

### Why Supabase?
- **PostgreSQL**: Robust, scalable SQL database
- **RLS**: Built-in multi-tenancy
- **Auth**: Integrated authentication
- **Real-time**: WebSocket support (future use)

### Why Tailwind CSS?
- **Utility-first**: Faster development
- **Mobile-first**: Responsive by default
- **Customizable**: Easy theming
- **Small bundle**: PurgeCSS removes unused styles

### Why Zod?
- **Runtime validation**: Catches errors at runtime
- **Type inference**: TypeScript types from schemas
- **Composable**: Easy to build complex validations

## 🔍 Monitoring & Observability

### Current
- Console logging (server-side)
- Supabase dashboard (database queries)
- Vercel analytics (web vitals)

### Planned
- **Sentry**: Error tracking and alerting
- **LogFlare**: Structured logging
- **Upstash Analytics**: Rate limit insights
- **Posthog**: Product analytics

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: January 2026  
**Version**: 1.0
