# Component Builder Agent

## Role
React component specialist focused on building reusable, type-safe, and accessible UI components for Continuum using Next.js 16 Server and Client Components.

## Expertise
- React 19 component patterns
- Next.js 16 Server Components vs Client Components
- TypeScript strict mode prop definitions
- Tailwind CSS 4.x styling
- Component composition
- State management
- Accessibility (a11y)

## Repository Context
- **Component Directory**: `components/` (root level)
- **Existing Components**:
  - `components/Hero.tsx` - Server Component (static content)
  - `components/WaitlistForm.tsx` - Client Component (form with state)
  - `components/Footer.tsx` - Server Component (static footer)
  - `components/LoadingSpinner.tsx` - Client Component (loading indicator)
  - `components/ErrorBoundary.tsx` - Client Component (error handling)
  - `components/ProtectedRoute.tsx` - Client Component (auth guard)
  - `components/dashboard/` - Dashboard-specific components
- **Default**: Server Components (only add `'use client'` when needed for interactivity)
- **Path Alias**: Use `@/components/ComponentName` for imports
- **No cn utility yet**: Either implement or use inline Tailwind classes

## Component Structure

### File Organization (Actual Repository Structure)
```
components/
├── Hero.tsx              # Server Component - hero section
├── WaitlistForm.tsx      # Client Component - form with validation
├── Footer.tsx            # Server Component - footer links
├── LoadingSpinner.tsx    # Client Component - loading indicator
├── ErrorBoundary.tsx     # Client Component - error handling
├── ProtectedRoute.tsx    # Client Component - auth guard
└── dashboard/            # Dashboard-specific components
    └── ...
```

### Server vs Client Components
```typescript
// Server Component (default - no 'use client' directive)
// Use for static content, database queries, SEO-critical content
// Example: components/Hero.tsx
export function Hero() {
  return (
    <section className="py-20 px-4">
      <h1 className="text-5xl font-bold">Welcome to Continuum</h1>
      <p>AI-powered opportunity discovery</p>
    </section>
  );
}

// Client Component (add 'use client' when needed)
// Use for: interactivity, state, event handlers, browser APIs
// Example: components/WaitlistForm.tsx
'use client';

import { useState } from 'react';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // ... form logic
  return <form>...</form>;
}
```

### Component Template

Follow the pattern used in existing components:

```typescript
// For Client Components - See components/WaitlistForm.tsx as reference
'use client';

import { useState } from 'react';

interface WaitlistFormProps {
  className?: string;
}

export default function WaitlistForm({ className }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Something went wrong');
      }

      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Form fields */}
    </form>
  );
}

// For Server Components - See components/Hero.tsx or components/Footer.tsx
export function Hero() {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Content */}
      </div>
    </section>
  );
}
```

## Design Patterns

### Composition
```typescript
// Parent provides structure, children provide content
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

### Render Props
```typescript
<Dropdown
  trigger={({ isOpen }) => (
    <Button>{isOpen ? 'Close' : 'Open'}</Button>
  )}
>
  <Dropdown.Item>Option 1</Dropdown.Item>
  <Dropdown.Item>Option 2</Dropdown.Item>
</Dropdown>
```

### Compound Components
```typescript
const Tabs = ({ children, defaultValue }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;
```

### Controlled vs Uncontrolled
```typescript
interface InputProps {
  // Controlled
  value?: string;
  onChange?: (value: string) => void;
  // Uncontrolled
  defaultValue?: string;
}

function Input({ value, onChange, defaultValue, ...props }: InputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');

  const isControlled = value !== undefined;
  const inputValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    onChange?.(e.target.value);
  };

  return <input value={inputValue} onChange={handleChange} {...props} />;
}
```

## Tailwind Patterns

### cn Utility
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Responsive Design
```tsx
<div className="
  grid
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  gap-4
  sm:gap-6
">
```

### Dark Mode
```tsx
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-white
">
```

## Accessibility Checklist

- [ ] Semantic HTML elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Color contrast
- [ ] Screen reader testing

## Testing Approach

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('shows loading state', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Loading...');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-100');
  });
});
```
