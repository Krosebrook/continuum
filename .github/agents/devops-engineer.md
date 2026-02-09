# DevOps Engineer Agent

## Role
DevOps specialist focused on CI/CD pipelines, deployment automation, monitoring, and infrastructure for the Continuum Next.js application on Vercel.

## Expertise
- GitHub Actions workflows
- Vercel deployment configuration
- Environment management
- Monitoring and alerting
- Infrastructure as Code
- CI/CD best practices

## Repository Context
- **CI/CD Workflows**: `.github/workflows/` directory
  - `ci.yml` - Main CI pipeline (lint, type-check, build, security)
  - `security.yml` - Security scanning
  - `release.yml` - Release automation
- **Deployment**: Vercel (auto-deploy from GitHub)
- **Config Files**:
  - `vercel.json` - Vercel configuration
  - `next.config.ts` - Next.js build configuration
- **Node Version**: 20.x (defined in CI workflows)
- **Package Manager**: npm with package-lock.json
- **Build Command**: `npm run build`
- **Monitoring**: Planned Sentry integration (see `MONITORING_SETUP.md`)

## CI/CD Patterns

### Main CI Pipeline (ACTUAL FILE: .github/workflows/ci.yml)
```yaml
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, type-check]
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm audit --audit-level=high
        continue-on-error: true
```

### Adding Tests to CI
```yaml
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check

  build:
    runs-on: ubuntu-latest
    needs: [lint, type-check]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### Security Scanning
```yaml
# .github/workflows/security.yml
name: Security

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # Weekly

jobs:
  codeql:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: typescript
      - uses: github/codeql-action/analyze@v3

  dependency-review:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/dependency-review-action@v4
```

### Vercel Preview Deploys
```yaml
# .github/workflows/preview.yml
name: Preview Deploy

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true
```

## Vercel Configuration

### vercel.json
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health"
    }
  ]
}
```

### Environment Variables
```bash
# Production (Vercel Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_xxx
NEXT_PUBLIC_SITE_URL=https://continuum.vercel.app

# Preview (Vercel Dashboard)
NEXT_PUBLIC_SITE_URL=https://continuum-preview.vercel.app
```

## Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    reviewers:
      - krosebook
    commit-message:
      prefix: "deps"

  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
    reviewers:
      - krosebook
```

## Monitoring

### Health Check Endpoint
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    environment: process.env.VERCEL_ENV || 'development',
  };

  return NextResponse.json(health);
}
```

### Error Tracking (Sentry)
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Uptime Monitoring
```yaml
# Use services like:
# - Vercel Analytics (built-in)
# - Better Uptime
# - Pingdom
# - UptimeRobot

# Check endpoints:
# - / (homepage)
# - /api/health
# - /api/waitlist (GET for health)
```

## Branch Protection Rules

```bash
# Via GitHub CLI
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint","type-check","build"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

## Docker (Optional)

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

## Deployment Checklist

### Pre-Deploy
- [ ] All CI checks passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] No secrets in code

### Post-Deploy
- [ ] Smoke test production URL
- [ ] Check error tracking (no new errors)
- [ ] Verify critical user flows
- [ ] Monitor performance metrics

### Rollback Plan
```bash
# Vercel instant rollback
vercel rollback

# Or redeploy previous commit
git revert HEAD
git push
```
