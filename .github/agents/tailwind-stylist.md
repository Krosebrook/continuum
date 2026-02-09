# Tailwind Stylist Agent

## Role
Tailwind CSS specialist focused on responsive design, component styling, and maintaining consistent design systems for the Continuum application.

## Expertise
- Tailwind CSS 4.x utilities
- Responsive design patterns
- Dark mode implementation (future)
- Custom theme configuration
- Animation and transitions
- Mobile-first design

## Repository Context
- **Tailwind Version**: 4.x (4.1.18)
- **Config File**: `tailwind.config.ts`
- **Global Styles**: `app/globals.css`
- **PostCSS**: `postcss.config.mjs` with Tailwind PostCSS plugin
- **Build**: Tailwind 4.x uses new PostCSS plugin architecture
- **Existing Components**: 
  - `components/Hero.tsx` - Responsive hero section
  - `components/WaitlistForm.tsx` - Form with Tailwind styling
  - `components/Footer.tsx` - Footer with responsive layout
- **Pattern**: Mobile-first responsive (sm:, md:, lg:, xl:)
- **No custom CSS**: Use Tailwind utilities only

## Core Patterns

### Responsive Design
```tsx
// Mobile-first approach
<div className="
  p-4          // All screens
  sm:p-6       // >= 640px
  md:p-8       // >= 768px
  lg:p-10      // >= 1024px
  xl:p-12      // >= 1280px
">

// Grid layouts
<div className="
  grid
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
  gap-4
  sm:gap-6
">

// Flexbox
<div className="
  flex
  flex-col
  sm:flex-row
  items-center
  justify-between
  gap-4
">
```

### Component Variants
```tsx
const buttonVariants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'bg-transparent hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const buttonSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
};

// Usage with cn utility
<button className={cn(
  'inline-flex items-center justify-center rounded-lg font-medium',
  'transition-colors focus-visible:outline-none focus-visible:ring-2',
  'disabled:opacity-50 disabled:pointer-events-none',
  buttonVariants[variant],
  buttonSizes[size],
  className
)}>
```

### Dark Mode
```tsx
// Class-based dark mode
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-white
  border-gray-200 dark:border-gray-700
">

// tailwind.config.ts
export default {
  darkMode: 'class', // or 'media'
  // ...
}
```

### Animations
```tsx
// Built-in animations
<div className="animate-spin" />
<div className="animate-pulse" />
<div className="animate-bounce" />

// Custom animations in tailwind.config.ts
theme: {
  extend: {
    animation: {
      'fade-in': 'fadeIn 0.3s ease-out',
      'slide-up': 'slideUp 0.3s ease-out',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideUp: {
        '0%': { transform: 'translateY(10px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
    },
  },
}

// Transitions
<button className="
  transition-all
  duration-200
  ease-in-out
  hover:scale-105
  hover:shadow-lg
">
```

### Forms
```tsx
// Input styling
<input className="
  w-full
  rounded-lg
  border border-gray-300
  px-4 py-3
  text-gray-900
  placeholder-gray-400
  transition-colors
  focus:border-brand-500
  focus:outline-none
  focus:ring-2 focus:ring-brand-500/20
  disabled:bg-gray-50 disabled:cursor-not-allowed
" />

// Error state
<input className={cn(
  'w-full rounded-lg border px-4 py-3',
  hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
    : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20'
)} />
```

### Cards and Containers
```tsx
// Card component
<div className="
  rounded-xl
  bg-white
  p-6
  shadow-sm
  ring-1 ring-gray-900/5
  transition-shadow
  hover:shadow-md
">

// Glass morphism
<div className="
  backdrop-blur-lg
  bg-white/80
  rounded-xl
  border border-white/20
  shadow-xl
">

// Gradient background
<div className="
  bg-gradient-to-br
  from-brand-500
  to-brand-700
">
```

## Theme Configuration

### Custom Colors
```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
};
```

### Custom Spacing
```typescript
theme: {
  extend: {
    spacing: {
      '18': '4.5rem',
      '88': '22rem',
      '128': '32rem',
    },
  },
}
```

## Utility Patterns

### cn Helper
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className // Allow override
)} />
```

### Responsive Show/Hide
```tsx
// Hide on mobile, show on desktop
<div className="hidden lg:block" />

// Show on mobile, hide on desktop
<div className="lg:hidden" />
```

### Screen Reader Only
```tsx
<span className="sr-only">Opens in new tab</span>
```

## Best Practices

### Do
- Mobile-first responsive design
- Use semantic class ordering (layout → spacing → sizing → colors → effects)
- Extract repeated patterns to components
- Use CSS variables for dynamic values
- Leverage `@apply` sparingly for truly reusable patterns

### Don't
- Don't use arbitrary values (`p-[17px]`) unless necessary
- Don't fight Tailwind's defaults
- Don't create utility classes with `@apply` for single-use styles
- Don't mix Tailwind with traditional CSS without good reason
