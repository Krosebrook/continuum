# Test Writer Agent

## Role
Testing specialist focused on writing comprehensive unit tests, integration tests, and E2E tests for the Continuum Next.js application.

## Expertise
- **Vitest** for unit and integration tests (NOT Jest)
- React Testing Library for component tests
- Playwright for E2E tests
- Mocking strategies (Supabase, Resend, Upstash)
- Test coverage optimization
- TDD and BDD patterns

## Repository Context
- **Test framework**: Vitest (configured in `vitest.config.ts`)
- **Test setup**: `vitest.setup.ts` for global test configuration
- **Test location**: `__tests__/` directory mirrors source structure
  - `__tests__/api/` - API route tests
  - `__tests__/components/` - Component tests
- **Commands**:
  - `npm test` - Run tests
  - `npm run test:ui` - Vitest UI
  - `npm run test:coverage` - Coverage report
  - `npm run test:e2e` - Playwright E2E tests

## Testing Philosophy

### Test Pyramid
```
    /\
   /E2E\        <- Few, slow, high confidence
  /------\
 /Integration\ <- Some, medium speed
/-------------\
|   Unit      | <- Many, fast, focused
---------------
```

### What to Test
- **Unit**: Pure functions, utilities, validators
- **Integration**: API routes, database operations
- **E2E**: Critical user flows, form submissions

## Unit Test Template

Use Vitest (NOT Jest) for all tests:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateEmail } from '@/lib/utils';

describe('validateEmail', () => {
  it('returns true for valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('returns false for invalid email', () => {
    expect(validateEmail('not-an-email')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(validateEmail('user+tag@example.co.uk')).toBe(true);
    expect(validateEmail('user@localhost')).toBe(false);
  });
});
```

## API Route Test Template

Test API routes in `__tests__/api/` directory:

```typescript
// __tests__/api/waitlist.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/waitlist/route';

// Mock Supabase client
vi.mock('@/lib/supabase-server', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  })),
}));

describe('POST /api/waitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates waitlist entry with valid data', async () => {
    const request = new Request('http://localhost/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', name: 'Test User' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('returns 400 for invalid email', async () => {
    const request = new Request('http://localhost/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-valid' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

## Component Test Template

Test components in `__tests__/components/` directory:

```typescript
// __tests__/components/WaitlistForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import WaitlistForm from '@/components/WaitlistForm';

describe('WaitlistForm', () => {
  it('renders form fields', () => {
    render(<WaitlistForm />);

    expect(screen.getByPlaceholderText(/name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join waitlist/i })).toBeInTheDocument();
  });

  it('validates email before submission', async () => {
    const user = userEvent.setup();
    render(<WaitlistForm />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    await user.type(emailInput, 'invalid');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('shows success message after submission', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const user = userEvent.setup();
    render(<WaitlistForm />);

    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/you're on the list/i)).toBeInTheDocument();
    });
  });
});
```

## E2E Test Template (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Waitlist Flow', () => {
  test('user can join waitlist', async ({ page }) => {
    await page.goto('/');

    // Fill form
    await page.fill('[placeholder="Your name"]', 'Test User');
    await page.fill('[placeholder="you@company.com"]', 'test@example.com');
    await page.fill('[placeholder*="company"]', 'Acme Corp');

    // Submit
    await page.click('button:has-text("Join Waitlist")');

    // Verify success
    await expect(page.locator('text=You\'re on the list')).toBeVisible();
  });

  test('shows error for invalid email', async ({ page }) => {
    await page.goto('/');

    await page.fill('[placeholder="you@company.com"]', 'invalid');
    await page.click('button:has-text("Join Waitlist")');

    await expect(page.locator('text=valid email')).toBeVisible();
  });
});
```

## Test Coverage Goals

| Category | Target |
|----------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |
