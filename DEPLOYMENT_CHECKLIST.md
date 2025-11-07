# DeltaSports Complete Deployment Checklist

Use this checklist to systematically deploy all components of DeltaSports from scratch.

---

## 🎯 Overview

This deployment has 5 phases that must be completed in order:

1. **Database Setup** - Deploy schema and security policies
2. **Environment Configuration** - Set all API keys and secrets
3. **Edge Function Deployment** - Deploy Supabase serverless functions
4. **Application Deployment** - Deploy Next.js app to Vercel
5. **Verification & Testing** - Confirm all features work

**Estimated Time**: 3-4 hours

---

## 📋 PHASE 1: Database Setup (30-45 minutes)

### Step 1.1: Execute Database Schema

- [ ] **1.** Log in to [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] **2.** Select your DeltaSports project
- [ ] **3.** Go to **SQL Editor** (left sidebar)
- [ ] **4.** Click **+ New query**
- [ ] **5.** Open `/supabase/01-schema.sql` from this repository
- [ ] **6.** Copy the entire contents
- [ ] **7.** Paste into Supabase SQL Editor
- [ ] **8.** Click **Run** (or press Cmd/Ctrl + Enter)
- [ ] **9.** Wait for "Success. No rows returned" message

**Verify Tables Created**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected Output**: 11 tables
- `alert_events`
- `bankroll_accounts`
- `bet_tags`
- `bets`
- `chat_messages`
- `chat_sessions`
- `creator_posts`
- `creator_profiles`
- `creator_subscriptions`
- `edge_alerts`
- `user_profiles`

---

### Step 1.2: Execute RLS Policies

- [ ] **1.** In SQL Editor, click **+ New query**
- [ ] **2.** Open `/supabase/02-rls-policies.sql` from this repository
- [ ] **3.** Copy the entire contents
- [ ] **4.** Paste into Supabase SQL Editor
- [ ] **5.** Click **Run**
- [ ] **6.** Wait for "Success. No rows returned" message

**Verify RLS Enabled**:
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected**: All tables should show `rowsecurity = true`

**Verify Policies Created**:
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies WHERE schemaname = 'public'
GROUP BY tablename ORDER BY tablename;
```

**Expected**: Each table should have 2-5 policies

---

### Step 1.3: Configure Auth Triggers (Optional)

If you want automatic user profile creation on signup:

- [ ] **1.** Go to **Database → Triggers** in Supabase Dashboard
- [ ] **2.** Click **Create a new trigger**
- [ ] **3.** Configure:
  - **Name**: `on_auth_user_created`
  - **Table**: `auth.users`
  - **Events**: `INSERT`
  - **Type**: `After`
  - **Function**: Create a new function that inserts into `public.user_profiles`

**Alternative**: Use the `on-auth-profile` edge function (covered in Phase 3)

---

## 🔑 PHASE 2: Environment Configuration (30-45 minutes)

### Step 2.1: Obtain API Keys

- [ ] **1.** Get The Odds API key:
  - Visit [https://the-odds-api.com/](https://the-odds-api.com/)
  - Sign up for free account
  - Copy API key
  - **Save**: `ODDS_API_KEY=_______________________________`

- [ ] **2.** Get OpenAI API key:
  - Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
  - Create new secret key named "DeltaSports"
  - Copy key immediately (can't view again!)
  - **Save**: `OPENAI_API_KEY=sk-proj-_______________________`

- [ ] **3.** Get Supabase credentials:
  - Go to **Settings → API** in Supabase Dashboard
  - Copy Project URL
  - Copy `anon` public key
  - Copy `service_role` key (keep secret!)

---

### Step 2.2: Configure Vercel Environment Variables

- [ ] **1.** Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] **2.** Select DeltaSports project
- [ ] **3.** Go to **Settings → Environment Variables**
- [ ] **4.** Add each variable below (select all environments):

| Variable | Value Source | Environments |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings → API → Project URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings → API → anon public | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings → API → service_role | All |
| `ODDS_API_KEY` | The Odds API dashboard | All |
| `OPENAI_API_KEY` | OpenAI Platform | All |
| `NEXT_PUBLIC_CHAT_MODE` | Type: `api` | All |

**IMPORTANT**: Click "Add" for each variable and select Production, Preview, and Development

---

### Step 2.3: Configure Supabase Edge Function Secrets

- [ ] **1.** Install Supabase CLI (if not already installed):
  ```bash
  npm install -g supabase
  ```

- [ ] **2.** Login to Supabase:
  ```bash
  supabase login
  ```

- [ ] **3.** Link to your project:
  ```bash
  cd /home/user/DeltaSports
  supabase link --project-ref YOUR_PROJECT_REF
  ```

  *Find PROJECT_REF in Supabase Dashboard → Settings → General → Reference ID*

- [ ] **4.** Set edge function secrets:
  ```bash
  supabase secrets set ODDS_API_KEY=your_actual_odds_api_key
  supabase secrets set OPENAI_API_KEY=your_actual_openai_key
  ```

- [ ] **5.** Verify secrets were set:
  ```bash
  supabase secrets list
  ```

**Expected Output**:
```
ODDS_API_KEY
OPENAI_API_KEY
```

---

## 🚀 PHASE 3: Edge Function Deployment (20-30 minutes)

### Step 3.1: Deploy odds-assistant Function

- [ ] **1.** Deploy the function:
  ```bash
  cd /home/user/DeltaSports
  supabase functions deploy odds-assistant
  ```

- [ ] **2.** Wait for "Deployed function odds-assistant" message

- [ ] **3.** Test the function:
  ```bash
  curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/odds-assistant" \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "query": "Get NBA odds",
      "sportKey": "basketball_nba",
      "regions": "us",
      "markets": "h2h"
    }'
  ```

**Expected**: JSON response with odds data (not error about missing API keys)

---

### Step 3.2: Deploy Other Edge Functions (Optional)

Deploy these if you want their functionality:

- [ ] **bankroll-metrics-sync**:
  ```bash
  supabase functions deploy bankroll-metrics-sync
  ```

- [ ] **edge-alerts-dispatch**:
  ```bash
  supabase functions deploy edge-alerts-dispatch
  ```

- [ ] **creator-feed-publish**:
  ```bash
  supabase functions deploy creator-feed-publish
  ```

- [ ] **on-auth-profile** (user profile auto-creation):
  ```bash
  supabase functions deploy on-auth-profile
  ```

---

## 🌐 PHASE 4: Application Deployment (15-30 minutes)

### Step 4.1: Commit Latest Changes

- [ ] **1.** Verify working directory is clean:
  ```bash
  git status
  ```

- [ ] **2.** If there are uncommitted changes, commit them:
  ```bash
  git add .
  git commit -m "Phase 1 complete: Add database schema and deployment docs"
  ```

---

### Step 4.2: Push and Deploy

- [ ] **1.** Push to your feature branch:
  ```bash
  git push origin claude/diagnose-command-center-011CUuBF2nrTEauXBqPsWidf
  ```

- [ ] **2.** Vercel will automatically detect the push and start building

- [ ] **3.** Monitor deployment in Vercel Dashboard:
  - Go to **Deployments** tab
  - Click on the latest deployment
  - Watch build logs

**Expected**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
Build Completed
```

---

### Step 4.3: Verify Deployment

- [ ] **1.** Open the deployed URL (from Vercel dashboard)
- [ ] **2.** Open browser DevTools (F12)
- [ ] **3.** Check Console for errors
- [ ] **4.** Verify no environment variable warnings

---

## ✅ PHASE 5: Verification & Testing (30-60 minutes)

### Step 5.1: Test Authentication

- [ ] **1.** Click **Sign Up** on your deployed app
- [ ] **2.** Enter test email and password
- [ ] **3.** Check email for confirmation (if email confirmation enabled)
- [ ] **4.** Verify you're redirected to dashboard

**Verify in Database**:
```sql
-- Should show your test user
SELECT * FROM auth.users WHERE email = 'your-test-email@example.com';

-- Should show corresponding profile
SELECT * FROM public.user_profiles WHERE auth_user_id = '<user_id_from_above>';
```

---

### Step 5.2: Test Odds Scanner

- [ ] **1.** Navigate to **Odds Scanner** page
- [ ] **2.** Select a sport (e.g., "NBA")
- [ ] **3.** Wait for odds to load
- [ ] **4.** Verify you see:
  - List of upcoming games
  - Odds from multiple sportsbooks
  - Market selection (Moneyline, Spreads, Totals)

**If odds don't load**:
- Check browser Console for errors
- Verify `NEXT_PUBLIC_CHAT_MODE=api` is set
- Test edge function directly (see Phase 3, Step 3.1)

---

### Step 5.3: Test Bankroll System

- [ ] **1.** Navigate to **Bankroll** page
- [ ] **2.** Click **Create Bankroll**
- [ ] **3.** Fill in:
  - Label: "Test Bankroll"
  - Currency: USD
  - Starting Balance: 1000
- [ ] **4.** Click **Save**
- [ ] **5.** Verify bankroll appears in list

**Verify in Database**:
```sql
SELECT * FROM public.bankroll_accounts
WHERE user_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = '<your_auth_uid>');
```

---

### Step 5.4: Test Bet Logging

- [ ] **1.** On Bankroll page, click **Log Bet**
- [ ] **2.** Fill in bet details:
  - Event: "Lakers vs Celtics"
  - Market: "Moneyline"
  - Wager: 50
  - Odds: -110
- [ ] **3.** Click **Submit**
- [ ] **4.** Verify bet appears in bet history

**Verify in Database**:
```sql
SELECT * FROM public.bets
WHERE user_id = (SELECT id FROM public.user_profiles WHERE auth_user_id = '<your_auth_uid>')
ORDER BY placed_at DESC LIMIT 5;
```

---

### Step 5.5: Test Chat Assistant

- [ ] **1.** Navigate to **Dashboard** (main page)
- [ ] **2.** Type a question in chat: "What are the best NBA odds today?"
- [ ] **3.** Press Enter
- [ ] **4.** Wait for AI response
- [ ] **5.** Verify you see:
  - Streaming response with odds data
  - Recommendations
  - Source citations

**If chat fails**:
- Check that `OPENAI_API_KEY` is valid
- Check edge function logs: `supabase functions logs odds-assistant`
- Verify OpenAI account has available credits

---

### Step 5.6: Test Analytics

- [ ] **1.** Navigate to **Analytics** page
- [ ] **2.** Verify you see:
  - Performance metrics (if you've logged bets)
  - Behavioral insights
  - Charts and visualizations

---

### Step 5.7: Test Profile Page

- [ ] **1.** Navigate to **Profile** page
- [ ] **2.** Verify you see:
  - Account information
  - User statistics
  - Editable profile fields
- [ ] **3.** Update timezone or bankroll goal
- [ ] **4.** Click **Save**
- [ ] **5.** Refresh page and verify changes persisted

---

## 🐛 Troubleshooting Common Issues

### Issue: "Cannot connect to database"

**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly
2. Check Supabase project is not paused (free tier auto-pauses after 1 week inactivity)
3. Verify database schema was executed successfully

---

### Issue: "Required API keys are missing"

**Solution**:
1. Check edge function secrets: `supabase secrets list`
2. Re-set secrets if missing:
   ```bash
   supabase secrets set ODDS_API_KEY=your_key
   supabase secrets set OPENAI_API_KEY=your_key
   ```
3. Redeploy edge function: `supabase functions deploy odds-assistant`

---

### Issue: "The Odds API responded with status 401"

**Solution**:
1. Verify ODDS_API_KEY is valid
2. Check usage limits in The Odds API dashboard (free tier: 500 requests/month)
3. Test key directly:
   ```bash
   curl "https://api.the-odds-api.com/v4/sports/?apiKey=YOUR_KEY"
   ```

---

### Issue: "Failed to reach OpenAI"

**Solution**:
1. Verify OPENAI_API_KEY is valid
2. Check OpenAI account has available credits
3. Verify API key permissions (should allow chat completions)
4. Test key directly:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_OPENAI_KEY"
   ```

---

### Issue: Build fails with TypeScript errors

**Solution**:
1. All TypeScript errors should be fixed from previous phases
2. If new errors appear, check the files:
   - `/web/src/app/sign-in/page.tsx`
   - `/web/src/app/(app)/odds-scanner/page.tsx`
   - `/web/src/app/(app)/layout.tsx`
3. Ensure all undefined variable checks are in place

---

## 📊 Success Metrics

After completing all phases, you should have:

| Feature | Status | Verification |
|---------|--------|--------------|
| **Database** | ✅ | 11 tables exist with RLS enabled |
| **Authentication** | ✅ | Can sign up and login |
| **User Profiles** | ✅ | Profile created on signup |
| **Odds Scanner** | ✅ | Shows live odds data |
| **Chat Assistant** | ✅ | AI responds with insights |
| **Bankroll Tracking** | ✅ | Can create accounts |
| **Bet Logging** | ✅ | Can log and view bets |
| **Analytics** | ✅ | Shows user statistics |
| **Profile Management** | ✅ | Can edit and save profile |

---

## 🎉 Deployment Complete!

If all checkboxes are ticked and all tests pass, congratulations! Your DeltaSports platform is fully deployed and operational.

### Next Steps:

1. **Add Real Data**: Start logging actual bets and tracking your performance
2. **Invite Users**: Share the app with friends (if desired)
3. **Monitor Costs**:
   - The Odds API: Track remaining free tier requests
   - OpenAI: Monitor API usage and costs
   - Supabase: Check database size and bandwidth
4. **Customize**: Adjust AI tone preferences, add custom sports, etc.

---

## 📚 Additional Resources

- **Database Schema**: `/supabase/sql-prompts.md`
- **Environment Setup**: `/ENVIRONMENT_SETUP.md`
- **Edge Functions**: `/supabase/functions/README.md`
- **Supabase Docs**: https://supabase.com/docs
- **The Odds API Docs**: https://the-odds-api.com/liveapi/guides/v4/
- **OpenAI API Docs**: https://platform.openai.com/docs

---

## 💾 Save This Checklist

Print or save this checklist for future reference when deploying to new environments or debugging issues.

**Last Updated**: Phase 1 Complete
