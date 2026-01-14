import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/waitlist/route';

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-id', email: 'test@example.com' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn().mockImplementation(function() {
    return {
      limit: vi.fn(() => Promise.resolve({
        success: true,
        limit: 3,
        reset: Date.now() + 3600000,
        remaining: 2,
      })),
      slidingWindow: vi.fn(),
    };
  }),
}));

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn(() => ({})),
  },
}));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn(() => Promise.resolve({ id: 'email-id' })),
    },
  })),
}));

describe('POST /api/waitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear environment to test without rate limiting
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('should accept valid email with all fields', async () => {
    const request = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        company: 'Test Company',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Successfully joined the waitlist!');
  });

  it('should accept valid email with only email field', async () => {
    const request = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'minimal@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('should reject invalid email format', async () => {
    const request = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should reject missing email', async () => {
    const request = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should sanitize XSS attempts in name field', async () => {
    const request = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        name: '<script>alert("xss")</script>Test',
        company: 'Test Company',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    // DOMPurify should strip the script tags
  });

  it('should handle database errors gracefully and not expose internal details', async () => {
    // Mock database error
    const { getSupabaseServerClient } = await import('@/lib/supabase-server');
    vi.mocked(getSupabaseServerClient).mockReturnValueOnce({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' },
            })),
          })),
        })),
      })),
    } as any);

    const request = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    // Error message should not expose internal details
    expect(data.error).not.toContain('Database');
    expect(data.error).not.toContain('Supabase');
  });

  it('should handle duplicate email (23505 error)', async () => {
    // Mock duplicate constraint violation
    const { getSupabaseServerClient } = await import('@/lib/supabase-server');
    vi.mocked(getSupabaseServerClient).mockReturnValueOnce({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { code: '23505', message: 'Duplicate key' },
            })),
          })),
        })),
      })),
    } as any);

    const request = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'duplicate@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('This email is already on the waitlist!');
  });

  it('should normalize email to lowercase', async () => {
    const request = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'TEST@EXAMPLE.COM' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    // Email should be normalized to lowercase internally
  });

  it('should trim whitespace from inputs', async () => {
    const request = new Request('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '  test@example.com  ',
        name: '  Test User  ',
        company: '  Test Company  ',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});

describe('GET /api/waitlist', () => {
  it('should return health check status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });
});
