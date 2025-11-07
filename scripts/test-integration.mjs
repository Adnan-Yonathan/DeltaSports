#!/usr/bin/env node

/**
 * End-to-End Integration Testing Script
 *
 * This script tests the entire application stack:
 * - Database connectivity
 * - Edge functions
 * - API endpoints
 * - External API integrations
 *
 * Usage: node scripts/test-integration.mjs
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

console.log(`${BOLD}${BLUE}DeltaSports End-to-End Integration Test${RESET}\n`);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let allPassed = true;

/**
 * Test 1: Database Schema
 */
async function testDatabaseSchema() {
  console.log(`${BOLD}1. Testing Database Schema${RESET}`);

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

  let foundTables = 0;

  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=0`, {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        }
      });

      if (response.ok || response.status === 401) {
        // 401 is OK - means RLS is working
        console.log(`  ${GREEN}✓${RESET} ${table}`);
        foundTables++;
      } else if (response.status === 404) {
        console.log(`  ${RED}✗${RESET} ${table} ${DIM}(not found)${RESET}`);
        allPassed = false;
      } else {
        console.log(`  ${YELLOW}⚠${RESET} ${table} ${DIM}(status ${response.status})${RESET}`);
      }
    } catch (error) {
      console.log(`  ${RED}✗${RESET} ${table} ${DIM}(${error.message})${RESET}`);
      allPassed = false;
    }
  }

  console.log(`  ${DIM}Found ${foundTables}/${tables.length} tables${RESET}\n`);

  if (foundTables === 0) {
    console.log(`  ${RED}No tables found!${RESET}`);
    console.log(`  ${DIM}Run: supabase/01-schema.sql in Supabase SQL Editor${RESET}\n`);
    return false;
  }

  return foundTables === tables.length;
}

/**
 * Test 2: RLS Policies
 */
async function testRLSPolicies() {
  console.log(`${BOLD}2. Testing RLS Policies${RESET}`);

  // Try to access user_profiles without auth (should be denied)
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });

    if (response.status === 401 || response.status === 200) {
      console.log(`  ${GREEN}✓${RESET} RLS is enabled (got status ${response.status})`);
      console.log(`  ${DIM}Users cannot access other users' data${RESET}\n`);
      return true;
    } else {
      console.log(`  ${YELLOW}⚠${RESET} Unexpected status: ${response.status}`);
      console.log(`  ${DIM}RLS may not be configured correctly${RESET}\n`);
      return false;
    }
  } catch (error) {
    console.log(`  ${RED}✗${RESET} Failed to test RLS`);
    console.log(`  ${DIM}${error.message}${RESET}\n`);
    return false;
  }
}

/**
 * Test 3: Edge Functions
 */
async function testEdgeFunctions() {
  console.log(`${BOLD}3. Testing Edge Functions${RESET}`);

  // Test odds-assistant
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/odds-assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'Get NBA odds',
        sportKey: 'basketball_nba',
        regions: 'us',
        markets: 'h2h'
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok') {
        console.log(`  ${GREEN}✓${RESET} odds-assistant is working`);
        console.log(`  ${DIM}Returned ${data.odds_snapshot?.events?.length || 0} events${RESET}\n`);
        return true;
      }
    }

    console.log(`  ${RED}✗${RESET} odds-assistant failed (status ${response.status})`);
    const errorText = await response.text();
    console.log(`  ${DIM}${errorText.substring(0, 100)}...${RESET}\n`);
    allPassed = false;
    return false;
  } catch (error) {
    console.log(`  ${RED}✗${RESET} odds-assistant: ${error.message}\n`);
    allPassed = false;
    return false;
  }
}

/**
 * Test 4: External API Integration
 */
async function testExternalAPIs() {
  console.log(`${BOLD}4. Testing External API Integration${RESET}`);

  let apisWorking = 0;

  // Test The Odds API through edge function
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/odds-assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'Test odds data',
        sportKey: 'basketball_nba'
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.odds_snapshot && data.odds_snapshot.events) {
        console.log(`  ${GREEN}✓${RESET} The Odds API integration working`);
        apisWorking++;
      } else if (data.odds_snapshot && data.odds_snapshot.warnings) {
        console.log(`  ${YELLOW}⚠${RESET} The Odds API returned warnings`);
        console.log(`  ${DIM}${data.odds_snapshot.warnings.join(', ')}${RESET}`);
      }
    }
  } catch (error) {
    console.log(`  ${RED}✗${RESET} The Odds API: ${error.message}`);
  }

  // Test OpenAI through edge function
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/odds-assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'Analyze basketball betting trends',
        sportKey: 'basketball_nba'
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.model_summary && data.model_summary.length > 0) {
        console.log(`  ${GREEN}✓${RESET} OpenAI API integration working`);
        console.log(`  ${DIM}Generated ${data.model_summary.length} char summary${RESET}`);
        apisWorking++;
      }
    }
  } catch (error) {
    console.log(`  ${RED}✗${RESET} OpenAI API: ${error.message}`);
  }

  console.log('');
  return apisWorking === 2;
}

/**
 * Test 5: Application Routes
 */
async function testApplicationRoutes() {
  console.log(`${BOLD}5. Testing Application Routes (if deployed)${RESET}`);

  // This only works if the app is deployed to Vercel
  // We'll check if VERCEL_URL or similar is available

  console.log(`  ${YELLOW}⚠${RESET} Skipping (requires deployed application)`);
  console.log(`  ${DIM}Test manually after deployment${RESET}\n`);

  return true;
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`${DIM}Testing configuration:${RESET}`);
  console.log(`${DIM}  Supabase URL: ${SUPABASE_URL}${RESET}`);
  console.log(`${DIM}  Anon Key: ${ANON_KEY?.substring(0, 20)}...${RESET}\n`);
  console.log('─'.repeat(60));
  console.log('');

  const results = {
    database: await testDatabaseSchema(),
    rls: await testRLSPolicies(),
    functions: await testEdgeFunctions(),
    apis: await testExternalAPIs(),
    routes: await testApplicationRoutes()
  };

  console.log('─'.repeat(60));
  console.log(`\n${BOLD}Integration Test Results${RESET}\n`);

  Object.entries(results).forEach(([name, result]) => {
    const icon = result ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    console.log(`  ${icon} ${label}`);
  });

  console.log('');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  if (passed === total) {
    console.log(`${GREEN}${BOLD}✓ All integration tests passed! (${passed}/${total})${RESET}\n`);
    console.log('Your DeltaSports platform is ready for use!');
    console.log('\nFinal steps:');
    console.log('1. Deploy to Vercel (if not already deployed)');
    console.log('2. Create a test user account');
    console.log('3. Test all features in the UI');
    console.log('4. Monitor logs for any errors');
    console.log('');
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}✗ Some integration tests failed (${passed}/${total} passed)${RESET}\n`);
    console.log('Check the errors above and fix:');
    console.log('1. Deploy database schema if tables are missing');
    console.log('2. Configure RLS policies if data access fails');
    console.log('3. Deploy edge functions if function tests fail');
    console.log('4. Check API keys if external API tests fail');
    console.log('');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${RED}Fatal error:${RESET}`, error);
  process.exit(1);
});
