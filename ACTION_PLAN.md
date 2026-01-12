# Continuum Security & Quality Action Plan

> **✅ ARCHIVED DOCUMENT - COMPLETED**  
> This action plan was created on January 11, 2026 and completed on January 12, 2026.  
> See [CHANGELOG.md](./CHANGELOG.md) for implementation details.

**Priority:** CRITICAL (COMPLETED)  
**Estimated Time:** 15-20 hours total  
**Actual Completion:** January 12, 2026

---

## 🚨 CRITICAL - Do First (Day 1: 7 hours)

### #1: Upgrade Next.js (30 min) 🔴
**Priority:** P0 - BLOCKER  
**CVE:** Multiple (GHSA-67rr-84xm-4c7r, GHSA-4342-x723-ch2f, etc.)

```bash
# Terminal
npm install next@latest
npm audit fix --force
npm run build  # Verify build works
```

**Verification:**
```bash
npm list next  # Should show 15.4.7 or higher
npm audit      # Should show 0 vulnerabilities
```

**Affected Files:** package.json, package-lock.json

---

### #2: Add Rate Limiting (2 hours) 🔴
**Priority:** P0 - BLOCKER  
**Risk:** API spam, DoS attacks, cost attacks

**Step 1: Install dependencies**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Step 2: Set up Upstash Redis**
1. Sign up at https://upstash.com
2. Create Redis database
3. Copy connection URL and token
4. Add to `.env.local`:
```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Step 3: Update API route**

File: `app/api/waitlist/route.ts`

Add at top:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
});
```

Add in POST handler (before line 33):
```typescript
export async function POST(request: Request) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { 
        error: "Too many requests. Please try again later.",
        limit,
        reset,
        remaining 
      },
      { status: 429 }
    );
  }
  
  // ... rest of existing code
}
```

**Verification:**
```bash
# Test with curl
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  -v

# Make 4 requests quickly - 4th should return 429
```

**Affected Files:** `app/api/waitlist/route.ts`

---

### #3: Add Security Headers (30 min) 🔴
**Priority:** P0 - BLOCKER  
**Risk:** XSS attacks, man-in-the-middle attacks

File: `vercel.json`

Replace the headers section (lines 8-39) with:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.upstash.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

**Verification:**
```bash
# Deploy to Vercel or test locally
curl -I https://your-app.vercel.app | grep -E "Content-Security|Strict-Transport"
```

**Affected Files:** `vercel.json`

---

### #4: Fix Waitlist RLS (30 min) 🔴
**Priority:** P0 - BLOCKER  
**Risk:** Email scraping, data leak

**Step 1: Open Supabase SQL Editor**

**Step 2: Run this SQL:**
```sql
-- Enable RLS on waitlist table
alter table waitlist enable row level security;

-- Allow anyone to insert
create policy "public_can_insert" on waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Deny anonymous reads
create policy "no_anon_select" on waitlist
  for select
  to anon
  using (false);

-- Allow authenticated users to read
create policy "authenticated_can_select" on waitlist
  for select
  to authenticated
  using (true);

-- Allow authenticated users to update/delete
create policy "authenticated_can_update" on waitlist
  for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_can_delete" on waitlist
  for delete
  to authenticated
  using (true);
```

**Step 3: Update schema.sql**

File: `supabase/schema.sql`

Add after line 35 (after creating waitlist table):
```sql
-- Row Level Security for waitlist
alter table waitlist enable row level security;

create policy "public_can_insert" on waitlist
  for insert to anon, authenticated with check (true);

create policy "no_anon_select" on waitlist
  for select to anon using (false);

create policy "authenticated_can_select" on waitlist
  for select to authenticated using (true);
```

**Verification:**
```bash
# Try to query waitlist via Supabase client without auth
# Should return empty result or error
```

**Affected Files:** `supabase/schema.sql`, Supabase database

---

### #5: Sanitize Error Messages (1 hour) 🔴
**Priority:** P0 - BLOCKER  
**Risk:** Information disclosure

File: `app/api/waitlist/route.ts`

**Change 1: Line 12**
```typescript
// BEFORE
throw new Error('Supabase configuration missing');

// AFTER
console.error('CRITICAL: Database configuration missing');
throw new Error('Service temporarily unavailable');
```

**Change 2: Lines 70-76**
```typescript
// BEFORE
if (error) {
  console.error('Supabase error:', error);
  return NextResponse.json(
    { error: 'Failed to join waitlist. Please try again.' },
    { status: 500 }
  );
}

// AFTER
if (error) {
  console.error('Database error:', error); // Log full error server-side
  return NextResponse.json(
    { error: 'Unable to process your request. Please try again later.' },
    { status: 500 }
  );
}
```

**Change 3: Lines 129-132**
```typescript
// BEFORE
catch (emailError) {
  console.error('Resend error (non-fatal):', emailError);
}

// AFTER
catch (emailError) {
  console.error('Email service error (non-fatal):', emailError);
  // Don't expose to user
}
```

**Affected Files:** `app/api/waitlist/route.ts`

---

## 🟡 HIGH PRIORITY - Do Next (Day 2: 8 hours)

### #6: Add Testing Infrastructure (2 hours) 🟡
**Priority:** P1 - Critical

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

Create `vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

Update `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

### #7: Write Critical Tests (4 hours) 🟡
**Priority:** P1 - Critical

Create `__tests__/api/waitlist.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/waitlist/route';

describe('POST /api/waitlist', () => {
  it('should accept valid email', async () => {
    const request = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('should reject invalid email', async () => {
    const request = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should reject duplicate email', async () => {
    // First submission
    const request1 = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'duplicate@example.com' }),
    });
    await POST(request1);

    // Second submission (duplicate)
    const request2 = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'duplicate@example.com' }),
    });

    const response = await POST(request2);
    expect(response.status).toBe(400);
  });
});
```

Create `__tests__/components/WaitlistForm.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WaitlistForm from '@/components/WaitlistForm';

describe('WaitlistForm', () => {
  it('should render form fields', () => {
    render(<WaitlistForm />);
    
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your company (optional)')).toBeInTheDocument();
    expect(screen.getByText('Join Waitlist')).toBeInTheDocument();
  });

  it('should show error for invalid email', async () => {
    render(<WaitlistForm />);
    
    const emailInput = screen.getByPlaceholderText('you@company.com');
    const submitButton = screen.getByText('Join Waitlist');

    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('should show success message after submission', async () => {
    render(<WaitlistForm />);
    
    const emailInput = screen.getByPlaceholderText('you@company.com');
    const submitButton = screen.getByText('Join Waitlist');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/on the list/i)).toBeInTheDocument();
    });
  });
});
```

---

### #8: Fix Race Condition (1 hour) 🟡
**Priority:** P1 - Critical

File: `app/api/waitlist/route.ts`

**Remove lines 43-54** (duplicate check):
```typescript
// DELETE THIS CODE:
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
```

**Update lines 57-76** (insert with error handling):
```typescript
// REPLACE WITH:
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
  // Handle duplicate email (unique constraint violation)
  if (error.code === '23505') {
    return NextResponse.json(
      { error: 'This email is already on the waitlist!' },
      { status: 400 }
    );
  }
  
  // Handle other errors
  console.error('Database error:', error);
  return NextResponse.json(
    { error: 'Unable to process your request. Please try again later.' },
    { status: 500 }
  );
}
```

---

### #9: Add Input Sanitization (1 hour) 🟡
**Priority:** P1 - Critical

```bash
npm install isomorphic-dompurify
```

File: `app/api/waitlist/route.ts`

Add at top:
```typescript
import DOMPurify from 'isomorphic-dompurify';
```

Update lines 36-38:
```typescript
// BEFORE
const validated = waitlistSchema.parse(body);

// AFTER
const validated = waitlistSchema.parse(body);

// Sanitize inputs
const sanitized = {
  email: validated.email.toLowerCase().trim(),
  name: validated.name ? DOMPurify.sanitize(validated.name.trim()) : null,
  company: validated.company ? DOMPurify.sanitize(validated.company.trim()) : null,
};
```

Update insert to use `sanitized` instead of `validated`:
```typescript
const { data, error } = await supabase
  .from('waitlist')
  .insert({
    email: sanitized.email,
    name: sanitized.name,
    company: sanitized.company,
    // ...
  })
```

---

## 🟢 MEDIUM PRIORITY - Do Soon (Week 2)

### #10: Add Monitoring (2 hours)
- Install @vercel/analytics
- Install @sentry/nextjs
- Set up error tracking
- Configure alert notifications

### #11: Add Bot Protection (3 hours)
- Sign up for Cloudflare Turnstile
- Add CAPTCHA to form
- Implement server-side verification

### #12: Database Improvements (2 hours)
- Add email format constraint
- Add case-insensitive email index
- Add soft delete columns

### #13: GDPR Compliance (4 hours)
- Create privacy policy
- Add cookie consent banner
- Implement data export API
- Create unsubscribe endpoint

---

## ✅ Verification Checklist

After completing Day 1 & 2 tasks:

- [ ] Next.js version is 15.4.7+
- [ ] `npm audit` shows 0 critical vulnerabilities
- [ ] Rate limiting returns 429 after 3 requests
- [ ] Security headers present (check with curl -I)
- [ ] Anonymous users cannot read waitlist emails
- [ ] Error messages don't mention "Supabase" or "Resend"
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Type check passes: `npm run type-check`
- [ ] Lint passes: `npm run lint`

---

## 📊 Progress Tracking

Create GitHub Issues for each task:
```bash
gh issue create --title "🔴 P0: Upgrade Next.js to fix CVEs" --body "..."
gh issue create --title "🔴 P0: Add rate limiting to API" --body "..."
# ... etc
```

Use labels:
- `priority: P0` - Critical (Day 1)
- `priority: P1` - High (Day 2)
- `priority: P2` - Medium (Week 2)
- `type: security` - Security-related
- `type: testing` - Testing-related

---

## 🤝 Need Help?

- **Security questions**: See `AUDIT_REPORT.md` sections 2.1-2.7
- **Implementation examples**: See code snippets in this file
- **Architecture decisions**: See `.github/agents/security-auditor.md`

---

**Remember**: Don't skip the P0 tasks. They're marked critical for a reason - your application is vulnerable without them.

Good luck! 🚀
