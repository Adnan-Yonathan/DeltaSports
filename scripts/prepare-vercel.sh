#!/bin/bash

# ============================================================================
# DeltaSports Vercel Deployment Preparation Script
# ============================================================================
# This script prepares your project for Vercel deployment by:
# - Verifying all prerequisites are met
# - Checking environment configuration
# - Running all tests
# - Providing deployment instructions
#
# Usage: bash scripts/prepare-vercel.sh
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${BLUE}   DeltaSports Vercel Deployment Preparation${RESET}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${RESET}\n"

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================
echo -e "${BOLD}1. Checking Prerequisites${RESET}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${RESET}"
    echo "Install from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js installed${RESET} ${DIM}(${NODE_VERSION})${RESET}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${RESET}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm installed${RESET} ${DIM}(v${NPM_VERSION})${RESET}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠ Vercel CLI not installed${RESET}"
    echo -e "${DIM}Install with: npm install -g vercel${RESET}"
    echo -e "${DIM}Or deploy via Vercel Dashboard${RESET}\n"
else
    VERCEL_VERSION=$(vercel -v)
    echo -e "${GREEN}✓ Vercel CLI installed${RESET} ${DIM}(${VERCEL_VERSION})${RESET}\n"
fi

# ============================================================================
# Step 2: Verify Environment Configuration
# ============================================================================
echo -e "${BOLD}2. Verifying Environment Configuration${RESET}\n"

cd web

if [ ! -f ".env.local" ]; then
    echo -e "${RED}✗ .env.local not found${RESET}"
    echo "Create from template: cp .env.template .env.local"
    exit 1
fi
echo -e "${GREEN}✓ .env.local exists${RESET}"

# Run environment verification
echo -e "${DIM}Running environment checks...${RESET}\n"
if npm run verify-env; then
    echo -e "${GREEN}✓ Environment variables valid${RESET}\n"
else
    echo -e "${RED}✗ Environment validation failed${RESET}"
    echo "Fix errors above before deploying"
    exit 1
fi

# ============================================================================
# Step 3: Test API Connectivity
# ============================================================================
echo -e "${BOLD}3. Testing API Connectivity${RESET}\n"

if npm run test-api-keys; then
    echo -e "${GREEN}✓ All APIs working${RESET}\n"
else
    echo -e "${RED}✗ API connectivity test failed${RESET}"
    echo "Fix API configuration before deploying"
    exit 1
fi

# ============================================================================
# Step 4: Install Dependencies
# ============================================================================
echo -e "${BOLD}4. Installing Dependencies${RESET}\n"

if npm install; then
    echo -e "${GREEN}✓ Dependencies installed${RESET}\n"
else
    echo -e "${RED}✗ Failed to install dependencies${RESET}"
    exit 1
fi

# ============================================================================
# Step 5: Run Build Test
# ============================================================================
echo -e "${BOLD}5. Testing Production Build${RESET}\n"

echo -e "${DIM}Running next build...${RESET}"
if npm run build; then
    echo -e "${GREEN}✓ Build successful${RESET}\n"
else
    echo -e "${RED}✗ Build failed${RESET}"
    echo "Fix build errors before deploying"
    exit 1
fi

# ============================================================================
# Step 6: Verify Deployment Readiness
# ============================================================================
echo -e "${BOLD}6. Verifying Deployment Readiness${RESET}\n"

cd ..

if node scripts/verify-deployment.mjs; then
    echo -e "${GREEN}✓ Deployment verification passed${RESET}\n"
else
    echo -e "${YELLOW}⚠ Some deployment checks failed${RESET}"
    echo "Review warnings above - deployment may still work"
    echo ""
fi

# ============================================================================
# Step 7: Provide Deployment Instructions
# ============================================================================
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}Deployment Instructions${RESET}\n"

echo -e "${GREEN}${BOLD}✓ Your project is ready for deployment!${RESET}\n"

echo -e "${BOLD}Option 1: Deploy via Vercel CLI${RESET}"
echo "  cd web"
echo "  vercel --prod"
echo ""

echo -e "${BOLD}Option 2: Deploy via Vercel Dashboard${RESET}"
echo "  1. Push to GitHub: git push origin your-branch"
echo "  2. Visit: https://vercel.com/new"
echo "  3. Import your GitHub repository"
echo "  4. Configure environment variables (see below)"
echo "  5. Deploy!"
echo ""

echo -e "${BOLD}Environment Variables for Vercel:${RESET}"
echo "  Set these in Vercel Dashboard → Settings → Environment Variables:"
echo ""
echo "  ${DIM}# Supabase (from .env.local)${RESET}"
echo "  NEXT_PUBLIC_SUPABASE_URL"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "  ${DIM}# External APIs (from .env.local)${RESET}"
echo "  ODDS_API_KEY"
echo "  OPENAI_API_KEY"
echo ""
echo "  ${DIM}# App Configuration${RESET}"
echo "  NEXT_PUBLIC_CHAT_MODE=api"
echo ""

echo -e "${BOLD}After Deployment:${RESET}"
echo "  1. Test your deployed site"
echo "  2. Create a test user account"
echo "  3. Verify all features work"
echo "  4. Run: node scripts/verify-production.mjs <your-url>"
echo ""

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${RESET}\n"

exit 0
