#!/bin/bash

# ============================================================================
# DeltaSports Edge Functions Deployment Script
# ============================================================================
# This script deploys all Supabase edge functions with proper error handling
# Usage: bash scripts/deploy-functions.sh [function-name]
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BOLD}${BLUE}DeltaSports Edge Functions Deployment${RESET}\n"

# ============================================================================
# Check prerequisites
# ============================================================================
echo -e "${BOLD}Checking prerequisites...${RESET}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not found${RESET}"
    echo "Install with: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI installed${RESET}"

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}✗ Not logged in to Supabase${RESET}"
    echo "Login with: supabase login"
    exit 1
fi
echo -e "${GREEN}✓ Logged in to Supabase${RESET}"

# Check if project is linked
if [ ! -f ".git/supabase-project-ref" ] && [ ! -f "supabase/.temp/project-ref" ]; then
    echo -e "${RED}✗ Project not linked${RESET}"
    echo "Link project with: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi
echo -e "${GREEN}✓ Project linked${RESET}\n"

# ============================================================================
# Verify secrets are set
# ============================================================================
echo -e "${BOLD}Verifying edge function secrets...${RESET}"

SECRETS=$(supabase secrets list 2>&1)

if echo "$SECRETS" | grep -q "ODDS_API_KEY"; then
    echo -e "${GREEN}✓ ODDS_API_KEY is set${RESET}"
else
    echo -e "${RED}✗ ODDS_API_KEY not set${RESET}"
    echo "Set with: supabase secrets set ODDS_API_KEY=your_key"
    exit 1
fi

if echo "$SECRETS" | grep -q "OPENAI_API_KEY"; then
    echo -e "${GREEN}✓ OPENAI_API_KEY is set${RESET}"
else
    echo -e "${RED}✗ OPENAI_API_KEY not set${RESET}"
    echo "Set with: supabase secrets set OPENAI_API_KEY=your_key"
    exit 1
fi

echo ""

# ============================================================================
# Define available functions
# ============================================================================
AVAILABLE_FUNCTIONS=(
    "odds-assistant"
    "on-auth-profile"
    "bankroll-metrics-sync"
    "edge-alerts-dispatch"
    "creator-feed-publish"
)

# ============================================================================
# Deploy function(s)
# ============================================================================

deploy_function() {
    local func_name=$1

    echo -e "${BOLD}Deploying ${func_name}...${RESET}"

    if [ ! -d "supabase/functions/${func_name}" ]; then
        echo -e "${RED}✗ Function directory not found: supabase/functions/${func_name}${RESET}"
        return 1
    fi

    if supabase functions deploy "$func_name" --no-verify-jwt; then
        echo -e "${GREEN}✓ ${func_name} deployed successfully${RESET}\n"
        return 0
    else
        echo -e "${RED}✗ ${func_name} deployment failed${RESET}\n"
        return 1
    fi
}

# If specific function specified, deploy only that one
if [ -n "$1" ]; then
    FUNCTION_NAME=$1

    # Check if function exists in available list
    if [[ ! " ${AVAILABLE_FUNCTIONS[@]} " =~ " ${FUNCTION_NAME} " ]]; then
        echo -e "${RED}Unknown function: ${FUNCTION_NAME}${RESET}"
        echo ""
        echo "Available functions:"
        for func in "${AVAILABLE_FUNCTIONS[@]}"; do
            echo "  - $func"
        done
        exit 1
    fi

    deploy_function "$FUNCTION_NAME"
    exit $?
fi

# Deploy all functions
echo -e "${BOLD}Deploying all edge functions...${RESET}\n"

DEPLOYED=0
FAILED=0

for func in "${AVAILABLE_FUNCTIONS[@]}"; do
    if deploy_function "$func"; then
        ((DEPLOYED++))
    else
        ((FAILED++))
    fi
done

# ============================================================================
# Summary
# ============================================================================
echo "─────────────────────────────────────────────────────────────"
echo -e "${BOLD}Deployment Summary${RESET}"
echo -e "  Successfully deployed: ${GREEN}${DEPLOYED}${RESET}"
echo -e "  Failed: ${RED}${FAILED}${RESET}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ All edge functions deployed successfully!${RESET}\n"
    echo "Next steps:"
    echo "1. Test functions: npm run test-functions"
    echo "2. Check logs: supabase functions logs <function-name>"
    echo "3. Test integration: npm run test-integration"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}✗ Some deployments failed${RESET}\n"
    echo "Check the errors above and try again"
    echo ""
    exit 1
fi
