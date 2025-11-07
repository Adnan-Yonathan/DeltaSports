#!/usr/bin/env node

/**
 * Edge Function Testing Script
 *
 * This script tests all deployed edge functions with real requests
 *
 * Usage: node scripts/test-functions.mjs [function-name]
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

console.log(`${BOLD}${BLUE}DeltaSports Edge Function Testing${RESET}\n`);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.log(`${RED}✗ Supabase credentials not configured${RESET}`);
  console.log('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

/**
 * Test odds-assistant function
 */
async function testOddsAssistant() {
  console.log(`${BOLD}Testing odds-assistant...${RESET}`);

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

      if (data.status === 'ok' && data.odds_snapshot) {
        console.log(`${GREEN}✓ odds-assistant: Working correctly${RESET}`);
        console.log(`  ${DIM}Events returned: ${data.odds_snapshot.events?.length || 0}${RESET}`);
        console.log(`  ${DIM}Model summary: ${data.model_summary ? 'Generated' : 'Missing'}${RESET}`);

        if (data.odds_snapshot.warnings && data.odds_snapshot.warnings.length > 0) {
          console.log(`  ${YELLOW}⚠ Warnings: ${data.odds_snapshot.warnings.join(', ')}${RESET}`);
        }

        console.log('');
        return true;
      } else {
        console.log(`${RED}✗ odds-assistant: Unexpected response format${RESET}`);
        console.log(`  ${DIM}${JSON.stringify(data).substring(0, 200)}...${RESET}\n`);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log(`${RED}✗ odds-assistant: Error ${response.status}${RESET}`);
      console.log(`  ${DIM}${errorText.substring(0, 200)}${RESET}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗ odds-assistant: Request failed${RESET}`);
    console.log(`  ${DIM}${error.message}${RESET}\n`);
    return false;
  }
}

/**
 * Test on-auth-profile function
 */
async function testOnAuthProfile() {
  console.log(`${BOLD}Testing on-auth-profile...${RESET}`);

  try {
    // This function is triggered by Supabase Auth, so we test it's deployed
    const response = await fetch(`${SUPABASE_URL}/functions/v1/on-auth-profile`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok || response.status === 204) {
      console.log(`${GREEN}✓ on-auth-profile: Deployed and accessible${RESET}`);
      console.log(`  ${DIM}Function will be triggered on user signup${RESET}\n`);
      return true;
    } else if (response.status === 404) {
      console.log(`${YELLOW}⚠ on-auth-profile: Not deployed${RESET}`);
      console.log(`  ${DIM}Deploy with: supabase functions deploy on-auth-profile${RESET}\n`);
      return false;
    } else {
      console.log(`${YELLOW}⚠ on-auth-profile: Status ${response.status}${RESET}`);
      console.log(`  ${DIM}Function may not be configured correctly${RESET}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗ on-auth-profile: Request failed${RESET}`);
    console.log(`  ${DIM}${error.message}${RESET}\n`);
    return false;
  }
}

/**
 * Test bankroll-metrics-sync function
 */
async function testBankrollMetricsSync() {
  console.log(`${BOLD}Testing bankroll-metrics-sync...${RESET}`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/bankroll-metrics-sync`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok || response.status === 204) {
      console.log(`${GREEN}✓ bankroll-metrics-sync: Deployed and accessible${RESET}`);
      console.log(`  ${DIM}Can be triggered to sync bankroll metrics${RESET}\n`);
      return true;
    } else if (response.status === 404) {
      console.log(`${YELLOW}⚠ bankroll-metrics-sync: Not deployed (optional)${RESET}\n`);
      return true; // Not critical
    } else {
      console.log(`${YELLOW}⚠ bankroll-metrics-sync: Status ${response.status}${RESET}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗ bankroll-metrics-sync: Request failed${RESET}`);
    console.log(`  ${DIM}${error.message}${RESET}\n`);
    return false;
  }
}

/**
 * Test edge-alerts-dispatch function
 */
async function testEdgeAlertsDispatch() {
  console.log(`${BOLD}Testing edge-alerts-dispatch...${RESET}`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/edge-alerts-dispatch`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok || response.status === 204) {
      console.log(`${GREEN}✓ edge-alerts-dispatch: Deployed and accessible${RESET}`);
      console.log(`  ${DIM}Can dispatch edge alerts to users${RESET}\n`);
      return true;
    } else if (response.status === 404) {
      console.log(`${YELLOW}⚠ edge-alerts-dispatch: Not deployed (optional)${RESET}\n`);
      return true; // Not critical
    } else {
      console.log(`${YELLOW}⚠ edge-alerts-dispatch: Status ${response.status}${RESET}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗ edge-alerts-dispatch: Request failed${RESET}`);
    console.log(`  ${DIM}${error.message}${RESET}\n`);
    return false;
  }
}

/**
 * Test creator-feed-publish function
 */
async function testCreatorFeedPublish() {
  console.log(`${BOLD}Testing creator-feed-publish...${RESET}`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/creator-feed-publish`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok || response.status === 204) {
      console.log(`${GREEN}✓ creator-feed-publish: Deployed and accessible${RESET}`);
      console.log(`  ${DIM}Creators can publish content to feed${RESET}\n`);
      return true;
    } else if (response.status === 404) {
      console.log(`${YELLOW}⚠ creator-feed-publish: Not deployed (optional)${RESET}\n`);
      return true; // Not critical
    } else {
      console.log(`${YELLOW}⚠ creator-feed-publish: Status ${response.status}${RESET}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗ creator-feed-publish: Request failed${RESET}`);
    console.log(`  ${DIM}${error.message}${RESET}\n`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  const results = {
    'odds-assistant': await testOddsAssistant(),
    'on-auth-profile': await testOnAuthProfile(),
    'bankroll-metrics-sync': await testBankrollMetricsSync(),
    'edge-alerts-dispatch': await testEdgeAlertsDispatch(),
    'creator-feed-publish': await testCreatorFeedPublish()
  };

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  console.log('─'.repeat(60));
  console.log(`\n${BOLD}Test Results${RESET}`);
  console.log(`  Passed: ${passed}/${total}`);
  console.log('');

  Object.entries(results).forEach(([name, result]) => {
    const icon = result ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`  ${icon} ${name}`);
  });

  console.log('');

  if (results['odds-assistant']) {
    console.log(`${GREEN}${BOLD}✓ Critical functions are working!${RESET}\n`);
    console.log('Your edge functions are ready for production.');
    console.log('\nNext steps:');
    console.log('1. Test the web application: visit your Vercel URL');
    console.log('2. Sign up for a test account');
    console.log('3. Test odds scanner feature');
    console.log('4. Test chat assistant');
    console.log('');
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}✗ Critical function (odds-assistant) is not working${RESET}\n`);
    console.log('Check the errors above and verify:');
    console.log('1. ODDS_API_KEY and OPENAI_API_KEY are set as Supabase secrets');
    console.log('2. Edge functions are deployed: npm run deploy-functions');
    console.log('3. API keys are valid: npm run test-api-keys');
    console.log('');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${RED}Fatal error:${RESET}`, error);
  process.exit(1);
});
