# Contributing to Continuum

Thank you for your interest in contributing to Continuum! This document provides guidelines and instructions for contributing to the project.

## 🎯 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Questions](#questions)

## 📜 Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please see [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for details.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Supabase** account (for database)
- **Git** for version control

### Local Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/continuum.git
   cd continuum
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Krosebrook/continuum.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

6. **Set up the database**:
   - Create a Supabase project
   - Run the SQL in `supabase/schema.sql` in the SQL Editor

7. **Start the development server**:
   ```bash
   npm run dev
   ```

8. **Verify the setup**:
   - Open http://localhost:3000
   - Test the waitlist form submission

## 🔄 Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring

### Working on a Feature

1. **Sync with upstream**:
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** following the [coding standards](#coding-standards)

4. **Test your changes**:
   ```bash
   npm run lint         # Lint code
   npm run type-check   # Type check
   npm run build        # Test build
   npm test             # Run tests (when available)
   ```

5. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Formatting changes
   - `refactor:` - Code restructuring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** on GitHub

## 💻 Coding Standards

### TypeScript

- **Strict mode enabled** - No `any` types allowed
- **Explicit return types** for all functions
- Use **interfaces** for object shapes
- Use **types** for unions and intersections
- Prefer `unknown` over `any` for truly unknown types

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
}

function getUser(id: string): Promise<User | null> {
  // implementation
}

// ❌ Bad
function getUser(id: any): any {
  // implementation
}
```

### React Components

- Use **function components** with TypeScript
- Define **explicit prop interfaces**
- Use **Server Components** by default
- Only use `'use client'` when necessary
- Prefer **controlled components** for forms

```typescript
// ✅ Good
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

### Styling

- Use **Tailwind CSS utility classes**
- **Mobile-first** responsive design (`sm:`, `md:`, `lg:`)
- Use **brand colors** from theme (`brand-500`, `brand-600`)
- Avoid custom CSS classes

```tsx
// ✅ Good
<div className="p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-sm">

// ❌ Bad - arbitrary values
<div className="p-[17px] bg-[#0284c7]">
```

### API Routes

- **Validate all input** with Zod schemas
- Return **proper HTTP status codes**
- Handle errors gracefully with try-catch
- Use `NextResponse.json()` for responses
- **Sanitize error messages** before returning

```typescript
// ✅ Good
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    
    // Process request...
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Database

- Use **snake_case** for table and column names
- Add **indexes** for foreign keys and frequently filtered columns
- Always define **RLS policies** for multi-tenant tables
- Use **parameterized queries** (Supabase handles this)

## 📥 Pull Request Process

### Before Submitting

1. **Update documentation** if you changed APIs or added features
2. **Run all checks**:
   ```bash
   npm run lint
   npm run type-check
   npm run build
   npm test  # when tests are available
   ```
3. **Test manually** in your browser
4. **Update CHANGELOG.md** if applicable

### PR Template

When opening a PR, fill out the template completely:

- **Summary**: Brief description of changes
- **Changes**: List of key modifications
- **Type of Change**: Bug fix, feature, docs, etc.
- **Testing**: How you tested your changes
- **Screenshots**: For UI changes
- **Related Issues**: Link to issues

### Review Process

1. **Automated checks** must pass (linting, type checking, build)
2. **Code review** by at least one maintainer
3. **Address feedback** and push updates
4. **Approval** from maintainer
5. **Merge** by maintainer (squash merge preferred)

### After Merge

- Your branch will be automatically deleted
- Changes will be deployed to staging (if configured)
- Production deployment after additional testing

## 🧪 Testing Guidelines

### Unit Tests (when available)

- Test **pure functions** and utilities
- Mock **external dependencies** (Supabase, Resend)
- Use **descriptive test names**

```typescript
describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

### Integration Tests

- Test **API routes** with realistic data
- Verify **database state** changes
- Test **error scenarios**

### E2E Tests (when available)

- Use **Playwright** for critical user flows
- Test **form submissions** and navigation
- Verify **UI renders** correctly

## 📚 Documentation

### Code Comments

- Add comments for **complex logic** only
- Use **JSDoc** for public functions
- Keep comments **up-to-date** with code

```typescript
/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - Raw user input string
 * @returns Sanitized string safe for HTML rendering
 */
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input.trim());
}
```

### Markdown Documentation

- Update **README.md** for user-facing changes
- Update **ARCHITECTURE.md** for structural changes
- Update **API.md** for API changes
- Keep **CHANGELOG.md** current

### Inline Documentation

- Use **clear variable names** (documentation through clarity)
- Add **type annotations** for complex types
- Document **non-obvious** behavior

## ❓ Questions

### Where to Ask

- **General questions**: GitHub Discussions
- **Bug reports**: GitHub Issues
- **Security issues**: See [SECURITY.md](./SECURITY.md)
- **Direct contact**: hello@continuum.dev

### Before Asking

1. **Search existing issues** and discussions
2. **Check documentation** (README, ARCHITECTURE, API docs)
3. **Review code examples** in the repository
4. **Try debugging** with console logs

## 🎁 Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Credited in CHANGELOG.md

Thank you for contributing to Continuum! 🚀
