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
# From project root or web/ directory
npm run verify-env      # Run verify-env.mjs
npm run test-api-keys   # Run test-api-keys.mjs
npm run setup-supabase  # Run setup-supabase.sh
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
