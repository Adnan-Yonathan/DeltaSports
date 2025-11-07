# Phase 5: Production Deployment - Quick Start

This is a condensed guide to deploy your DeltaSports application to production on Vercel. For detailed instructions, see `DEPLOYMENT_CHECKLIST.md` Phase 5.

---

## ⚡ Quick Deployment (20-30 minutes)

### Prerequisites

- ✅ Phase 1-4 complete
- ✅ All tests passing (`npm run verify-deployment`)
- ✅ Vercel account created (https://vercel.com)
- ✅ GitHub repository (optional, for CI/CD)

---

## 🚀 Step 1: Prepare for Deployment (5 minutes)

### Run Pre-Deployment Checks

```bash
# Run comprehensive preparation script
bash scripts/prepare-vercel.sh
```

**Expected Output**:
```
✓ Node.js installed
✓ npm installed
✓ Vercel CLI installed

✓ Environment variables valid
✓ All APIs working
✓ Dependencies installed
✓ Build successful
✓ Deployment verification passed

✓ Your project is ready for deployment!
```

---

## 🌐 Step 2: Deploy to Vercel (10 minutes)

### Option A: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy from web directory
cd web
vercel --prod
```

**Prompts**:
1. Set up and deploy? → **Yes**
2. Which scope? → Select your account
3. Link to existing project? → **No** (first time)
4. What's your project's name? → `deltasports` (or your choice)
5. In which directory is your code located? → `./` (already in web/)
6. Override settings? → **No**

**After deployment**, Vercel will show:
```
✓ Production: https://deltasports-xxx.vercel.app [copied to clipboard]
```

### Option B: Deploy via Vercel Dashboard

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Visit https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `DeltaSports` repository
   - Set root directory to `web`
   - Click "Deploy"

---

## ⚙️ Step 3: Configure Environment Variables (5 minutes)

### In Vercel Dashboard

1. Go to your project → **Settings** → **Environment Variables**

2. **Add Required Variables**:

   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

   # External APIs
   ODDS_API_KEY=your_odds_api_key
   OPENAI_API_KEY=sk-proj-...

   # App Config
   NEXT_PUBLIC_CHAT_MODE=api
   ```

3. **Set Environment**: Select **Production**, **Preview**, and **Development**

4. **Redeploy**: After adding variables:
   - Go to **Deployments**
   - Click **•••** on latest deployment
   - Click **Redeploy**

---

## ✅ Step 4: Verify Production Deployment (5 minutes)

### Automated Verification

```bash
# Replace with your actual URL
node scripts/verify-production.mjs https://deltasports-xxx.vercel.app
```

**Expected Output**:
```
1. Testing Homepage
  ✓ Homepage loads correctly

2. Testing Static Assets
  ✓ Static assets accessible

3. Testing API Routes
  ✓ API routing working

4. Testing Supabase Integration
  ✓ Supabase integration working

5. Testing Edge Functions
  ✓ Edge functions working

6. Testing Performance
  ✓ Fast response time: 847ms

7. Testing Security Headers
  ✓ Security headers present

═══════════════════════════════════════════════════════════
Production Verification Results

Passed: 7 | Failed: 0 | Warnings: 0

✓ Production deployment is working!
```

### Manual Verification

1. **Visit your production URL**
2. **Create a test account**:
   - Click "Sign Up"
   - Enter email and password
   - Verify email (check spam folder)

3. **Test core features**:
   - Navigate to Dashboard
   - Test chat: "What are the best NBA odds today?"
   - Navigate to Odds Scanner
   - Create a test bet

4. **Check for errors**:
   - Open browser console (F12)
   - Look for any red error messages
   - Test navigation between pages

---

## 🔄 Step 5: Set Up CI/CD (Optional, 5 minutes)

### Configure GitHub Actions

The workflow is already created at `.github/workflows/deploy.yml`

**Add GitHub Secrets** (Repository Settings → Secrets and variables → Actions):

```
Required Secrets:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ODDS_API_KEY
- OPENAI_API_KEY
- VERCEL_TOKEN (from Vercel Account Settings → Tokens)
- VERCEL_ORG_ID (from Vercel project settings)
- VERCEL_PROJECT_ID (from Vercel project settings)
- PRODUCTION_URL (your deployed URL)
```

**How to get Vercel values**:
```bash
# Install Vercel CLI
npm install -g vercel

# Link project
cd web
vercel link

# Get project info
cat .vercel/project.json

# Get ORG_ID and PROJECT_ID from the output
```

**After setup**: Every push to `main` will automatically deploy!

---

## 📊 Verification Checklist

Before marking Phase 5 complete, verify:

- [ ] `prepare-vercel.sh` completed successfully
- [ ] Application deployed to Vercel
- [ ] Environment variables configured in Vercel
- [ ] `verify-production.mjs` shows all tests passing
- [ ] Can create user account on production
- [ ] Can log in/out successfully
- [ ] Chat feature works (gets real odds data)
- [ ] Odds Scanner loads data
- [ ] No console errors in browser
- [ ] (Optional) CI/CD pipeline working

---

## 🐛 Common Issues & Fixes

### Issue: "Build failed" in Vercel

**Symptoms**: Deployment fails during build step

**Fix**:
1. Check build logs in Vercel dashboard
2. Test build locally:
   ```bash
   cd web
   npm run build
   ```
3. Fix any TypeScript or build errors
4. Commit and redeploy

---

### Issue: "Environment variables not working"

**Symptoms**: App deployed but features don't work

**Fix**:
1. Verify all environment variables in Vercel dashboard
2. Ensure variables are set for "Production" environment
3. Check variable names match exactly (case-sensitive)
4. Redeploy after adding variables:
   ```bash
   vercel --prod --force
   ```

---

### Issue: "Edge functions not working in production"

**Symptoms**: Chat returns errors, odds not loading

**Fix**:
1. Verify edge functions are deployed:
   ```bash
   supabase functions list
   ```

2. Check function logs:
   ```bash
   supabase functions logs odds-assistant
   ```

3. Verify Supabase secrets are set:
   ```bash
   supabase secrets list
   ```

4. Re-deploy if needed:
   ```bash
   npm run deploy-functions
   ```

---

### Issue: "Database connection failed"

**Symptoms**: Can't create account, data not loading

**Fix**:
1. Verify Supabase URL and keys in Vercel
2. Check database tables exist:
   ```bash
   npm run test-integration
   ```

3. Verify RLS policies allow access:
   - Check `supabase/02-rls-policies.sql` is deployed
   - Test database access via Supabase dashboard

---

### Issue: "Slow page loads"

**Symptoms**: Production site is slow

**Fix**:
1. Check Vercel deployment region (should be close to users)
2. Optimize images (use Next.js Image component)
3. Enable Vercel Analytics to identify bottlenecks
4. Check Supabase region (should match Vercel)
5. Consider upgrading Vercel/Supabase plans for better performance

---

## 🔍 Manual Testing Procedures

### Test User Registration

1. Visit production URL
2. Click "Sign Up"
3. Enter email: `test@example.com`
4. Enter password (min 6 characters)
5. Submit form
6. Check email for confirmation (check spam)
7. Click confirmation link
8. Should redirect to dashboard

### Test Chat Feature

1. Log in to production site
2. Navigate to Dashboard
3. Type in chat: "What are the best NBA bets today?"
4. Should see:
   - Streaming response
   - Odds data from multiple sportsbooks
   - AI analysis and recommendations

### Test Odds Scanner

1. Navigate to Odds Scanner page
2. Select a sport (e.g., NBA)
3. Should see:
   - List of upcoming games
   - Odds from multiple sportsbooks
   - Ability to filter by date/market

### Test Bet Tracking

1. Navigate to Bets page
2. Click "Add Bet"
3. Fill in bet details
4. Submit
5. Should appear in bet list
6. Verify can edit/delete

---

## 📈 Post-Deployment Monitoring

### Monitor Vercel Analytics

1. Go to Vercel Dashboard → Your Project → Analytics
2. Check:
   - Page load times
   - Error rates
   - Geographic distribution

### Monitor Supabase

1. Go to Supabase Dashboard → Your Project
2. Check:
   - Database Logs (Settings → Logs)
   - API Logs (Settings → Logs)
   - Function Logs (Edge Functions → Logs)

### Monitor API Usage

**The Odds API**:
- Visit https://the-odds-api.com/dashboard
- Check remaining requests
- Set up alerts if approaching limit

**OpenAI**:
- Visit https://platform.openai.com/usage
- Monitor token usage
- Set up spending limits

---

## 💰 Cost Monitoring

### Expected Costs (Production)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| The Odds API | Starter | $99 |
| OpenAI | Usage-based | $10-30 |
| **Total** | | **$154-174** |

### Free Tier (Development/Testing)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| The Odds API | Free | $0 |
| OpenAI | Pay-as-you-go | $0.50-2 |
| **Total** | | **$0.50-2** |

**Note**: Free tier is suitable for development and low-traffic production use.

---

## 🎯 Success Criteria

After completing Phase 5, you should have:

| Item | Status | How to Verify |
|------|--------|---------------|
| **Production Deployment** | ✅ | Visit production URL |
| **Environment Configured** | ✅ | Check Vercel dashboard |
| **All Features Working** | ✅ | Test manually in browser |
| **Production Tests Passing** | ✅ | `npm run verify-production` |
| **CI/CD Configured** | ✅ | Push to main triggers deploy |
| **Monitoring Set Up** | ✅ | Check Vercel/Supabase dashboards |

---

## 🎉 Phase 5 Complete!

If all tests pass and features work, **congratulations** - your DeltaSports platform is live in production!

### What's Working Now:

- ✅ Production application deployed on Vercel
- ✅ Global CDN for fast page loads
- ✅ SSL/HTTPS enabled automatically
- ✅ Environment variables configured
- ✅ Database connected and accessible
- ✅ Edge functions working
- ✅ Real-time odds data flowing
- ✅ AI chat providing insights
- ✅ User authentication working
- ✅ (Optional) Automated deployments via CI/CD

### Post-Launch Checklist:

1. **Share with users**:
   - Announce launch
   - Share production URL
   - Gather feedback

2. **Monitor closely** (first 24-48 hours):
   - Check error logs hourly
   - Monitor API usage
   - Watch for performance issues
   - Respond to user feedback

3. **Set up alerts**:
   - Vercel: Deploy notifications
   - Supabase: Database alerts
   - The Odds API: Quota alerts
   - OpenAI: Spending alerts

4. **Plan next features**:
   - Review user feedback
   - Prioritize feature requests
   - Plan next sprint

---

## 📚 Quick Command Reference

```bash
# Prepare for deployment
bash scripts/prepare-vercel.sh

# Deploy to production
cd web && vercel --prod

# Verify production
node scripts/verify-production.mjs https://your-url.vercel.app

# Force redeploy
vercel --prod --force

# View deployment logs
vercel logs

# Check Supabase function logs
supabase functions logs odds-assistant --follow
```

---

## 📖 Related Documentation

- `DEPLOYMENT_CHECKLIST.md` - Complete deployment guide
- `DEPLOYMENT_SUMMARY.md` - System overview
- `README.md` - Main project documentation
- `PHASE3_QUICKSTART.md` - Edge functions deployment
- `ENVIRONMENT_SETUP.md` - Environment configuration

---

## 🆘 Need Help?

If deployment fails:

1. **Check preparation**:
   ```bash
   bash scripts/prepare-vercel.sh
   ```

2. **Verify environment**:
   ```bash
   npm run verify-deployment
   ```

3. **Check Vercel logs**:
   - Go to Vercel Dashboard → Deployments
   - Click on failed deployment
   - Review build/runtime logs

4. **Test locally first**:
   ```bash
   npm run build
   npm run start
   ```

5. **Check documentation**:
   - Common Issues section above
   - `DEPLOYMENT_CHECKLIST.md` Phase 5
   - Vercel documentation

---

**Last Updated**: Phase 5 Complete
**Status**: Production Ready 🚀
