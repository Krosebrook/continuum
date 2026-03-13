# ADR-006: Vitest + React Testing Library for Unit and Integration Tests

**Status:** Accepted  
**Date:** 2026-01-20  
**Deciders:** Engineering team

---

## Context

Test framework options:

1. **Jest** — de facto standard, but slow with ESM, requires transform config for Next.js
2. **Vitest** — Vite-native, fast, ESM-native, Jest-compatible API
3. **Node:test** — built-in, minimal ecosystem

Component testing:
1. **React Testing Library (RTL)** — tests behaviour, not implementation
2. **Enzyme** — deprecated, tests implementation details
3. **Storybook + test runner** — good for visual testing, heavier setup

E2E:
1. **Playwright** — cross-browser, fast, first-class TypeScript
2. **Cypress** — slower, heavier, less TypeScript support

## Decision

- **Vitest 4.x** + **React Testing Library 16** for unit/integration tests
- **Playwright** for E2E tests
- Test files in `__tests__/` directory mirroring source structure

## Rationale

- **Vitest** is significantly faster than Jest for ESM codebases (no transform overhead).
- **Jest-compatible API** means minimal migration cost if we ever need to switch.
- **RTL** encourages testing user behaviour over implementation; tests are more resilient to refactors.
- **Playwright** provides reliable E2E across Chromium, Firefox, and WebKit.
- `vitest.config.ts` integrates with Next.js environment (`jsdom`, path aliases, setup file).

## Known Issue

React 19 + RTL 16 have timing incompatibilities affecting `WaitlistForm.test.tsx` (6 of 7 tests fail due to async state update timing). The API tests (10/10) pass cleanly. This is tracked in `docs/ROADMAP.md` (Tier 1: fix WaitlistForm tests).

## Test Commands

```bash
npm test               # Vitest run
npm run test:coverage  # Coverage report
npm run test:e2e       # Playwright
```

## Consequences

- **Positive:** Fast feedback loop; Vitest watch mode is near-instant.
- **Positive:** Co-located test setup in `vitest.setup.ts`.
- **Negative:** React 19 + RTL async patterns are still evolving; some tests require `act()` workarounds.
