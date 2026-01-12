# Deployment & Troubleshooting Guide

## 📋 Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Local Development Issues](#local-development-issues)
- [Database Issues](#database-issues)
- [API Issues](#api-issues)
- [Vercel Deployment Issues](#vercel-deployment-issues)
- [Environment Variables](#environment-variables)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)

## ✅ Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All environment variables configured in Vercel
- [ ] Database schema deployed to production Supabase
- [ ] RLS policies enabled and tested
- [ ] Security headers configured in `vercel.json`
- [ ] Rate limiting configured (Upstash Redis)
- [ ] Email service configured (Resend) or disabled gracefully
- [ ] Domain configured in Vercel
- [ ] SSL certificate active
- [ ] `npm run build` succeeds locally
- [ ] `npm run lint` passes with no errors
- [ ] `npm run type-check` passes

## 🔧 Local Development Issues

### Issue: "Module not found" errors

**Symptoms**: Import errors, missing dependencies

**Solutions**:
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### Issue: Port 3000 already in use

**Symptoms**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Find process on port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=3001 npm run dev
```

### Issue: Hot reload not working

**Symptoms**: Changes don't reflect without manual refresh

**Solutions**:
1. Check if watching too many files (Next.js limit)
2. Restart dev server
3. Check if `.next` directory has write permissions
4. Try clearing cache: `rm -rf .next`

### Issue: TypeScript errors in IDE but build succeeds

**Symptoms**: Red squiggles in VS Code but `npm run build` works

**Solutions**:
```bash
# Reload VS Code TypeScript server
# In VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Or restart VS Code
# Or check tsconfig.json is valid
npm run type-check
```

## 🗄️ Database Issues

### Issue: "Supabase configuration missing"

**Symptoms**: Error on page load or API call

**Solutions**:
1. Check `.env.local` exists and has values:
   ```bash
   cat .env.local
   ```

2. Verify environment variables are set:
   ```bash
   # Should see your Supabase URL
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

3. Restart dev server after changing env vars:
   ```bash
   # Changes to .env.local require restart
   # Stop server (Ctrl+C) and restart
   npm run dev
   ```

### Issue: "relation 'waitlist' does not exist"

**Symptoms**: Database query fails, table not found

**Solutions**:
1. Verify schema was run in Supabase:
   ```sql
   -- In Supabase SQL Editor, check if table exists
   SELECT * FROM waitlist LIMIT 1;
   ```

2. If table doesn't exist, run schema:
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Copy contents of `supabase/schema.sql`
   - Paste and click "Run"

3. Check you're connected to correct Supabase project:
   - Verify `NEXT_PUBLIC_SUPABASE_URL` matches your project

### Issue: "Row Level Security policy violation"

**Symptoms**: `new row violates row-level security policy` error

**Solutions**:
1. Verify RLS policies are created:
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM pg_policies WHERE tablename = 'waitlist';
   ```

2. Check if using correct API key:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side
   - `SUPABASE_SERVICE_ROLE_KEY` for API routes (bypasses RLS)

3. Review RLS policies in `supabase/schema.sql`

### Issue: "duplicate key value violates unique constraint"

**Symptoms**: Email already exists error

**Solutions**:
1. This is expected behavior - email is unique
2. User should use different email
3. Or implement "Already subscribed" flow
4. Check database for existing entry:
   ```sql
   SELECT * FROM waitlist WHERE email = 'user@example.com';
   ```

## 🔌 API Issues

### Issue: API returns 500 error

**Symptoms**: "Internal server error" response

**Solutions**:
1. Check server logs:
   ```bash
   # In terminal running dev server
   # Look for error stack traces
   ```

2. Check Vercel logs (production):
   - Go to Vercel Dashboard → Your Project → Logs
   - Filter by Functions
   - Look for errors with timestamp

3. Common causes:
   - Missing environment variable
   - Database connection failed
   - Invalid Supabase credentials
   - Resend API key invalid (if email enabled)

### Issue: API returns 400 "Invalid email address"

**Symptoms**: Validation error on valid email

**Solutions**:
1. Check email format:
   ```typescript
   // Valid formats
   "user@example.com"
   "user+tag@example.co.uk"
   
   // Invalid formats
   "user@example"  // Missing TLD
   "user"          // Not an email
   "@example.com"  // Missing local part
   ```

2. Try different email to isolate issue

3. Check Zod schema in `app/api/waitlist/route.ts`

### Issue: API returns 429 "Too many requests"

**Symptoms**: Rate limit exceeded

**Solutions**:
1. **Expected behavior** - 3 submissions per hour per IP

2. Wait 1 hour or check rate limit reset time:
   ```json
   {
     "error": "Too many requests",
     "reset": 1640000000  // Unix timestamp
   }
   ```

3. For development, use different IP or temporarily disable rate limiting

4. For production abuse, review Upstash Redis dashboard

### Issue: Email not sending

**Symptoms**: User doesn't receive confirmation email

**Solutions**:
1. **Check if Resend is configured**:
   ```bash
   echo $RESEND_API_KEY
   # If empty, emails won't send (but form still works)
   ```

2. Check Resend dashboard:
   - Go to [resend.com/emails](https://resend.com/emails)
   - Look for email in list
   - Check status (Sent, Failed, Bounced)

3. Common issues:
   - Invalid API key
   - Email not verified in Resend
   - Using default sender (onboarding@resend.dev) - ok for testing
   - User's email blocked/invalid
   - User's email provider blocking (check spam folder)

4. Verify email in server logs:
   ```bash
   # Look for "Resend error (non-fatal)"
   # Email failure doesn't block form submission
   ```

## 🚀 Vercel Deployment Issues

### Issue: Build fails with "Module not found"

**Symptoms**: Deployment fails during build step

**Solutions**:
1. Verify dependencies in `package.json`:
   ```bash
   npm install  # Locally
   ```

2. Check for typos in import statements

3. Ensure all imports use correct paths:
   ```typescript
   // Good
   import { Component } from '@/components/Component';
   
   // Bad (if tsconfig doesn't support)
   import { Component } from '../../../components/Component';
   ```

4. Check `tsconfig.json` has path aliases configured

### Issue: Environment variables not working in production

**Symptoms**: "Configuration missing" errors in production

**Solutions**:
1. Add environment variables in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all vars from `.env.local`
   - Set environment: Production, Preview, Development

2. **Important**: Click "Redeploy" after adding env vars:
   - Deployments → Three dots → Redeploy
   - New deployment will include env vars

3. Verify env vars are set:
   - In Vercel logs, check for "Missing environment variable" errors

4. **Client-side env vars must start with `NEXT_PUBLIC_`**:
   ```bash
   # Will work in browser
   NEXT_PUBLIC_SUPABASE_URL=...
   
   # Will NOT work in browser (server-side only)
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

### Issue: "Serverless Function has timed out"

**Symptoms**: API requests timeout after 10 seconds

**Solutions**:
1. Increase timeout in `vercel.json`:
   ```json
   {
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

2. Optimize database queries (add indexes)

3. Check Supabase region matches Vercel region

4. For long operations, consider:
   - Background jobs
   - Webhooks
   - Queue system (Upstash Queue)

### Issue: Domain not working after adding

**Symptoms**: Domain shows 404 or Vercel default page

**Solutions**:
1. Wait 24-48 hours for DNS propagation

2. Verify DNS records:
   ```bash
   dig your-domain.com
   # Should point to Vercel (76.76.21.21 or similar)
   ```

3. Check Vercel domain settings:
   - Project Settings → Domains
   - Ensure domain is verified
   - Click "Refresh" if stuck

4. Clear DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Windows
   ipconfig /flushdns
   ```

## 🔐 Environment Variables

### Required Variables

```bash
# Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email (Optional)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=waitlist@yourdomain.com

# Site Config
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Rate Limiting (Required for production)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### Validation Script

Create `scripts/check-env.js`:
```javascript
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

Run before deployment:
```bash
node scripts/check-env.js
```

## ⚡ Performance Issues

### Issue: Slow page load times

**Solutions**:
1. Check Vercel Analytics:
   - Look at Core Web Vitals
   - Identify slow components

2. Enable Server Components:
   - Remove `'use client'` where not needed
   - Only use for interactive components

3. Optimize images:
   ```typescript
   import Image from 'next/image';
   
   <Image 
     src="/hero.jpg" 
     alt="Hero" 
     width={1200} 
     height={630}
     priority  // For above-fold images
   />
   ```

4. Review bundle size:
   ```bash
   npm run build
   # Check "First Load JS" column
   # Should be < 100KB for landing page
   ```

### Issue: API responses slow

**Solutions**:
1. Add database indexes:
   ```sql
   CREATE INDEX idx_waitlist_email ON waitlist(email);
   ```

2. Check Supabase region:
   - Should match Vercel deployment region
   - US East (N. Virginia) is common default

3. Enable connection pooling in Supabase

4. Review query performance in Supabase dashboard

## 🔒 Security Issues

### Issue: Anon key exposed in client code

**Status**: Expected - not a security issue

**Why it's safe**:
- Anon key is meant to be public
- RLS policies protect data
- Row-level security prevents unauthorized access

**Monitor for abuse**:
- Check Supabase dashboard for unusual activity
- Review API logs for suspicious patterns
- Rotate key if compromised

### Issue: Rate limiting not working

**Symptoms**: Can submit form unlimited times

**Solutions**:
1. Verify Upstash Redis is configured:
   ```bash
   echo $UPSTASH_REDIS_REST_URL
   echo $UPSTASH_REDIS_REST_TOKEN
   ```

2. Check rate limiting code in `app/api/waitlist/route.ts`

3. Test rate limiting:
   ```bash
   # Submit 4 times quickly
   for i in {1..4}; do
     curl -X POST http://localhost:3000/api/waitlist \
       -H "Content-Type: application/json" \
       -d '{"email":"test'$i'@example.com"}';
   done
   # 4th should return 429
   ```

4. Review Upstash dashboard for rate limit hits

## 📞 Getting Help

### Before Asking for Help

1. Check this guide
2. Review error messages carefully
3. Check Vercel/Supabase logs
4. Search GitHub Issues
5. Try debugging with console logs

### Where to Get Help

- **GitHub Issues**: [github.com/Krosebrook/continuum/issues](https://github.com/Krosebrook/continuum/issues)
- **Email**: hello@continuum.dev
- **Documentation**: See README.md, ARCHITECTURE.md, API.md

### What to Include in Bug Reports

1. **Environment**: Local dev or production?
2. **Error message**: Full error text
3. **Steps to reproduce**: Detailed steps
4. **Expected behavior**: What should happen?
5. **Actual behavior**: What actually happens?
6. **Screenshots**: If UI-related
7. **Logs**: Relevant log excerpts

### Example Bug Report

```markdown
**Environment**: Production (Vercel)

**Error**: "Supabase configuration missing"

**Steps to reproduce**:
1. Deploy to Vercel
2. Visit homepage
3. Submit waitlist form
4. Error appears

**Expected**: Form submits successfully

**Actual**: Error message shown

**Logs**:
```
[2026-01-12T10:30:00.000Z] ERROR: Supabase configuration missing
```

**Screenshots**: [attached]
```

---

**Last Updated**: January 2026  
**Version**: 1.0
