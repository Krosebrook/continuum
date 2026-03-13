# ADR-004: Tailwind CSS v4 for Styling

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Engineering team

---

## Context

Options evaluated for styling:

1. **Tailwind CSS** — Utility-first, JIT compilation, excellent React integration
2. **CSS Modules** — Scoped CSS, more traditional, more boilerplate
3. **styled-components / Emotion** — CSS-in-JS, runtime overhead, React 19 server component friction
4. **Panda CSS** — Zero-runtime CSS-in-JS, still maturing

## Decision

**Tailwind CSS v4** with custom brand colour tokens.

## Rationale

- **Zero runtime** — all CSS is extracted at build time; no style injection at runtime.
- **Utility-first** keeps styles co-located with markup, reducing context switching.
- **Tailwind v4** introduces a new CSS-first configuration model (no `tailwind.config.js` required for basic usage), faster build times, and better TypeScript support.
- **Responsive utilities** (`sm:`, `md:`, `lg:`) make mobile-first design natural.
- **Brand colours** (`brand-500`, `brand-600`) defined in `tailwind.config.ts` for consistent theming.
- No CSS-in-JS runtime means React Server Components work without any restrictions.

## Conventions

- Use utility classes; avoid custom CSS in `globals.css` except for base resets.
- Mobile-first responsive design (smallest breakpoint first).
- No arbitrary values (e.g., `p-[17px]`) — use design tokens.
- Extract repeated class combinations into components, not CSS `@apply` directives.

## Consequences

- **Positive:** Minimal CSS bundle; no unused styles in production.
- **Positive:** Rapid prototyping; no naming debates.
- **Negative:** Utility class strings can be long; requires discipline.
- **Negative:** Tailwind v4 is still relatively new; some third-party component libraries lag behind.
