# DeltaSports Helper Scripts

This directory contains automation scripts to help with environment setup and deployment.

---

## 📜 Available Scripts

### 🔍 verify-env.mjs

**Purpose**: Validates that all required environment variables are set correctly.

**Usage**:
```bash
node scripts/verify-env.mjs
```

**Checks**:
- ✓ All required variables are set
- ✓ Variables match expected format (URLs, JWT tokens, API keys)
- ✓ No template values remain
- ⚠ Warns about configuration issues

**Exit Codes**:
- `0` - All valid
- `1` - Errors found

---

### 🧪 test-api-keys.mjs

**Purpose**: Tests that all external API keys work by making real API requests.

**Usage**:
```bash
node scripts/test-api-keys.mjs
```

**Tests**:
- ✓ The Odds API connection and remaining requests
- ✓ OpenAI API connection and available models
- ✓ Supabase connection and database tables

**What it does**:
- Makes non-destructive test requests
- Reports remaining API quotas
- Verifies database tables exist
- Shows clear success/failure status

**Exit Codes**:
- `0` - All APIs working
- `1` - One or more APIs failed

---

### ⚙️ setup-supabase.sh

**Purpose**: Automated Supabase CLI setup and configuration.

**Usage**:
```bash
bash scripts/setup-supabase.sh
```

**What it does**:
1. Checks if Supabase CLI is installed
2. Verifies authentication status
3. Links to your Supabase project
4. Sets edge function secrets from .env.local
5. Optionally deploys edge functions

**Interactive**: Prompts for confirmation at key steps

---

### 🚢 deploy-functions.sh

**Purpose**: Automated deployment of all Supabase edge functions.

**Usage**:
```bash
bash scripts/deploy-functions.sh [function-name]
```

**What it does**:
1. Checks Supabase CLI prerequisites
2. Verifies edge function secrets are set
3. Deploys all or specific edge function(s)
4. Shows deployment summary

**Functions Deployed**:
- `odds-assistant` (critical)
- `on-auth-profile`
- `bankroll-metrics-sync`
- `edge-alerts-dispatch`
- `creator-feed-publish`

**Exit Codes**:
- `0` - All functions deployed successfully
- `1` - One or more deployments failed

---

### 🧪 test-functions.mjs

**Purpose**: Tests all deployed edge functions with real requests.

**Usage**:
```bash
node scripts/test-functions.mjs
```

**What it does**:
- Tests `odds-assistant` with real query (critical function)
- Checks deployment status of all other functions
- Validates response formats
- Reports pass/fail for each function

**Exit Codes**:
- `0` - Critical functions working
- `1` - Critical function failed

---

### 🔗 test-integration.mjs

**Purpose**: End-to-end integration testing of the entire stack.

**Usage**:
```bash
node scripts/test-integration.mjs
```

**What it does**:
1. Tests database schema (all 11 tables)
2. Tests RLS policies
3. Tests edge functions
4. Tests external API integration

**Exit Codes**:
- `0` - All integration tests passed
- `1` - One or more tests failed

---

### ✅ verify-deployment.mjs

**Purpose**: Comprehensive verification of entire deployment.

**Usage**:
```bash
node scripts/verify-deployment.mjs
```

**What it does**:
1. Verifies environment configuration
2. Verifies database schema
3. Tests all edge functions
4. Tests external APIs
5. Provides detailed pass/fail report

**Use this before going to production!**

**Exit Codes**:
- `0` - Deployment ready for production
- `1` - Critical issues found

---

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Create .env.local from template
cd web
cp .env.template .env.local

# 2. Edit .env.local with your API keys
nano .env.local  # or use your editor

# 3. Verify configuration
cd ..
node scripts/verify-env.mjs

# 4. Test API keys
node scripts/test-api-keys.mjs

# 5. Setup Supabase
bash scripts/setup-supabase.sh
```

---

## 📋 Typical Workflow

### When Starting Development

```bash
# Verify environment is configured
node scripts/verify-env.mjs

# If you changed API keys
node scripts/test-api-keys.mjs
```

### After Updating API Keys

```bash
# Test new keys work
node scripts/test-api-keys.mjs

# Update Supabase secrets
bash scripts/setup-supabase.sh

# Or manually:
supabase secrets set ODDS_API_KEY=new_key
supabase secrets set OPENAI_API_KEY=new_key
```

### Before Deployment

```bash
# Verify everything is configured
node scripts/verify-env.mjs
node scripts/test-api-keys.mjs

# Deploy edge functions
supabase functions deploy odds-assistant
```

---

## 🔧 NPM Scripts

For convenience, these scripts are also available as npm commands:

```bash
# From web/ directory

# Environment & Configuration
npm run verify-env          # Validate environment variables
npm run test-api-keys       # Test API connectivity
npm run setup-supabase      # Automated Supabase setup
npm run check-config        # Run all config checks

# Deployment
npm run deploy-functions    # Deploy all edge functions
npm run verify-deployment   # Complete deployment verification

# Testing
npm run test-functions      # Test all edge functions
npm run test-integration    # End-to-end integration tests
npm run test-all           # Run all tests
```

---

## 🐛 Troubleshooting

### "Cannot find module 'dotenv'"

```bash
cd web
npm install
```

The verification scripts need `dotenv` which is in web/package.json.

### "Permission denied" when running .sh script

```bash
chmod +x scripts/setup-supabase.sh
bash scripts/setup-supabase.sh
```

### ".env.local not found"

```bash
cd web
cp .env.template .env.local
# Then edit .env.local with your values
```

### "Supabase CLI not found"

```bash
npm install -g supabase
```

---

## 📝 Script Dependencies

### verify-env.mjs
- Node.js 18+
- `dotenv` package (in web/package.json)
- Reads: `web/.env.local`

### test-api-keys.mjs
- Node.js 18+
- `dotenv` package (in web/package.json)
- Network access to:
  - api.the-odds-api.com
  - api.openai.com
  - *.supabase.co
- Reads: `web/.env.local`

### setup-supabase.sh
- Bash shell
- `supabase` CLI installed
- Reads: `web/.env.local`
- Requires: Supabase account and project

---

## 🎯 Best Practices

1. **Always verify before deployment**:
   ```bash
   npm run verify-env && npm run test-api-keys
   ```

2. **Test after changing keys**:
   ```bash
   npm run test-api-keys
   ```

3. **Keep .env.local in sync with Vercel**:
   - After updating local .env.local
   - Update the same values in Vercel Dashboard
   - Trigger a redeploy

4. **Monitor API usage**:
   - `test-api-keys.mjs` shows remaining request quotas
   - Check The Odds API dashboard regularly
   - Monitor OpenAI usage at platform.openai.com/usage

---

## 🔐 Security Notes

- ⚠️ **Never commit .env.local to git** (already in .gitignore)
- ⚠️ **Never expose service role key** in client-side code
- ⚠️ **Rotate keys** if accidentally exposed
- ✓ Use different keys for dev/staging/production when possible

---

## 📚 Related Documentation

- `ENVIRONMENT_SETUP.md` - Detailed environment configuration guide
- `PHASE2_QUICKSTART.md` - Quick setup instructions
- `DEPLOYMENT_CHECKLIST.md` - Complete deployment process
- `web/.env.template` - Template for environment variables

---

## 🆘 Getting Help

If scripts fail:

1. Check error messages carefully
2. Verify .env.local has all required values
3. Test API keys individually at their respective dashboards
4. Check network connectivity
5. Ensure you have latest Supabase CLI: `npm update -g supabase`

For detailed troubleshooting, see `ENVIRONMENT_SETUP.md`.
