# Continuum Landing Page

AI-powered opportunity discovery platform. Save your most precious resource for the important stuff.

## Quick Start (10 Minutes to Deploy)

### Step 1: Create Supabase Project (3 min)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in:
   - **Name:** `continuum-prod`
   - **Database Password:** Generate a strong one (save it!)
   - **Region:** Choose closest to you
4. Click **Create new project** and wait ~2 minutes

### Step 2: Run Database Schema (2 min)

1. In Supabase Dashboard → **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy entire contents of `supabase/schema.sql`
4. Paste into the query editor
5. Click **Run** (bottom right)
6. You should see "Success. No rows returned" - that's correct!

### Step 3: Get API Keys (1 min)

1. In Supabase → **Settings** → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Configure Environment (1 min)

Open `.env.local` and fill in your values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
RESEND_API_KEY=           # Optional - for email confirmations
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 5: Install & Run Locally (2 min)

```bash
cd D:\projects\continuum
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the landing page!

### Step 6: Test the Form

1. Enter your email in the waitlist form
2. Click "Join Waitlist"
3. Check Supabase → **Table Editor** → **waitlist** - you should see your entry!

### Step 7: Deploy to Vercel (1 min)

**Option A: Vercel CLI**
```bash
npm install -g vercel
vercel
```
Follow prompts, then add environment variables in Vercel dashboard.

**Option B: GitHub + Vercel Dashboard**
1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/continuum.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Add environment variables (same as `.env.local`)
5. Deploy!

---

## Optional: Email Confirmations (Resend)

To send confirmation emails when users join the waitlist:

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. For production, verify your domain (Settings → Domains)
4. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxx
   RESEND_FROM_EMAIL=waitlist@yourdomain.com
   ```

**Note:** Without Resend configured, the form still works - it just won't send confirmation emails.

---

## Project Structure

```
continuum/
├── app/
│   ├── api/
│   │   └── waitlist/
│   │       └── route.ts      # API endpoint for form submission
│   ├── globals.css           # Tailwind + custom styles
│   ├── layout.tsx            # Root layout with metadata
│   └── page.tsx              # Homepage
├── components/
│   ├── Hero.tsx              # Hero section with value props
│   ├── WaitlistForm.tsx      # Form with validation
│   └── Footer.tsx            # Footer with links
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── resend.ts             # Resend client
├── supabase/
│   └── schema.sql            # Database schema (run in Supabase SQL Editor)
├── .env.example              # Environment variable template
├── .env.local                # Your local environment (don't commit!)
└── package.json
```

---

## Features

- Next.js 15 App Router (React 19)
- Tailwind CSS styling
- TypeScript strict mode
- Zod input validation
- Supabase database + RLS
- Resend email (optional)
- Mobile-first responsive design
- SEO optimized (metadata, OG tags)

---

## Troubleshooting

### "Supabase configuration missing"
- Check that `.env.local` has all required values
- Restart the dev server after changing env vars

### Form submission fails with 500 error
- Check Supabase dashboard → SQL Editor → verify `waitlist` table exists
- Check browser console for specific error message
- Verify your API keys are correct

### Email not sending
- Resend is optional - form works without it
- If using Resend, verify your API key is correct
- Check Resend dashboard for delivery status

### Vercel deployment fails
- Make sure all environment variables are set in Vercel dashboard
- Check Vercel build logs for specific error

---

## Next Steps (After Landing Page)

Once you have 50+ waitlist signups, build the MVP:

1. **ICP Builder** - Let users define their ideal customer profile
2. **Opportunity Scout** - n8n workflow that discovers opportunities
3. **Dashboard** - View and filter discovered opportunities
4. **Email Digest** - Daily summary of top opportunities

See the full PRD and technical specs in the project documentation.

---

## Support

Questions? Open an issue or email hello@continuum.dev

