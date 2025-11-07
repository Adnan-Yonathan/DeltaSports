# DeltaSports Environment Configuration Guide

This guide will help you configure all required environment variables for both the web application and Supabase edge functions.

## 📋 Prerequisites

Before proceeding, you need to obtain API keys from:

1. **The Odds API** - Sports odds data provider
2. **OpenAI** - AI assistant for analysis
3. **Supabase** - Database and authentication

---

## 🔑 Step 1: Obtain API Keys

### 1.1 The Odds API

1. Visit [https://the-odds-api.com/](https://the-odds-api.com/)
2. Click "Get Your Free API Key"
3. Sign up for an account
4. Copy your API key from the dashboard
5. **Save for later**: `ODDS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Free Tier**: 500 requests per month (sufficient for testing)

### 1.2 OpenAI API

1. Visit [https://platform.openai.com/](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Name it "DeltaSports" and copy the key immediately (you can't view it again!)
6. **Save for later**: `OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Note**: You'll need to add a payment method. Usage should be minimal (~$1-2/month for testing).

### 1.3 Supabase Credentials

1. Go to your Supabase project dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings → API**
3. Copy the following values:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Project API keys (anon key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...

# Service Role key (keep this secret!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

**⚠️ SECURITY WARNING**: The service role key bypasses Row Level Security. NEVER expose it in client-side code or commit it to git!

---

## 🌐 Step 2: Configure Vercel Environment Variables

### 2.1 Via Vercel Dashboard (Recommended)

1. Go to your project at [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your DeltaSports project
3. Go to **Settings → Environment Variables**
4. Add each variable below by clicking "Add New"

#### Variables to Add:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production, Preview, Development |
| `ODDS_API_KEY` | Your Odds API key | Production, Preview, Development |
| `OPENAI_API_KEY` | Your OpenAI API key | Production, Preview, Development |
| `NEXT_PUBLIC_CHAT_MODE` | `api` | Production, Preview, Development |

**Note**: Make sure to select all three environments for each variable.

### 2.2 Via Vercel CLI (Alternative)

If you prefer using the CLI:

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ODDS_API_KEY
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_CHAT_MODE
```

### 2.3 Trigger New Deployment

After adding environment variables:

```bash
# Option 1: Redeploy from Vercel dashboard
# Go to Deployments → Latest deployment → "..." menu → Redeploy

# Option 2: Trigger via git push
git commit --allow-empty -m "Trigger deployment with new env vars"
git push origin claude/diagnose-command-center-011CUuBF2nrTEauXBqPsWidf
```

---

## 🔧 Step 3: Configure Supabase Edge Functions

Edge functions need their own environment variables (called "secrets" in Supabase).

### 3.1 Via Supabase Dashboard

1. Go to **Edge Functions** in your Supabase dashboard
2. Click on **Manage secrets**
3. Add the following secrets:

```bash
ODDS_API_KEY=your_odds_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 3.2 Via Supabase CLI (Alternative)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set ODDS_API_KEY=your_odds_api_key_here
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here

# Verify secrets were set (won't show values, only names)
supabase secrets list
```

---

## 🔐 Step 4: Configure Local Development (Optional)

For local development, create a `.env.local` file in the `web/` directory:

```bash
cd web
touch .env.local
```

Add the following to `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...

# External APIs
ODDS_API_KEY=your_odds_api_key_here
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Feature Flags
NEXT_PUBLIC_CHAT_MODE=api
```

**⚠️ IMPORTANT**: The `.env.local` file is already in `.gitignore`. Never commit it to git!

---

## ✅ Step 5: Verify Configuration

### 5.1 Check Vercel Deployment

After deployment completes:

1. Open your deployed app URL
2. Open browser DevTools → Console
3. Check for environment variable errors
4. Try to sign up/login

### 5.2 Test Edge Function

Test that the odds-assistant edge function can access your API keys:

```bash
# Replace with your actual values
curl -X POST "https://your-project.supabase.co/functions/v1/odds-assistant" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Get NBA odds",
    "sportKey": "basketball_nba",
    "regions": "us",
    "markets": "h2h"
  }'
```

**Expected Response**: JSON with odds data or a descriptive error message.

**Common Errors**:
- `"Required API keys are missing"` → Edge function secrets not set
- `"The Odds API responded with status 401"` → Invalid ODDS_API_KEY
- `"Failed to reach OpenAI"` → Invalid OPENAI_API_KEY

### 5.3 Verify Database Connection

Test that the app can connect to Supabase:

```bash
# In browser DevTools Console (on your deployed site)
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

Should show your Supabase URL. If undefined, environment variables aren't loaded.

---

## 🐛 Troubleshooting

### Environment Variables Not Loading in Vercel

1. Check that variables are set for the correct environment (Production/Preview/Development)
2. Ensure you redeployed after adding variables
3. Try redeploying from scratch: Settings → General → "Redeploy"

### Edge Function Errors

```bash
# Check edge function logs
# Go to Supabase Dashboard → Edge Functions → Select function → Logs

# Or use CLI:
supabase functions logs odds-assistant
```

### "CORS Error" in Browser

This usually means the edge function failed. Check:
1. Edge function secrets are set correctly
2. Edge function is deployed
3. Supabase service role key is valid

### API Rate Limits

- **The Odds API Free Tier**: 500 requests/month
- **OpenAI**: Pay-as-you-go (typically $0.01 - $0.02 per request)

Monitor usage:
- The Odds API: Check dashboard
- OpenAI: https://platform.openai.com/usage

---

## 📝 Quick Reference

### All Environment Variables

**Vercel (Web App)**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ODDS_API_KEY=xxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxx
NEXT_PUBLIC_CHAT_MODE=api
```

**Supabase Edge Functions (Secrets)**:
```bash
ODDS_API_KEY=xxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxx
```

**Local Development** (`.env.local`):
```bash
# Same as Vercel variables above
```

---

## ✅ Checklist

Before moving to the next phase, verify:

- [ ] The Odds API key obtained and saved
- [ ] OpenAI API key obtained and saved
- [ ] Supabase credentials copied from dashboard
- [ ] All 6 environment variables added to Vercel
- [ ] Vercel deployment triggered with new variables
- [ ] 2 secrets added to Supabase Edge Functions
- [ ] Test deployment loads without console errors
- [ ] Edge function test returns data (not auth errors)
- [ ] `.env.local` created for local development (if needed)

---

## 🎯 Next Steps

Once all environment variables are configured:
1. Proceed to **Phase 2: Edge Function Deployment**
2. See `DEPLOYMENT_CHECKLIST.md` for complete deployment steps

---

## 🆘 Need Help?

- The Odds API Docs: https://the-odds-api.com/liveapi/guides/v4/
- OpenAI API Docs: https://platform.openai.com/docs/api-reference
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
