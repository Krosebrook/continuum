# Continuum Custom Coding Agents

This directory contains 15 specialized GitHub Copilot agents tailored specifically for the Continuum repository. Each agent is an expert in a particular domain and references **actual file paths, patterns, and conventions** from this codebase.

## 📋 Agent Catalog

### Code Quality & Standards
1. **[code-reviewer.md](./code-reviewer.md)** - Expert code reviewer for Next.js 16 + TypeScript + React 19
   - Security checks (OWASP Top 10)
   - Performance optimization
   - TypeScript strict mode validation
   - References: Actual CI/CD workflows, audit reports

2. **[typescript-helper.md](./typescript-helper.md)** - TypeScript 5.x specialist
   - Strict mode compliance
   - Type inference and generics
   - References: `tsconfig.json`, strict settings

### Testing
3. **[test-writer.md](./test-writer.md)** - Testing specialist using Vitest + Playwright
   - Unit tests with Vitest (NOT Jest)
   - Component tests with React Testing Library
   - E2E tests with Playwright
   - References: `__tests__/` directory, `vitest.config.ts`

### Feature Development
4. **[component-builder.md](./component-builder.md)** - React 19 component specialist
   - Server vs Client Components
   - TypeScript prop definitions
   - Tailwind CSS 4.x styling
   - References: `components/` directory, actual components

5. **[api-designer.md](./api-designer.md)** - API architect for Next.js 16 Route Handlers
   - RESTful design patterns
   - Zod validation schemas
   - Rate limiting with Upstash Redis
   - References: `app/api/` routes, `lib/schemas/`

6. **[database-architect.md](./database-architect.md)** - Supabase/PostgreSQL specialist
   - Schema design patterns
   - Row-Level Security (RLS) policies
   - Query optimization
   - References: `supabase/schema.sql`, actual tables

### Infrastructure & DevOps
7. **[devops-engineer.md](./devops-engineer.md)** - CI/CD and deployment specialist
   - GitHub Actions workflows
   - Vercel deployment configuration
   - Environment management
   - References: `.github/workflows/`, `vercel.json`

8. **[performance-optimizer.md](./performance-optimizer.md)** - Performance specialist
   - Core Web Vitals optimization
   - Bundle size reduction
   - Server-side rendering strategies
   - References: Next.js 16 patterns, Vercel Edge Network

### Documentation
9. **[docs-writer.md](./docs-writer.md)** - Technical documentation writer
   - README and getting started guides
   - API documentation
   - Architecture Decision Records
   - References: Actual documentation files in repo

### Security & Reliability
10. **[security-auditor.md](./security-auditor.md)** - Security specialist
    - OWASP Top 10 vulnerabilities
    - Authentication and authorization (Supabase Auth)
    - Input validation and sanitization
    - References: `SECURITY.md`, audit reports, RLS policies

11. **[error-handler.md](./error-handler.md)** - Error handling specialist
    - React Error Boundaries
    - API error handling patterns
    - User-friendly error messages
    - References: `components/ErrorBoundary.tsx`, API error patterns

### Styling & Design
12. **[tailwind-stylist.md](./tailwind-stylist.md)** - Tailwind CSS 4.x specialist
    - Responsive design patterns
    - Component styling
    - Mobile-first approach
    - References: `tailwind.config.ts`, actual styled components

13. **[accessibility-checker.md](./accessibility-checker.md)** - Accessibility specialist
    - WCAG 2.1 AA compliance
    - Screen reader compatibility
    - Keyboard navigation
    - References: Accessible components in repo

### Integration & Domain-Specific
14. **[supabase-expert.md](./supabase-expert.md)** - Supabase specialist
    - Database operations
    - Authentication flows
    - Real-time subscriptions
    - References: `lib/supabase-server.ts`, actual query patterns

15. **[n8n-workflow-builder.md](./n8n-workflow-builder.md)** - n8n automation specialist
    - Workflow design for opportunity discovery
    - AI agent orchestration
    - Data enrichment pipelines
    - References: Planned n8n integration patterns

## 🚀 How to Use These Agents

### In GitHub Copilot Chat
Simply reference an agent when asking for help:
```
@workspace Use the test-writer agent to create tests for the new API endpoint
@workspace Apply the security-auditor checklist to review this PR
@workspace Follow the component-builder patterns to create a new Button component
```

### In Pull Requests
Agents can help review your code:
```
@workspace Use the code-reviewer agent to review this PR for security issues
@workspace Check if this follows the patterns in the api-designer agent
```

### For Development Tasks
Get specialized help:
```
@workspace Use the database-architect to design a new table for user preferences
@workspace Use the devops-engineer to add a new GitHub Actions workflow
```

## 🎯 Agent Quality Standards

Every agent in this directory follows these standards:
1. ✅ References **actual file paths** from this repository
2. ✅ Includes **real code patterns** found in the codebase
3. ✅ Lists **specific commands** that work in this repo
4. ✅ Provides **concrete examples** from existing code
5. ✅ Mentions **actual dependencies** and their versions
6. ✅ Links to **real documentation** files

## 📚 Related Files

- **[copilot-instructions.md](../copilot-instructions.md)** - Repository-wide Copilot instructions
- **[copilot-setup-steps.yml](../copilot-setup-steps.yml)** - Environment setup for agents
- **[ARCHITECTURE.md](../../ARCHITECTURE.md)** - System architecture documentation
- **[CONTRIBUTING.md](../../CONTRIBUTING.md)** - Contribution guidelines

## 🔄 Updating Agents

When the codebase evolves, update agents to reflect new patterns:
1. Update file paths if structure changes
2. Add new patterns as they emerge
3. Remove obsolete patterns
4. Keep examples current with latest code
5. Update version numbers and dependencies

## 📖 Agent Template

When creating new agents, follow this structure:
```markdown
# Agent Name

## Role
One sentence describing the agent's specialty

## Expertise
- Bullet list of skills
- Technology-specific knowledge

## Repository Context
- Actual file paths
- Existing implementations
- Commands that work
- Configuration files

## [Relevant Section]
Code examples using REAL patterns from the repo
```

## 🤝 Contributing

To improve these agents:
1. Test agents with real tasks
2. Submit feedback via GitHub Issues
3. Propose new agents for gaps
4. Keep agents updated with code changes

---

**Last Updated**: February 2026  
**Agent Count**: 15  
**Coverage**: Code quality, testing, development, infrastructure, security, documentation
