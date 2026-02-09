# GitHub Copilot Custom Instructions for Continuum

## Project Overview

Continuum is an AI-powered opportunity discovery platform built with:
- **Framework**: Next.js 16 (App Router, React 19, Server Components)
- **Language**: TypeScript 5 (strict mode enabled)
- **Styling**: Tailwind CSS 4.x with custom brand colors
- **Testing**: Vitest + Playwright + React Testing Library
- **Rate Limiting**: Upstash Redis
- **Database**: Supabase (PostgreSQL + Row-Level Security)
- **Validation**: Zod for runtime type checking
- **Email**: Resend (optional, for transactional emails)
- **Deployment**: Vercel (Edge Functions, auto-deploy from GitHub)

## Architecture Patterns

### File Structure
```
app/                    # Next.js App Router
├── api/               # API routes (Route Handlers)
├── (routes)/          # Page routes with layouts
├── layout.tsx         # Root layout
└── page.tsx           # Homepage

components/            # React components
├── ui/               # Reusable UI components
└── [feature]/        # Feature-specific components

lib/                   # Utilities and clients
├── supabase.ts       # Supabase client
├── resend.ts         # Email client
└── utils.ts          # Helper functions

supabase/             # Database
└── schema.sql        # SQL schema and migrations
```

### Component Patterns
- **Server Components by default** - Only use `'use client'` when needed for interactivity
- **Composition over inheritance** - Use props and children for flexibility
- **Single responsibility** - One component, one purpose
- **Co-location** - Keep related code together

### API Route Patterns
- Use Route Handlers in `app/api/[route]/route.ts`
- Always validate input with Zod schemas
- Return proper HTTP status codes
- Handle errors gracefully with try-catch
- Use `NextResponse.json()` for responses

## Coding Standards

### TypeScript
- **Strict mode** is enabled - no `any` types allowed
- Define explicit return types for functions
- Use interfaces for object shapes, types for unions/intersections
- Prefer `unknown` over `any` for unknown types
- Use `as const` for literal types

```typescript
// Good
interface User {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// Bad
function getUser(id: any): any {
  // ...
}
```

### Zod Validation
- Always validate external input (API requests, form data)
- Define schemas near where they're used
- Use `.transform()` for data normalization
- Use `.refine()` for custom validation

```typescript
const waitlistSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2).max(100).optional(),
  company: z.string().max(100).optional(),
});
```

### React Components
- Use function components with TypeScript
- Define props interfaces explicitly
- Use `useState` for local state, avoid prop drilling
- Prefer controlled components for forms

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button className={cn(baseStyles, variantStyles[variant])} onClick={onClick}>
      {children}
    </button>
  );
}
```

### Tailwind CSS
- Use utility classes, avoid custom CSS
- Mobile-first responsive design (`sm:`, `md:`, `lg:`)
- Use brand colors from theme (`brand-500`, `brand-600`)
- Extract repeated patterns to components, not CSS classes

```tsx
// Good - utilities with responsive
<div className="p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-sm">

// Bad - arbitrary values
<div className="p-[17px] bg-[#0284c7]">
```

## Security Requirements

### Input Validation
- Never trust client input
- Validate all API request bodies with Zod
- Sanitize user input before database queries
- Use parameterized queries (Supabase handles this)

### Row-Level Security (RLS)
- All tables must have RLS policies enabled
- Use `org_id` for multi-tenant isolation
- Policies should use JWT claims: `(auth.jwt() ->> 'org_id')::uuid`

### Authentication
- Use Supabase Auth for user authentication
- Magic links preferred over passwords
- JWT tokens expire after 1 hour
- Service role key is server-side only

### Secrets
- Never commit secrets to git (`.env.local` is gitignored)
- Use environment variables for all API keys
- Server-side env vars don't need `NEXT_PUBLIC_` prefix
- Client-side env vars must have `NEXT_PUBLIC_` prefix

## Database Conventions

### Table Naming
- Use snake_case for tables and columns
- Plural table names (`users`, `opportunities`)
- Foreign keys: `[table]_id` (e.g., `org_id`, `user_id`)

### Standard Columns
```sql
id uuid primary key default uuid_generate_v4(),
created_at timestamptz default now(),
updated_at timestamptz default now()
```

### Indexing
- Index foreign keys
- Index frequently filtered columns
- Use partial indexes for status columns
- Composite indexes for common query patterns

## Error Handling

### API Routes
```typescript
try {
  // ... logic
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
  }
  console.error('Unexpected error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### Client Components
- Use error boundaries for unexpected errors
- Show user-friendly error messages
- Log errors to console in development
- Send to error tracking in production (Sentry)

## Testing Guidelines

### Test Framework
- **Unit & Integration**: Vitest with React Testing Library
- **E2E**: Playwright
- **Test files**: `__tests__/` directory mirroring source structure

### Commands
```bash
npm test              # Run unit tests with Vitest
npm run test:ui       # Vitest UI mode
npm run test:coverage # Coverage report
npm run test:e2e      # Run Playwright E2E tests
```

### Unit Tests
- Test pure functions and utilities
- Mock external dependencies (Supabase, Resend)
- Use descriptive test names
- Located in `__tests__/` directory

### Integration Tests
- Test API routes with real-ish data
- Verify database state changes
- Test error scenarios
- Example: `__tests__/api/waitlist.test.ts`

### E2E Tests
- Use Playwright for critical user flows
- Test form submissions and navigation
- Verify UI renders correctly

## Performance Best Practices

### Next.js
- Use Server Components for static content
- Lazy load heavy components with `dynamic()`
- Use `loading.tsx` for Suspense boundaries
- Optimize images with `next/image`

### Database
- Limit query results (`LIMIT` clause)
- Use pagination for lists
- Create indexes for slow queries
- Avoid N+1 queries

### Bundle Size
- Tree-shake unused imports
- Use `next/dynamic` for code splitting
- Analyze bundle with `@next/bundle-analyzer`

## Git Conventions

### Commit Messages
```
type(scope): description

- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Tests
- chore: Maintenance
```

### Branch Names
```
feature/add-user-auth
fix/waitlist-validation
docs/update-readme
```

## Custom Agents

This repository includes 15 specialized agents in `.github/agents/` for:
- Code review and security auditing
- API and database design
- Testing and documentation
- Performance and accessibility
- Supabase and n8n integration
- DevOps and CI/CD

Invoke agents by referencing their prompts when asking Copilot for help with specific tasks.
