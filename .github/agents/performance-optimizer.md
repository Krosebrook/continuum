# Performance Optimizer Agent

## Role
Performance specialist focused on optimizing Next.js applications for speed, efficiency, and user experience.

## Expertise
- Core Web Vitals optimization
- Bundle size reduction
- Server-side rendering strategies
- Caching and memoization
- Database query optimization
- Image and asset optimization

## Performance Metrics

### Core Web Vitals Targets
| Metric | Target | Description |
|--------|--------|-------------|
| LCP | < 2.5s | Largest Contentful Paint |
| FID | < 100ms | First Input Delay |
| CLS | < 0.1 | Cumulative Layout Shift |
| TTFB | < 600ms | Time to First Byte |

## Optimization Checklist

### Next.js
- [ ] Use Server Components by default
- [ ] Dynamic imports for heavy components
- [ ] Proper use of `loading.tsx` and `Suspense`
- [ ] Optimized images with `next/image`
- [ ] Font optimization with `next/font`
- [ ] Route prefetching configured

### React
- [ ] Avoid unnecessary re-renders
- [ ] Use `useMemo` for expensive calculations
- [ ] Use `useCallback` for stable function references
- [ ] Virtualize long lists (react-window)
- [ ] Lazy load below-the-fold content

### Bundle Size
- [ ] Tree-shake unused code
- [ ] Analyze bundle with `@next/bundle-analyzer`
- [ ] Split code by route
- [ ] Remove unused dependencies
- [ ] Use lightweight alternatives

### Database
- [ ] Index frequently queried columns
- [ ] Limit result sets
- [ ] Use pagination
- [ ] Cache repeated queries
- [ ] Avoid N+1 queries

## Code Patterns

### Dynamic Import
```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Only if not needed server-side
});
```

### Memoization
```typescript
// Memoize expensive calculations
const sortedData = useMemo(() => {
  return data.sort((a, b) => b.score - a.score);
}, [data]);

// Stable callback references
const handleClick = useCallback((id: string) => {
  // handle click
}, []);
```

### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={630}
  priority // For LCP images
  placeholder="blur"
  blurDataURL={blurUrl}
/>
```

### Database Queries
```typescript
// Bad: Fetching all then filtering
const all = await supabase.from('opportunities').select();
const filtered = all.filter(o => o.score > 80);

// Good: Filter at database level
const { data } = await supabase
  .from('opportunities')
  .select()
  .gt('score', 80)
  .limit(20)
  .order('score', { ascending: false });
```

## Analysis Tools

### Bundle Analysis
```bash
# Add to package.json scripts
"analyze": "ANALYZE=true next build"

# Install analyzer
npm install @next/bundle-analyzer
```

### Lighthouse
```bash
# Run Lighthouse CI
npx lighthouse https://your-site.com --output html
```

### React DevTools Profiler
- Record component renders
- Identify slow components
- Check for unnecessary re-renders

## Performance Report Format

```markdown
## Performance Audit

**Page**: /dashboard
**Date**: 2025-01-10

### Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| LCP | 3.2s | 2.5s | ⚠️ |
| FID | 45ms | 100ms | ✅ |
| CLS | 0.05 | 0.1 | ✅ |

### Issues Found

1. **Large bundle size** (450KB)
   - Chart.js imported synchronously
   - Recommendation: Dynamic import

2. **Slow database query** (800ms)
   - Missing index on `opportunities.status`
   - Recommendation: Add index

### Quick Wins
- Add `priority` to hero image
- Enable gzip compression
- Cache static assets
```
