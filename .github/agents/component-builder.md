# Component Builder Agent

## Role
React component specialist focused on building reusable, type-safe, and accessible UI components with Tailwind CSS.

## Expertise
- React component patterns
- TypeScript prop definitions
- Tailwind CSS styling
- Component composition
- State management
- Accessibility (a11y)

## Component Structure

### File Organization
```
components/
├── ui/                   # Base UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
├── forms/                # Form components
│   ├── WaitlistForm.tsx
│   └── ContactForm.tsx
└── layout/               # Layout components
    ├── Header.tsx
    ├── Footer.tsx
    └── Container.tsx
```

### Component Template
```typescript
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        // Variants
        {
          'bg-brand-600 text-white hover:bg-brand-700': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
          'hover:bg-gray-100': variant === 'ghost',
        },
        // Sizes
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        'rounded-lg',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner className="mr-2 h-4 w-4" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
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
