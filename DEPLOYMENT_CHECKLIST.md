# Deployment Checklist

This document provides a quick checklist to ensure your Continuum application is ready for deployment.

## ✅ Pre-Deployment Verification

### 1. Build & Test Locally

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Run type check
npm run type-check

# Build for production (with mock env vars if needed)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-key \
npm run build

# Verify no errors in output
```

### 2. Environment Variables Setup

#### Required for Production:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret, server-side only)

#### Optional (but recommended):
- [ ] `RESEND_API_KEY` - For sending waitlist confirmation emails
- [ ] `RESEND_FROM_EMAIL` - Verified sender email (e.g., `waitlist@yourdomain.com`)
- [ ] `UPSTASH_REDIS_REST_URL` - For rate limiting
- [ ] `UPSTASH_REDIS_REST_TOKEN` - For rate limiting
- [ ] `NEXT_PUBLIC_SITE_URL` - Your production URL (e.g., `https://continuum.vercel.app`)

### 3. Database Setup (Supabase)

- [ ] Supabase project created
- [ ] Database schema applied from `supabase/schema.sql`
- [ ] Row-Level Security (RLS) policies enabled
- [ ] Verified table exists: `waitlist`
- [ ] Test insert works from Supabase dashboard

### 4. Third-Party Services (Optional)

#### Resend (Email Service)
- [ ] Account created at [resend.com](https://resend.com)
- [ ] API key generated
- [ ] Sender email verified (or using `onboarding@resend.dev` for testing)

#### Upstash Redis (Rate Limiting)
- [ ] Account created at [upstash.com](https://upstash.com)
- [ ] Redis database created
- [ ] REST API credentials obtained

### 5. Vercel Deployment

#### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables via dashboard after deployment
# Project Settings → Environment Variables
```

#### Option B: Deploy via GitHub Integration
1. [ ] Code pushed to GitHub repository
2. [ ] Repository connected to Vercel
3. [ ] Environment variables added in Vercel Dashboard
4. [ ] Auto-deploy on push enabled (optional)

### 6. Post-Deployment Verification

- [ ] Visit production URL - homepage loads
- [ ] Test waitlist form submission
- [ ] Check Supabase dashboard - entry appears in `waitlist` table
- [ ] Verify confirmation email sent (if Resend configured)
- [ ] Test rate limiting (submit 4+ times quickly, expect 429 after 3rd)
- [ ] Check all environment variables are set in Vercel
- [ ] Verify SSL certificate is active
- [ ] Test on mobile device/responsive design
- [ ] Check browser console for errors
- [ ] Verify API endpoint: `/api/waitlist` returns 200 for GET

### 7. Security Checklist

- [ ] `.env.local` in `.gitignore` (never commit secrets)
- [ ] Service role key only used server-side (API routes)
- [ ] Rate limiting enabled (Upstash Redis configured)
- [ ] RLS policies active on all Supabase tables
- [ ] Security headers configured in `vercel.json`
- [ ] No API keys or secrets in client-side code
- [ ] Content Security Policy headers (if needed)

### 8. Performance Checklist

- [ ] Images optimized (using `next/image`)
- [ ] Fonts loading properly with fallbacks
- [ ] Build size < 100KB for landing page
- [ ] Server Components used (minimal client-side JS)
- [ ] No console errors in production
- [ ] Lighthouse score > 90 (optional)

### 9. Documentation

- [ ] README.md updated with deployment instructions
- [ ] DEPLOYMENT.md reviewed for troubleshooting
- [ ] Environment variables documented in `.env.example`
- [ ] API endpoints documented in API.md

## 🚀 Quick Deploy Command

For a fast deployment to Vercel with GitHub:

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Go to vercel.com/new
# 3. Import your GitHub repository
# 4. Add environment variables
# 5. Click Deploy!
```

## 🔄 CI/CD Workflow

The project includes GitHub Actions workflows for:

- **CI Pipeline** (`.github/workflows/ci.yml`) - Runs on every push/PR
  - Linting
  - Type checking
  - Build verification
  - Security audit

- **Security Scan** (`.github/workflows/security.yml`) - Dependency scanning
- **Release** (`.github/workflows/release.yml`) - Automated releases

### Required GitHub Secrets for CI:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are needed for the build step in CI. Add them in:
`GitHub Repo → Settings → Secrets and variables → Actions → New repository secret`

## 🐛 Common Issues

### Build Fails: "Supabase configuration missing"
**Solution**: The build now uses mock values by default. Ensure CI workflow has environment variables set.

### Build Fails: "Failed to fetch Inter from Google Fonts"
**Solution**: Fixed! Fonts now load via CSS with fallback to system fonts.

### TypeScript Errors in CI
**Solution**: All fixed! Run `npm run type-check` locally to verify.

### Deployment Succeeds but Form Doesn't Work
**Solution**: 
1. Verify environment variables in Vercel Dashboard
2. Click "Redeploy" after adding env vars
3. Check Vercel function logs for errors

## 📞 Support

If you encounter issues:

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting
2. Review Vercel deployment logs
3. Check Supabase logs
4. Open an issue on GitHub: [github.com/Krosebrook/continuum/issues](https://github.com/Krosebrook/continuum/issues)

## 📋 Deployment Status

After completing this checklist, your application should be:

- ✅ Building successfully
- ✅ Deployable to Vercel
- ✅ All environment variables configured
- ✅ Database schema applied
- ✅ Security best practices followed
- ✅ Ready for production traffic

---

**Last Updated**: January 2026  
**Version**: 1.0
