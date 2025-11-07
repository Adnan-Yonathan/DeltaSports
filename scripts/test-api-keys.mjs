#!/usr/bin/env node

/**
 * API Key Testing Script
 *
 * This script tests that all external API keys work by making test requests
 *
 * Usage: node scripts/test-api-keys.mjs
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

console.log(`${BOLD}${BLUE}DeltaSports API Key Testing${RESET}\n`);

let allPassed = true;

/**
 * Test The Odds API
 */
async function testOddsAPI() {
  console.log(`${BOLD}Testing The Odds API...${RESET}`);

  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey || apiKey === 'your_odds_api_key_here') {
    console.log(`${RED}✗ ODDS_API_KEY not configured${RESET}\n`);
    return false;
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (response.ok) {
      const data = await response.json();
      const requestsRemaining = response.headers.get('x-requests-remaining');
      const requestsUsed = response.headers.get('x-requests-used');

      console.log(`${GREEN}✓ The Odds API: Connected successfully${RESET}`);
      console.log(`  ${DIM}Sports available: ${data.length}${RESET}`);
      if (requestsRemaining) {
        console.log(`  ${DIM}Requests remaining: ${requestsRemaining}${RESET}`);
        console.log(`  ${DIM}Requests used: ${requestsUsed}${RESET}`);

        if (parseInt(requestsRemaining) < 50) {
          console.log(`  ${YELLOW}⚠ Low on API requests (free tier: 500/month)${RESET}`);
        }
      }
      console.log('');
      return true;
    } else if (response.status === 401) {
      console.log(`${RED}✗ The Odds API: Invalid API key (401 Unauthorized)${RESET}\n`);
      return false;
    } else {
      console.log(`${RED}✗ The Odds API: Error ${response.status}${RESET}`);
      console.log(`  ${DIM}${await response.text()}${RESET}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗ The Odds API: Request failed${RESET}`);
    console.log(`  ${DIM}${error.message}${RESET}\n`);
    return false;
  }
}

/**
 * Test OpenAI API
 */
async function testOpenAI() {
  console.log(`${BOLD}Testing OpenAI API...${RESET}`);

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'sk-proj-your_openai_key_here') {
    console.log(`${RED}✗ OPENAI_API_KEY not configured${RESET}\n`);
    return false;
  }

  try {
    // Test by listing models (doesn't consume credits)
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json();
      const hasGPT4 = data.data.some(m => m.id.includes('gpt-4'));

      console.log(`${GREEN}✓ OpenAI API: Connected successfully${RESET}`);
      console.log(`  ${DIM}Models available: ${data.data.length}${RESET}`);
      console.log(`  ${DIM}GPT-4 access: ${hasGPT4 ? 'Yes' : 'No'}${RESET}`);
      console.log('');
      return true;
    } else if (response.status === 401) {
      console.log(`${RED}✗ OpenAI API: Invalid API key (401 Unauthorized)${RESET}\n`);
      return false;
    } else if (response.status === 429) {
      console.log(`${RED}✗ OpenAI API: Rate limit exceeded or insufficient credits${RESET}\n`);
      return false;
    } else {
      const errorData = await response.json();
      console.log(`${RED}✗ OpenAI API: Error ${response.status}${RESET}`);
      console.log(`  ${DIM}${errorData.error?.message || 'Unknown error'}${RESET}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗ OpenAI API: Request failed${RESET}`);
    console.log(`  ${DIM}${error.message}${RESET}\n`);
    return false;
  }
}

/**
 * Test Supabase Connection
 */
async function testSupabase() {
  console.log(`${BOLD}Testing Supabase Connection...${RESET}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.log(`${RED}✗ Supabase credentials not configured${RESET}\n`);
    return false;
  }

  try {
    // Test connection to Supabase REST API
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok || response.status === 404) {
      // 404 is expected for root endpoint
      console.log(`${GREEN}✓ Supabase: Connected successfully${RESET}`);
      console.log(`  ${DIM}Project URL: ${url}${RESET}`);
      console.log('');

      // Try to check if tables exist
      const tablesResponse = await fetch(`${url}/rest/v1/user_profiles?limit=0`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });

      if (tablesResponse.ok) {
        console.log(`  ${GREEN}✓ Database tables accessible${RESET}`);
        console.log(`  ${DIM}user_profiles table exists${RESET}\n`);
      } else if (tablesResponse.status === 401 || tablesResponse.status === 403) {
        console.log(`  ${YELLOW}⚠ Tables exist but RLS may need configuration${RESET}\n`);
      } else {
        console.log(`  ${YELLOW}⚠ user_profiles table not found${RESET}`);
        console.log(`  ${DIM}Run: supabase/01-schema.sql in SQL Editor${RESET}\n`);
      }

      return true;
    } else if (response.status === 401) {
      console.log(`${RED}✗ Supabase: Invalid anon key (401 Unauthorized)${RESET}\n`);
      return false;
    } else {
      console.log(`${RED}✗ Supabase: Error ${response.status}${RESET}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗ Supabase: Request failed${RESET}`);
    console.log(`  ${DIM}${error.message}${RESET}\n`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  const results = await Promise.all([
    testSupabase(),
    testOddsAPI(),
    testOpenAI()
  ]);

  allPassed = results.every(r => r);

  console.log('─'.repeat(60));

  if (allPassed) {
    console.log(`\n${GREEN}${BOLD}✓ All API keys are working correctly!${RESET}\n`);
    console.log('Your environment is ready for deployment.');
    console.log('\nNext steps:');
    console.log('1. Add these same values to Vercel environment variables');
    console.log('2. Set ODDS_API_KEY and OPENAI_API_KEY as Supabase secrets:');
    console.log(`   ${DIM}supabase secrets set ODDS_API_KEY=<your_key>${RESET}`);
    console.log(`   ${DIM}supabase secrets set OPENAI_API_KEY=<your_key>${RESET}`);
    console.log('3. Deploy edge functions:');
    console.log(`   ${DIM}supabase functions deploy odds-assistant${RESET}`);
    console.log('');
  } else {
    console.log(`\n${RED}${BOLD}✗ Some API keys are not working${RESET}\n`);
    console.log('Please check the errors above and verify your API keys.');
    console.log('Common issues:');
    console.log('- Invalid or expired API key');
    console.log('- Rate limits exceeded');
    console.log('- Insufficient credits (OpenAI)');
    console.log('- Network connectivity issues');
    console.log('');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error(`${RED}Fatal error:${RESET}`, error);
  process.exit(1);
});
