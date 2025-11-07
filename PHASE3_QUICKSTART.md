# Phase 3: Edge Function Deployment & Testing - Quick Start

This is a condensed guide to deploy and test all edge functions. For detailed instructions, see `DEPLOYMENT_CHECKLIST.md`.

---

## ⚡ Quick Deployment (15-20 minutes)

### Prerequisites

- ✅ Phase 1 complete (database deployed)
- ✅ Phase 2 complete (environment configured)
- ✅ Supabase CLI installed and authenticated
- ✅ Edge function secrets set

---

## 🚀 Step 1: Deploy Edge Functions (5 minutes)

### Automated Deployment (Recommended)

```bash
# Make script executable
chmod +x scripts/deploy-functions.sh

# Deploy all functions
bash scripts/deploy-functions.sh

# Or deploy specific function
bash scripts/deploy-functions.sh odds-assistant
```

**Expected Output**:
```
✓ Supabase CLI installed
✓ Logged in to Supabase
✓ Project linked

Verifying edge function secrets...
✓ ODDS_API_KEY is set
✓ OPENAI_API_KEY is set

Deploying odds-assistant...
✓ odds-assistant deployed successfully

Deploying on-auth-profile...
✓ on-auth-profile deployed successfully

...

Deployment Summary
  Successfully deployed: 5
  Failed: 0

✓ All edge functions deployed successfully!
```

### Manual Deployment (Alternative)

```bash
# Deploy critical function (required)
supabase functions deploy odds-assistant

# Deploy optional functions
supabase functions deploy on-auth-profile
supabase functions deploy bankroll-metrics-sync
supabase functions deploy edge-alerts-dispatch
supabase functions deploy creator-feed-publish
```

---

## ✅ Step 2: Test Edge Functions (5 minutes)

### Run Test Suite

```bash
node scripts/test-functions.mjs
# Or: npm run test-functions (from web directory)
```

**Expected Output**:
```
Testing odds-assistant...
✓ odds-assistant: Working correctly
  Events returned: 24
  Model summary: Generated

Testing on-auth-profile...
✓ on-auth-profile: Deployed and accessible
  Function will be triggered on user signup

Testing bankroll-metrics-sync...
✓ bankroll-metrics-sync: Deployed and accessible

Testing edge-alerts-dispatch...
✓ edge-alerts-dispatch: Deployed and accessible

Testing creator-feed-publish...
✓ creator-feed-publish: Deployed and accessible

─────────────────────────────────────────────────────────────
Test Results
  Passed: 5/5

  ✓ odds-assistant
  ✓ on-auth-profile
  ✓ bankroll-metrics-sync
  ✓ edge-alerts-dispatch
  ✓ creator-feed-publish

✓ Critical functions are working!
```

---

## 🔬 Step 3: Run Integration Tests (5 minutes)

### Full Stack Testing

```bash
node scripts/test-integration.mjs
# Or: npm run test-integration (from web directory)
```

**Expected Output**:
```
1. Testing Database Schema
  ✓ user_profiles
  ✓ chat_sessions
  ✓ chat_messages
  ✓ bankroll_accounts
  ✓ bets
  ... (11 tables total)

2. Testing RLS Policies
  ✓ RLS is enabled
  Users cannot access other users' data

3. Testing Edge Functions
  ✓ odds-assistant is working
  Returned 24 events

4. Testing External API Integration
  ✓ The Odds API integration working
  ✓ OpenAI API integration working
  Generated 856 char summary

5. Testing Application Routes (if deployed)
  ⚠ Skipping (requires deployed application)

─────────────────────────────────────────────────────────────
Integration Test Results

  ✓ Database
  ✓ Rls
  ✓ Functions
  ✓ Apis
  ✓ Routes

✓ All integration tests passed! (5/5)
```

---

## 🐛 Step 4: Check Function Logs (Optional)

### View Real-Time Logs

```bash
# View logs for specific function
supabase functions logs odds-assistant

# Follow logs in real-time
supabase functions logs odds-assistant --follow

# View logs for all functions
supabase functions logs --all
```

---

## 📊 Verification Checklist

Before proceeding, verify:

- [ ] `deploy-functions.sh` completed successfully
- [ ] All 5 edge functions deployed (or at least odds-assistant)
- [ ] `test-functions.mjs` shows all tests passing
- [ ] `test-integration.mjs` shows all tests passing
- [ ] No errors in function logs
- [ ] `odds-assistant` returns real odds data
- [ ] `odds-assistant` generates AI summaries

---

## 🐛 Common Issues & Fixes

### Issue: "Required API keys are missing"

**Symptoms**: Edge function returns 500 error mentioning API keys

**Fix**:
```bash
# Check secrets are set
supabase secrets list

# If missing, set them
supabase secrets set ODDS_API_KEY=your_key
supabase secrets set OPENAI_API_KEY=your_key

# Redeploy function
supabase functions deploy odds-assistant
```

---

### Issue: "The Odds API responded with status 401"

**Symptoms**: Edge function works but returns no odds data

**Fix**:
1. Verify API key is valid at https://the-odds-api.com/
2. Check you haven't exceeded free tier (500 requests/month)
3. Re-set secret:
   ```bash
   supabase secrets set ODDS_API_KEY=your_correct_key
   supabase functions deploy odds-assistant
   ```

---

### Issue: "Failed to reach OpenAI"

**Symptoms**: Edge function returns odds but no AI summary

**Fix**:
1. Verify API key is valid at https://platform.openai.com/api-keys
2. Check you have available credits (add payment method)
3. Re-set secret:
   ```bash
   supabase secrets set OPENAI_API_KEY=your_correct_key
   supabase functions deploy odds-assistant
   ```

---

### Issue: "Function deployment failed"

**Symptoms**: Deploy script shows errors

**Fix**:
1. Check Supabase CLI is logged in:
   ```bash
   supabase login
   ```

2. Verify project is linked:
   ```bash
   supabase link --project-ref YOUR_REF
   ```

3. Check function directory exists:
   ```bash
   ls supabase/functions/odds-assistant
   ```

4. Try deploying manually:
   ```bash
   supabase functions deploy odds-assistant --no-verify-jwt
   ```

---

### Issue: "Database tables not found"

**Symptoms**: Integration test fails on database schema

**Fix**:
1. Run database schema script:
   - Open Supabase Dashboard → SQL Editor
   - Run `supabase/01-schema.sql`
   - Run `supabase/02-rls-policies.sql`

2. Re-run integration test:
   ```bash
   npm run test-integration
   ```

---

## 🔍 Manual Testing Procedures

### Test odds-assistant Manually

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/odds-assistant" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the best NBA bets today?",
    "sportKey": "basketball_nba",
    "regions": "us",
    "markets": "h2h,spreads,totals"
  }'
```

**Expected**: JSON with `status: "ok"`, `odds_snapshot`, and `model_summary`

---

### Test in Web Application

1. **Deploy to Vercel** (if not already):
   ```bash
   git push origin your-branch
   ```

2. **Open deployed URL**

3. **Test Chat**:
   - Navigate to Dashboard
   - Type: "What are the best NBA odds?"
   - Should see streaming response with odds

4. **Test Odds Scanner**:
   - Navigate to Odds Scanner
   - Select sport (e.g., NBA)
   - Should see list of games with odds from multiple books

---

## 📈 Performance & Cost Monitoring

### Monitor API Usage

**The Odds API**:
```bash
# Check remaining requests in test output
npm run test-functions
# Look for "Requests remaining: XXX"
```

Or visit: https://the-odds-api.com/dashboard

**OpenAI**:
Visit: https://platform.openai.com/usage

### Expected Costs

| Service | Usage Pattern | Monthly Cost |
|---------|--------------|--------------|
| The Odds API | ~100 requests/month | $0 (free tier) |
| OpenAI | ~50 requests/month | $0.50-$1.00 |
| Supabase | Free tier usage | $0 |
| **Total** | | **~$0.50-$1.00/month** |

---

## 🎯 Success Criteria

After completing Phase 3, you should have:

| Item | Status | How to Verify |
|------|--------|---------------|
| **Edge Functions Deployed** | ✅ | `supabase functions list` |
| **odds-assistant Working** | ✅ | `npm run test-functions` passes |
| **API Keys Valid** | ✅ | Test returns real odds data |
| **Database Accessible** | ✅ | `npm run test-integration` passes |
| **RLS Configured** | ✅ | Integration test passes RLS check |
| **Logs Clean** | ✅ | `supabase functions logs` shows no errors |

---

## 🎉 Phase 3 Complete!

If all tests pass, you're ready for production use!

### What's Working Now:

- ✅ Database deployed with all tables
- ✅ RLS policies protecting user data
- ✅ Environment variables configured
- ✅ Edge functions deployed
- ✅ External APIs integrated
- ✅ Real-time odds data flowing
- ✅ AI analysis generating insights

### Final Steps:

1. **Deploy to Vercel** (if not done):
   ```bash
   git commit -m "Phase 3 complete"
   git push origin your-branch
   ```

2. **Test in Browser**:
   - Sign up for account
   - Test all features
   - Verify everything works

3. **Monitor & Iterate**:
   - Check logs regularly
   - Monitor API usage
   - Fix any issues that arise

---

## 📚 Quick Command Reference

```bash
# Deploy all functions
npm run deploy-functions

# Test edge functions
npm run test-functions

# Test full integration
npm run test-integration

# Check environment
npm run check-config

# View function logs
supabase functions logs odds-assistant

# Follow logs in real-time
supabase functions logs odds-assistant --follow
```

---

## 📖 Related Documentation

- `DEPLOYMENT_CHECKLIST.md` - Complete deployment guide
- `ENVIRONMENT_SETUP.md` - Environment configuration
- `PHASE2_QUICKSTART.md` - Phase 2 quick start
- `scripts/README.md` - All script documentation

---

## 🆘 Need Help?

If tests fail:

1. **Check logs first**:
   ```bash
   supabase functions logs odds-assistant
   ```

2. **Verify configuration**:
   ```bash
   npm run check-config
   ```

3. **Re-run setup**:
   ```bash
   npm run setup-supabase
   ```

4. **Check documentation**:
   - Common Issues section above
   - `DEPLOYMENT_CHECKLIST.md` Phase 3
   - `ENVIRONMENT_SETUP.md` troubleshooting

---

**Last Updated**: Phase 3 Complete
