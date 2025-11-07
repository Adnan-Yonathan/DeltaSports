#!/bin/bash

# ============================================================================
# DeltaSports Supabase Setup Helper Script
# ============================================================================
# This script helps you set up Supabase CLI and configure edge function secrets
# Usage: bash scripts/setup-supabase.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BOLD}${BLUE}DeltaSports Supabase Setup${RESET}\n"

# ============================================================================
# Step 1: Check if Supabase CLI is installed
# ============================================================================
echo -e "${BOLD}Step 1: Checking Supabase CLI...${RESET}"

if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✓ Supabase CLI is installed${RESET}"
    supabase --version
else
    echo -e "${YELLOW}⚠ Supabase CLI not found${RESET}"
    echo ""
    echo "Install Supabase CLI with:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo ""

# ============================================================================
# Step 2: Check if logged in
# ============================================================================
echo -e "${BOLD}Step 2: Checking authentication...${RESET}"

if supabase projects list &> /dev/null; then
    echo -e "${GREEN}✓ Logged in to Supabase${RESET}"
else
    echo -e "${YELLOW}⚠ Not logged in to Supabase${RESET}"
    echo ""
    echo "Login with:"
    echo "  supabase login"
    echo ""
    read -p "Would you like to login now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase login
    else
        echo "Please run 'supabase login' before continuing"
        exit 1
    fi
fi

echo ""

# ============================================================================
# Step 3: Check if project is linked
# ============================================================================
echo -e "${BOLD}Step 3: Checking project linkage...${RESET}"

if [ -f ".git/supabase-project-ref" ]; then
    PROJECT_REF=$(cat .git/supabase-project-ref)
    echo -e "${GREEN}✓ Project already linked: ${PROJECT_REF}${RESET}"
else
    echo -e "${YELLOW}⚠ Project not linked${RESET}"
    echo ""
    echo "To link your project:"
    echo "1. Get your project ref from Supabase Dashboard → Settings → General"
    echo "2. Run: supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    read -p "Enter your project ref (or press Enter to skip): " PROJECT_REF

    if [ -n "$PROJECT_REF" ]; then
        supabase link --project-ref "$PROJECT_REF"
        echo -e "${GREEN}✓ Project linked successfully${RESET}"
    else
        echo "Skipping project linking"
        exit 0
    fi
fi

echo ""

# ============================================================================
# Step 4: Set up edge function secrets
# ============================================================================
echo -e "${BOLD}Step 4: Setting up edge function secrets...${RESET}"

# Load .env.local if it exists
ENV_FILE="web/.env.local"

if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✓ Found .env.local${RESET}"
    source "$ENV_FILE"
else
    echo -e "${YELLOW}⚠ .env.local not found${RESET}"
    echo "Please create web/.env.local with your API keys first"
    exit 1
fi

# Set ODDS_API_KEY
if [ -n "$ODDS_API_KEY" ] && [ "$ODDS_API_KEY" != "your_odds_api_key_here" ]; then
    echo -e "\nSetting ODDS_API_KEY..."
    echo "$ODDS_API_KEY" | supabase secrets set ODDS_API_KEY --env-file /dev/stdin
    echo -e "${GREEN}✓ ODDS_API_KEY set${RESET}"
else
    echo -e "${RED}✗ ODDS_API_KEY not configured in .env.local${RESET}"
fi

# Set OPENAI_API_KEY
if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "sk-proj-your_openai_key_here" ]; then
    echo -e "\nSetting OPENAI_API_KEY..."
    echo "$OPENAI_API_KEY" | supabase secrets set OPENAI_API_KEY --env-file /dev/stdin
    echo -e "${GREEN}✓ OPENAI_API_KEY set${RESET}"
else
    echo -e "${RED}✗ OPENAI_API_KEY not configured in .env.local${RESET}"
fi

echo ""

# ============================================================================
# Step 5: Verify secrets
# ============================================================================
echo -e "${BOLD}Step 5: Verifying secrets...${RESET}"
echo ""

supabase secrets list

echo ""

# ============================================================================
# Step 6: Deploy edge functions (optional)
# ============================================================================
echo -e "${BOLD}Step 6: Edge function deployment${RESET}"
echo ""
read -p "Would you like to deploy the odds-assistant edge function now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\nDeploying odds-assistant..."
    supabase functions deploy odds-assistant
    echo -e "${GREEN}✓ odds-assistant deployed${RESET}"

    echo ""
    read -p "Deploy other edge functions? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deploying all edge functions..."
        supabase functions deploy bankroll-metrics-sync || echo "Skipping bankroll-metrics-sync"
        supabase functions deploy edge-alerts-dispatch || echo "Skipping edge-alerts-dispatch"
        supabase functions deploy creator-feed-publish || echo "Skipping creator-feed-publish"
        supabase functions deploy on-auth-profile || echo "Skipping on-auth-profile"
        echo -e "${GREEN}✓ All edge functions deployed${RESET}"
    fi
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo -e "${GREEN}${BOLD}✓ Supabase setup complete!${RESET}\n"
echo "Next steps:"
echo "1. Verify database schema is deployed (run 01-schema.sql in SQL Editor)"
echo "2. Verify RLS policies are set (run 02-rls-policies.sql in SQL Editor)"
echo "3. Configure Vercel environment variables"
echo "4. Push to trigger deployment"
echo ""
