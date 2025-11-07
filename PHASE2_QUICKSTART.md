# Phase 2: Environment Configuration - Quick Start

This is a condensed guide to get you through Phase 2 quickly. For detailed instructions, see `ENVIRONMENT_SETUP.md`.

---

## ⚡ Quick Setup (30-45 minutes)

### Prerequisites

- ✅ Phase 1 complete (database schema deployed)
- 📧 Email address for API signups
- 💳 Credit card for OpenAI (won't be charged much)

---

## 🔑 Step 1: Get API Keys (20 minutes)

### 1.1 The Odds API (Free Tier)

```bash
# 1. Visit: https://the-odds-api.com/
# 2. Click "Get Your Free API Key"
# 3. Sign up with email
# 4. Copy API key from dashboard
# 5. Save it somewhere safe
```

**Free tier**: 500 requests/month

---

### 1.2 OpenAI API

```bash
# 1. Visit: https://platform.openai.com/api-keys
# 2. Sign in or create account
# 3. Add payment method (Settings → Billing)
# 4. Click "Create new secret key"
# 5. Name it "DeltaSports"
# 6. Copy key IMMEDIATELY (can't view again)
# 7. Save it somewhere safe
```

**Expected cost**: $1-2/month for testing

---

### 1.3 Supabase Credentials

```bash
# 1. Go to: https://supabase.com/dashboard
# 2. Select your DeltaSports project
# 3. Navigate to: Settings → API
# 4. Copy these 3 values:
```

| Value | Location | Starts With |
|-------|----------|-------------|
| Project URL | Settings → API → Project URL | `https://` |
| Anon Key | Settings → API → Project API keys → anon public | `eyJ` |
| Service Role Key | Settings → API → Project API keys → service_role | `eyJ` |

---

## 💻 Step 2: Configure Local Environment (5 minutes)

### Create .env.local file

```bash
cd web
cp .env.template .env.local
```

### Edit .env.local

Open `web/.env.local` and fill in your values:

```bash
# Supabase (from Step 1.3)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# APIs (from Steps 1.1 and 1.2)
ODDS_API_KEY=your_actual_odds_api_key
OPENAI_API_KEY=sk-proj-your_actual_openai_key

# Feature flags
NEXT_PUBLIC_CHAT_MODE=api
```

### Verify Configuration

```bash
cd ..  # Back to project root
node scripts/verify-env.mjs
```

**Expected output**: All green checkmarks ✓

### Test API Keys

```bash
node scripts/test-api-keys.mjs
```

**Expected output**: All APIs return success

---

## ☁️ Step 3: Configure Vercel (10 minutes)

### Option A: Via Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Select your DeltaSports project
3. Go to: **Settings → Environment Variables**
4. Add each variable below:

| Variable | Value | Select All Envs |
|----------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | ✓ |
| `ODDS_API_KEY` | Your Odds API key | ✓ |
| `OPENAI_API_KEY` | Your OpenAI key | ✓ |
| `NEXT_PUBLIC_CHAT_MODE` | `api` (type this) | ✓ |

**IMPORTANT**: Check all three boxes (Production, Preview, Development) for each variable

5. Click "Save" for each variable

### Option B: Via CLI

```bash
npm install -g vercel
vercel login
vercel link

# Add each variable
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ODDS_API_KEY
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_CHAT_MODE
```

---

## 🔧 Step 4: Configure Supabase Secrets (10 minutes)

### Option A: Automated Script (Fastest)

```bash
# Make script executable
chmod +x scripts/setup-supabase.sh

# Run setup script
bash scripts/setup-supabase.sh
```

The script will:
- ✓ Check if Supabase CLI is installed
- ✓ Login (if needed)
- ✓ Link your project
- ✓ Set secrets from .env.local
- ✓ Verify secrets were set

### Option B: Manual Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project (get PROJECT_REF from Supabase Dashboard → Settings → General)
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set ODDS_API_KEY=your_actual_odds_api_key
supabase secrets set OPENAI_API_KEY=your_actual_openai_key

# Verify
supabase secrets list
```

**Expected output**:
```
ODDS_API_KEY
OPENAI_API_KEY
```

---

## 🚀 Step 5: Deploy Edge Functions (5 minutes)

### Deploy odds-assistant (Required)

```bash
supabase functions deploy odds-assistant
```

**Expected**: "Deployed function odds-assistant"

### Test the deployment

```bash
# Replace with your actual values
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/odds-assistant" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"Get NBA odds","sportKey":"basketball_nba"}'
```

**Expected**: JSON response with odds data (not errors about missing keys)

### Deploy other functions (Optional)

```bash
supabase functions deploy on-auth-profile
supabase functions deploy bankroll-metrics-sync
supabase functions deploy edge-alerts-dispatch
supabase functions deploy creator-feed-publish
```

---

## ✅ Verification Checklist

Before proceeding to Phase 3, verify:

- [ ] All API keys obtained and saved
- [ ] `.env.local` created and filled
- [ ] `verify-env.mjs` passes (all green ✓)
- [ ] `test-api-keys.mjs` passes (all APIs work)
- [ ] All 6 Vercel environment variables set
- [ ] Vercel variables set for all 3 environments
- [ ] Supabase CLI installed and logged in
- [ ] Supabase project linked
- [ ] 2 Supabase secrets set (ODDS_API_KEY, OPENAI_API_KEY)
- [ ] `odds-assistant` edge function deployed
- [ ] Edge function test returns data (not auth errors)

---

## 🐛 Common Issues & Fixes

### "Supabase CLI not found"

```bash
npm install -g supabase
```

### "Not logged in to Supabase"

```bash
supabase login
```

### "Project not linked"

```bash
# Get PROJECT_REF from: Supabase Dashboard → Settings → General → Reference ID
supabase link --project-ref YOUR_PROJECT_REF
```

### "Invalid API key" when testing

- Double-check you copied the key correctly (no extra spaces)
- For OpenAI: Verify payment method is added
- For The Odds API: Check you're not out of free tier requests

### Edge function returns "Required API keys are missing"

```bash
# Verify secrets are set
supabase secrets list

# If missing, set them again
supabase secrets set ODDS_API_KEY=your_key
supabase secrets set OPENAI_API_KEY=your_key

# Redeploy function
supabase functions deploy odds-assistant
```

### Vercel build succeeds but app doesn't work

- Check all environment variables are set in Vercel
- Verify variables are set for the correct environment (Production/Preview)
- Trigger a new deployment: `git commit --allow-empty -m "Redeploy" && git push`

---

## 📊 Cost Estimate

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| The Odds API | Free (500 req/month) | $0 |
| OpenAI API | Pay-as-you-go | $1-2 (testing) |
| Supabase | Free tier | $0 |
| Vercel | Hobby | $0 |
| **Total** | | **~$1-2/month** |

---

## 🎉 Phase 2 Complete!

If all verification items are checked, you're ready for Phase 3: Application Testing.

### What's Working Now:

- ✅ Database schema deployed (from Phase 1)
- ✅ Environment variables configured
- ✅ API keys validated and working
- ✅ Edge functions deployed
- ✅ Ready for end-to-end testing

### Next Steps:

1. **Test the application**: See `DEPLOYMENT_CHECKLIST.md` Phase 5
2. **Create a test account**: Sign up on your deployed app
3. **Test each feature**: Odds scanner, bankroll, bets, analytics
4. **Monitor API usage**: Check The Odds API and OpenAI dashboards

---

## 📚 Quick Reference

### Important Files

```
web/.env.local                  # Your local environment variables
scripts/verify-env.mjs          # Verify configuration
scripts/test-api-keys.mjs       # Test API connectivity
scripts/setup-supabase.sh       # Automated Supabase setup
ENVIRONMENT_SETUP.md            # Detailed instructions
DEPLOYMENT_CHECKLIST.md         # Complete deployment guide
```

### Important Commands

```bash
# Verify local environment
node scripts/verify-env.mjs

# Test API keys
node scripts/test-api-keys.mjs

# Setup Supabase (automated)
bash scripts/setup-supabase.sh

# Deploy edge function
supabase functions deploy odds-assistant

# Check edge function logs
supabase functions logs odds-assistant

# List Supabase secrets
supabase secrets list
```

---

## 🆘 Need Help?

If you get stuck:

1. Check `ENVIRONMENT_SETUP.md` for detailed instructions
2. Check `DEPLOYMENT_CHECKLIST.md` Phase 2 section
3. Run verification scripts to identify the issue
4. Check error messages in browser console or Vercel logs

**Common Error Patterns**:

- `"Cannot connect to database"` → Check Supabase URL and keys
- `"Required API keys are missing"` → Set Supabase secrets
- `"401 Unauthorized"` → Invalid API key
- `"429 Rate limit"` → Out of free tier requests or no OpenAI credits

---

**Last Updated**: Phase 2 Quick Start
