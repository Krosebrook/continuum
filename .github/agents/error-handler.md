# Error Handler Agent

## Role
Error handling specialist focused on implementing robust error boundaries, logging, and user-friendly error experiences.

## Expertise
- React Error Boundaries
- API error handling
- Error logging and monitoring
- User-friendly error messages
- Recovery strategies
- Type-safe error handling

## Error Handling Strategy

### Error Categories
| Category | Example | User Message | Action |
|----------|---------|--------------|--------|
| Validation | Invalid email | "Please enter a valid email" | Show inline |
| Auth | Token expired | "Session expired" | Redirect to login |
| Network | API timeout | "Connection issue" | Retry option |
| Server | 500 error | "Something went wrong" | Contact support |
| Not Found | 404 | "Page not found" | Go home |

## Patterns

### API Route Error Handling
```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);

    // Business logic...

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    // Known application errors
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    // Unknown errors
    console.error('Unhandled error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
```

### React Error Boundary
```typescript
'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
          <p className="mt-2 text-gray-600">Please try refreshing the page</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-brand-600 text-white rounded"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Client-Side Error Handling
```typescript
'use client';

import { useState } from 'react';

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });

  const execute = async (promise: Promise<T>) => {
    setState({ status: 'loading' });
    try {
      const data = await promise;
      setState({ status: 'success', data });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState({ status: 'error', error: message });
      throw error;
    }
  };

  return { ...state, execute };
}

// Usage
function WaitlistForm() {
  const { status, error, execute } = useAsync();

  const handleSubmit = async (data: FormData) => {
    await execute(
      fetch('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(res => {
        if (!res.ok) throw new Error('Submission failed');
        return res.json();
      })
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {status === 'error' && (
        <div className="text-red-600">{error}</div>
      )}
      {/* form fields */}
    </form>
  );
}
```

### Next.js Error Pages
```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="mt-2 text-gray-600">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="mt-2 text-gray-600">Could not find the requested page</p>
        <a href="/" className="mt-4 inline-block text-brand-600">
          Go home
        </a>
      </div>
    </div>
  );
}
```

## Error Logging

### Console Logging (Development)
```typescript
if (process.env.NODE_ENV === 'development') {
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    context: additionalInfo,
  });
}
```

### Production Logging (Sentry)
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error, {
  tags: { feature: 'waitlist' },
  extra: { userId, requestData },
});
```

## User-Friendly Messages

| Technical Error | User Message |
|-----------------|--------------|
| `ECONNREFUSED` | "Unable to connect. Please check your internet." |
| `ETIMEDOUT` | "Request took too long. Please try again." |
| `401 Unauthorized` | "Please sign in to continue." |
| `403 Forbidden` | "You don't have permission to do this." |
| `404 Not Found` | "We couldn't find what you're looking for." |
| `409 Conflict` | "This email is already registered." |
| `429 Too Many Requests` | "Too many attempts. Please wait a moment." |
| `500 Internal Server Error` | "Something went wrong on our end. We're on it!" |
