#!/usr/bin/env node

/**
 * Complete Deployment Verification Script
 *
 * This script performs a comprehensive verification of the entire DeltaSports
 * deployment including environment, database, edge functions, and APIs.
 *
 * Usage: node scripts/verify-deployment.mjs
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from web directory
const envPath = resolve(__dirname, '../web/.env.local');
config({ path: envPath });

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}${BLUE}   DeltaSports Complete Deployment Verification${RESET}`);
console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${RESET}\n`);

const results = {
  environment: { passed: 0, failed: 0, warnings: 0 },
  database: { passed: 0, failed: 0, warnings: 0 },
  functions: { passed: 0, failed: 0, warnings: 0 },
  apis: { passed: 0, failed: 0, warnings: 0 }
};

/**
 * SECTION 1: Environment Variables
 */
async function verifyEnvironment() {
  console.log(`${BOLD}1. Verifying Environment Configuration${RESET}\n`);

  const checks = [
    {
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      value: process.env.NEXT_PUBLIC_SUPABASE_URL,
      validate: (v) => v && v.startsWith('https://') && v.includes('.supabase.co')
    },
    {
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      validate: (v) => v && v.startsWith('eyJ') && v.length > 100
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      value: process.env.SUPABASE_SERVICE_ROLE_KEY,
      validate: (v) => v && v.startsWith('eyJ') && v.length > 100
    },
    {
      name: 'ODDS_API_KEY',
      value: process.env.ODDS_API_KEY,
      validate: (v) => v && v.length > 10 && !v.includes('your_') && !v.includes('YOUR_')
    },
    {
      name: 'OPENAI_API_KEY',
      value: process.env.OPENAI_API_KEY,
      validate: (v) => v && (v.startsWith('sk-') || v.startsWith('sk-proj-'))
    },
    {
      name: 'NEXT_PUBLIC_CHAT_MODE',
      value: process.env.NEXT_PUBLIC_CHAT_MODE,
      validate: (v) => v === 'api' || v === 'stream'
    }
  ];

  for (const check of checks) {
    if (!check.value) {
      console.log(`  ${RED}✗${RESET} ${check.name} ${DIM}(not set)${RESET}`);
      results.environment.failed++;
    } else if (!check.validate(check.value)) {
      console.log(`  ${YELLOW}⚠${RESET} ${check.name} ${DIM}(invalid format)${RESET}`);
      results.environment.warnings++;
    } else {
      console.log(`  ${GREEN}✓${RESET} ${check.name}`);
      results.environment.passed++;
    }
  }

  console.log('');
}

/**
 * SECTION 2: Database Schema
 */
async function verifyDatabase() {
  console.log(`${BOLD}2. Verifying Database Schema${RESET}\n`);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !ANON_KEY) {
    console.log(`  ${RED}✗ Cannot verify database - missing credentials${RESET}\n`);
    results.database.failed++;
    return;
  }

  const tables = [
    'user_profiles',
    'chat_sessions',
    'chat_messages',
    'bankroll_accounts',
    'bets',
    'bet_tags',
    'edge_alerts',
    'alert_events',
    'creator_profiles',
    'creator_posts',
    'creator_subscriptions'
  ];

  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=0`, {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        }
      });

      if (response.ok || response.status === 401) {
        // 401 means RLS is working - table exists
        console.log(`  ${GREEN}✓${RESET} ${table}`);
        results.database.passed++;
      } else if (response.status === 404) {
        console.log(`  ${RED}✗${RESET} ${table} ${DIM}(not found)${RESET}`);
        results.database.failed++;
      } else {
        console.log(`  ${YELLOW}⚠${RESET} ${table} ${DIM}(status ${response.status})${RESET}`);
        results.database.warnings++;
      }
    } catch (error) {
      console.log(`  ${RED}✗${RESET} ${table} ${DIM}(${error.message})${RESET}`);
      results.database.failed++;
    }
  }

  console.log('');
}

/**
 * SECTION 3: Edge Functions
 */
async function verifyEdgeFunctions() {
  console.log(`${BOLD}3. Verifying Edge Functions${RESET}\n`);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !ANON_KEY) {
    console.log(`  ${RED}✗ Cannot verify functions - missing credentials${RESET}\n`);
    results.functions.failed++;
    return;
  }

  // Test odds-assistant with real request
  try {
    console.log(`  ${DIM}Testing odds-assistant (critical)...${RESET}`);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/odds-assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'Verify deployment',
        sportKey: 'basketball_nba',
        regions: 'us',
        markets: 'h2h'
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok') {
        console.log(`  ${GREEN}✓${RESET} odds-assistant ${DIM}(${data.odds_snapshot?.events?.length || 0} events)${RESET}`);
        results.functions.passed++;
      } else {
        console.log(`  ${YELLOW}⚠${RESET} odds-assistant ${DIM}(unexpected response)${RESET}`);
        results.functions.warnings++;
      }
    } else {
      console.log(`  ${RED}✗${RESET} odds-assistant ${DIM}(status ${response.status})${RESET}`);
      results.functions.failed++;
    }
  } catch (error) {
    console.log(`  ${RED}✗${RESET} odds-assistant ${DIM}(${error.message})${RESET}`);
    results.functions.failed++;
  }

  // Test other functions (deployment check only)
  const otherFunctions = [
    'on-auth-profile',
    'bankroll-metrics-sync',
    'edge-alerts-dispatch',
    'creator-feed-publish'
  ];

  for (const func of otherFunctions) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${func}`, {
        method: 'OPTIONS',
        headers: { 'Authorization': `Bearer ${ANON_KEY}` },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok || response.status === 204) {
        console.log(`  ${GREEN}✓${RESET} ${func}`);
        results.functions.passed++;
      } else if (response.status === 404) {
        console.log(`  ${YELLOW}⚠${RESET} ${func} ${DIM}(not deployed - optional)${RESET}`);
        results.functions.warnings++;
      } else {
        console.log(`  ${YELLOW}⚠${RESET} ${func} ${DIM}(status ${response.status})${RESET}`);
        results.functions.warnings++;
      }
    } catch (error) {
      console.log(`  ${YELLOW}⚠${RESET} ${func} ${DIM}(${error.message})${RESET}`);
      results.functions.warnings++;
    }
  }

  console.log('');
}

/**
 * SECTION 4: External APIs
 */
async function verifyExternalAPIs() {
  console.log(`${BOLD}4. Verifying External API Integration${RESET}\n`);

  // Test The Odds API
  const oddsApiKey = process.env.ODDS_API_KEY;
  if (oddsApiKey && !oddsApiKey.includes('your_')) {
    try {
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/?apiKey=${oddsApiKey}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (response.ok) {
        const remaining = response.headers.get('x-requests-remaining');
        console.log(`  ${GREEN}✓${RESET} The Odds API ${DIM}(${remaining} requests remaining)${RESET}`);
        results.apis.passed++;
      } else {
        console.log(`  ${RED}✗${RESET} The Odds API ${DIM}(status ${response.status})${RESET}`);
        results.apis.failed++;
      }
    } catch (error) {
      console.log(`  ${RED}✗${RESET} The Odds API ${DIM}(${error.message})${RESET}`);
      results.apis.failed++;
    }
  } else {
    console.log(`  ${YELLOW}⚠${RESET} The Odds API ${DIM}(key not configured)${RESET}`);
    results.apis.warnings++;
  }

  // Test OpenAI API
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.startsWith('sk-')) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${openaiKey}` },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        console.log(`  ${GREEN}✓${RESET} OpenAI API`);
        results.apis.passed++;
      } else {
        console.log(`  ${RED}✗${RESET} OpenAI API ${DIM}(status ${response.status})${RESET}`);
        results.apis.failed++;
      }
    } catch (error) {
      console.log(`  ${RED}✗${RESET} OpenAI API ${DIM}(${error.message})${RESET}`);
      results.apis.failed++;
    }
  } else {
    console.log(`  ${YELLOW}⚠${RESET} OpenAI API ${DIM}(key not configured)${RESET}`);
    results.apis.warnings++;
  }

  // Test Supabase connectivity
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && anonKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok || response.status === 404) {
        console.log(`  ${GREEN}✓${RESET} Supabase API`);
        results.apis.passed++;
      } else {
        console.log(`  ${RED}✗${RESET} Supabase API ${DIM}(status ${response.status})${RESET}`);
        results.apis.failed++;
      }
    } catch (error) {
      console.log(`  ${RED}✗${RESET} Supabase API ${DIM}(${error.message})${RESET}`);
      results.apis.failed++;
    }
  } else {
    console.log(`  ${YELLOW}⚠${RESET} Supabase API ${DIM}(credentials not configured)${RESET}`);
    results.apis.warnings++;
  }

  console.log('');
}

/**
 * Display Final Results
 */
function displayResults() {
  console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}Deployment Verification Results${RESET}\n`);

  const sections = [
    { name: 'Environment', data: results.environment },
    { name: 'Database', data: results.database },
    { name: 'Edge Functions', data: results.functions },
    { name: 'External APIs', data: results.apis }
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  let totalWarnings = 0;

  sections.forEach(({ name, data }) => {
    const total = data.passed + data.failed + data.warnings;
    const icon = data.failed === 0 ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;

    console.log(`  ${icon} ${BOLD}${name}${RESET}`);
    console.log(`    ${GREEN}Passed: ${data.passed}${RESET} | ${RED}Failed: ${data.failed}${RESET} | ${YELLOW}Warnings: ${data.warnings}${RESET}`);

    totalPassed += data.passed;
    totalFailed += data.failed;
    totalWarnings += data.warnings;
  });

  console.log('');
  console.log(`${BOLD}Overall:${RESET} ${GREEN}${totalPassed} passed${RESET} | ${RED}${totalFailed} failed${RESET} | ${YELLOW}${totalWarnings} warnings${RESET}`);
  console.log('');

  // Determine deployment status
  const criticalFailed = results.environment.failed > 0 ||
                        results.database.failed > 0 ||
                        results.functions.failed > 0;

  if (criticalFailed) {
    console.log(`${RED}${BOLD}✗ Deployment verification failed${RESET}\n`);
    console.log('Critical issues detected. Please fix the following:');

    if (results.environment.failed > 0) {
      console.log(`  • Environment variables not configured correctly`);
      console.log(`    Run: ${DIM}npm run verify-env${RESET}`);
    }
    if (results.database.failed > 0) {
      console.log(`  • Database schema not deployed`);
      console.log(`    Deploy: ${DIM}supabase/01-schema.sql in SQL Editor${RESET}`);
    }
    if (results.functions.failed > 0) {
      console.log(`  • Edge functions not working`);
      console.log(`    Run: ${DIM}npm run deploy-functions${RESET}`);
    }

    console.log('');
    console.log(`See ${BOLD}DEPLOYMENT_CHECKLIST.md${RESET} for detailed instructions`);
    console.log('');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`${YELLOW}${BOLD}⚠ Deployment verification passed with warnings${RESET}\n`);
    console.log('Core functionality is working, but some optional features may not be available.');
    console.log('Review warnings above and fix if needed.');
    console.log('');
    process.exit(0);
  } else {
    console.log(`${GREEN}${BOLD}✓ All deployment checks passed!${RESET}\n`);
    console.log('Your DeltaSports platform is fully deployed and ready for use.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Deploy to Vercel (if not already deployed)');
    console.log('  2. Create a test user account');
    console.log('  3. Test all features in the UI');
    console.log('  4. Monitor function logs for any errors');
    console.log('');
    console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${RESET}`);
    console.log('');
    process.exit(0);
  }
}

/**
 * Run all verification checks
 */
async function runVerification() {
  try {
    await verifyEnvironment();
    await verifyDatabase();
    await verifyEdgeFunctions();
    await verifyExternalAPIs();
    displayResults();
  } catch (error) {
    console.error(`${RED}${BOLD}Fatal error during verification:${RESET}`, error);
    process.exit(1);
  }
}

// Run verification
runVerification();
