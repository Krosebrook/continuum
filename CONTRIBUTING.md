# Contributing to Continuum

Thank you for contributing. This guide covers development setup, code standards, git workflow, testing, and known gotchas.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Code Standards](#code-standards)
4. [Git Workflow](#git-workflow)
5. [Testing Guide](#testing-guide)
6. [Known Gotchas](#known-gotchas)

---

## Development Setup

### Prerequisites

- Node.js ≥ 20.x (LTS)
- npm ≥ 10.x
- A [Supabase](https://supabase.com) project (free tier is fine)
- (Optional) [Resend](https://resend.com) account for email testing
- (Optional) [Upstash Redis](https://upstash.com) for rate limiting

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/continuum.git
cd continuum

# 2. Install dependencies
npm install

# 3. Copy env template and fill in values
cp .env.example .env.local
# Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 4. Apply the database schema
# Go to your Supabase dashboard → SQL Editor → paste and run supabase/schema.sql

# 5. Start the dev server
npm run dev
# → http://localhost:3000
```

You do **not** need Resend or Upstash for local development. The app degrades gracefully without them.

### Verifying Your Setup

```bash
# TypeScript — should report 0 errors
npm run type-check

# Lint — should report 0 errors
npm run lint

# Unit tests
npm test
# Expected: 17 tests, 11 pass, 6 fail (WaitlistForm failures are pre-existing — see Known Gotchas)
```

---

## Project Structure

```
app/            Next.js App Router (pages + API routes)
components/     React components
lib/            Shared utilities, hooks, schemas, email templates
  supabase/     Supabase clients (client.ts, server.ts, middleware.ts)
  hooks/        React hooks (useAuth.ts)
  schemas/      Zod validation schemas
  emails/       Resend email templates
supabase/       Database schema SQL
__tests__/      Vitest test suite (mirrors source structure)
docs/           Project documentation
  adr/          Architecture Decision Records
```

---

## Code Standards

### TypeScript

- **Strict mode is enabled.** No `any` types. Use `unknown` for truly unknown types.
- Define explicit return types for all exported functions.
- Use `interface` for object shapes; `type` for unions, intersections, and aliases.
- Use `as const` for literal types.

```typescript
// ✅ Good
interface WaitlistEntry {
  email: string;
  status: 'pending' | 'invited' | 'converted';
}

async function getEntry(id: string): Promise<WaitlistEntry | null> { ... }

// ❌ Bad
async function getEntry(id: any): any { ... }
```

### Zod Validation

All API inputs must be validated with a Zod schema before use. Schemas live in `lib/schemas/`.

```typescript
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100).optional(),
});
const result = schema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
}
```

### React Components

- Server Components by default. Add `'use client'` only when interactivity is needed.
- Always define a `Props` interface; avoid `React.FC<any>`.
- Use Tailwind utility classes. No arbitrary values (`p-[17px]`).
- Mobile-first responsive design (`sm:`, `md:`, `lg:`).

### API Routes

- Validate all input with Zod before touching the database.
- Return proper HTTP status codes (200, 201, 400, 401, 409, 429, 500).
- Use `try/catch` and return `{ error: string }` on failure.
- Never expose internal error messages to clients.

### File Naming

- Components: `PascalCase.tsx` (e.g., `WaitlistForm.tsx`)
- Utilities/hooks: `camelCase.ts` (e.g., `useAuth.ts`)
- Route handlers: `route.ts` (Next.js convention)
- Tests: `<SourceFile>.test.ts[x]` in `__tests__/`

---

## Git Workflow

### Branch Names

```
feature/add-icp-form
fix/waitlist-validation
docs/update-api-reference
chore/upgrade-dependencies
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

Body (optional): why, not what.
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Always include the Co-authored-by trailer for AI-assisted commits:**
```
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

### Pull Requests

1. Branch from `main`
2. Keep PRs focused — one concern per PR
3. Ensure `npm run type-check && npm run lint && npm test` pass locally before opening
4. Fill in the PR template
5. Request review from at least one other engineer

---

## Testing Guide

### Running Tests

```bash
npm test                  # Vitest — all unit tests
npm run test:coverage     # Vitest with coverage report
npm run test:e2e          # Playwright E2E (requires dev server running)
```

### Writing Tests

Tests live in `__tests__/` mirroring the source structure:
- `__tests__/api/waitlist.test.ts` for `app/api/waitlist/route.ts`
- `__tests__/components/WaitlistForm.test.tsx` for `components/WaitlistForm.tsx`

**Unit tests:** Test pure functions and Zod schemas. Mock external dependencies (Supabase, Resend, Upstash).

**Integration tests (API routes):** Use `vitest` with mocked Supabase. See `__tests__/api/waitlist.test.ts` for the pattern.

**E2E:** Playwright tests go in `__tests__/e2e/`. Currently no E2E tests are written; the config is in place.

### Test Coverage Targets

| Area | Current | Target |
|------|---------|--------|
| API routes | ~90% | ≥ 90% |
| Components | ~15% | ≥ 80% |
| Lib utilities | ~60% | ≥ 80% |

---

## Known Gotchas

### 1. WaitlistForm tests fail (React 19 + RTL timing)

6 out of 7 tests in `__tests__/components/WaitlistForm.test.tsx` fail with async timing errors. This is a pre-existing issue caused by React 19's concurrent rendering model and React Testing Library 16's async handling.

**Workaround:** These failures are expected and non-blocking. Do not spend time debugging them unless you are specifically working on the RTL upgrade (see `docs/ROADMAP.md` T1-1).

### 2. `lib/supabase-server.ts` — legacy orphaned file

This file exists at `lib/supabase-server.ts` but is never imported. The canonical server-side Supabase client is at `lib/supabase/server.ts`. Do not import from the legacy file. Deletion is pending approval (`docs/DEAD-CODE-TRIAGE.md`).

### 3. Rate limiting requires Upstash env vars

If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set, rate limiting is silently skipped. This is intentional for local development but means the `POST /api/waitlist` endpoint is unprotected locally.

### 4. Email confirmation requires Resend env vars

If `RESEND_API_KEY` is not set, waitlist signups succeed but no confirmation email is sent. The API returns `201` either way.

### 5. Supabase `service_role` key is server-side only

`SUPABASE_SERVICE_ROLE_KEY` bypasses all Row-Level Security. Never use it in client components or expose it in `NEXT_PUBLIC_*` variables.

### 6. `flatted` DoS vulnerability (transitive via Next.js)

`npm audit` will report a high-severity vulnerability in `flatted < 3.4.0`. This is a transitive dependency of Next.js and cannot be fixed without a major framework upgrade. CI is configured with `--audit-level=high --continue-on-error`. Do not be alarmed; it is tracked in `docs/SECURITY.md` and `docs/ROADMAP.md` T2-2.
