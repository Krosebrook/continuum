# TypeScript Helper Agent

## Role
TypeScript specialist focused on type safety, generics, utility types, and best practices for the Continuum Next.js 16 application.

## Expertise
- TypeScript 5.x strict mode
- Generic types and constraints
- Utility types (Pick, Omit, Partial, etc.)
- Type inference strategies
- Declaration files
- Type guards and narrowing

## Repository Context
- **TypeScript Version**: 5.x
- **Config**: `tsconfig.json` with strict mode enabled
- **Type Check Command**: `npm run type-check` (runs `tsc --noEmit`)
- **Path Aliases**: `@/*` maps to root directory
- **Strict Settings**: 
  - `strict: true`
  - No implicit any
  - Strict null checks enabled
- **Target**: ES2017
- **Module**: ESNext with bundler resolution

## Type Patterns

### Component Props
```typescript
// Extending HTML element props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

// With children
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Polymorphic components
type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicProps<C extends React.ElementType, Props = object> =
  Props &
  AsProp<C> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;
```

### API Response Types
```typescript
// Success/Error union
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Pagination wrapper
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// Usage
async function getOpportunities(): Promise<ApiResponse<PaginatedResponse<Opportunity>>> {
  // ...
}
```

### Database Types (Supabase)
```typescript
// Generated types from Supabase
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];

// Table row type
type Opportunity = Tables['opportunities']['Row'];

// Insert type
type OpportunityInsert = Tables['opportunities']['Insert'];

// Update type
type OpportunityUpdate = Tables['opportunities']['Update'];

// With relationships
type OpportunityWithContacts = Opportunity & {
  contacts: Tables['opportunity_contacts']['Row'][];
};
```

### Zod Integration
```typescript
import { z } from 'zod';

// Define schema
const opportunitySchema = z.object({
  company_name: z.string().min(1).max(255),
  domain: z.string().url().optional(),
  fit_score: z.number().min(0).max(100).optional(),
});

// Infer type from schema
type OpportunityInput = z.infer<typeof opportunitySchema>;

// Type guard
function isOpportunityInput(data: unknown): data is OpportunityInput {
  return opportunitySchema.safeParse(data).success;
}
```

### Utility Types
```typescript
// Make specific properties optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Deep partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Non-nullable properties
type NonNullableProps<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

// Extract function return type
type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : never;
```

### Type Guards
```typescript
// Type narrowing
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

// Discriminated unions
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function handleResult<T>(result: Result<T>) {
  if (result.ok) {
    // TypeScript knows result.value exists
    console.log(result.value);
  } else {
    // TypeScript knows result.error exists
    console.error(result.error);
  }
}
```

### Generic Constraints
```typescript
// Constrain to object with id
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Constrain to keys of object
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Multiple constraints
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}
```

## Best Practices

### Strict Mode Settings
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Avoid
```typescript
// ❌ any
function process(data: any) { ... }

// ❌ Type assertions without validation
const user = data as User;

// ❌ Non-null assertion without checking
const name = user.name!;

// ❌ Implicit any in callbacks
items.map(item => item.id);
```

### Prefer
```typescript
// ✅ unknown with type guards
function process(data: unknown) {
  if (isValidData(data)) { ... }
}

// ✅ Type validation
const parsed = userSchema.parse(data);

// ✅ Optional chaining
const name = user?.name ?? 'Unknown';

// ✅ Explicit types in callbacks
items.map((item: Item) => item.id);
```

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Type 'X' is not assignable to type 'Y'` | Type mismatch | Check types, add assertion or type guard |
| `Object is possibly 'undefined'` | Missing null check | Add optional chaining or null check |
| `Property 'X' does not exist on type 'Y'` | Wrong property name | Check spelling, extend type if needed |
| `Argument of type 'X' is not assignable to parameter of type 'Y'` | Wrong argument type | Cast, narrow, or fix function signature |
