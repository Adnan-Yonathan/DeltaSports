#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 *
 * This script checks that all required environment variables are set
 * and validates their format.
 *
 * Usage: node scripts/verify-env.mjs
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

console.log(`${BOLD}${BLUE}DeltaSports Environment Verification${RESET}\n`);

let allValid = true;
let warnings = [];

// Required environment variables
const REQUIRED_VARS = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase Project URL',
    validate: (value) => {
      if (!value) return 'Not set';
      if (!value.startsWith('https://')) return 'Must start with https://';
      if (!value.includes('.supabase.co')) return 'Must be a supabase.co domain';
      return null;
    }
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase Anon Key',
    validate: (value) => {
      if (!value) return 'Not set';
      if (!value.startsWith('eyJ')) return 'Must be a valid JWT (starts with eyJ)';
      if (value.length < 100) return 'Key seems too short';
      return null;
    }
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase Service Role Key',
    validate: (value) => {
      if (!value) return 'Not set';
      if (!value.startsWith('eyJ')) return 'Must be a valid JWT (starts with eyJ)';
      if (value.length < 100) return 'Key seems too short';
      return null;
    }
  },
  {
    name: 'ODDS_API_KEY',
    description: 'The Odds API Key',
    validate: (value) => {
      if (!value) return 'Not set';
      if (value === 'your_odds_api_key_here') return 'Still using template value';
      if (value.length < 10) return 'Key seems too short';
      return null;
    }
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API Key',
    validate: (value) => {
      if (!value) return 'Not set';
      if (value === 'sk-proj-your_openai_key_here') return 'Still using template value';
      if (!value.startsWith('sk-')) return 'Must start with sk-';
      if (value.length < 20) return 'Key seems too short';
      return null;
    }
  },
  {
    name: 'NEXT_PUBLIC_CHAT_MODE',
    description: 'Chat Mode (api or mock)',
    validate: (value) => {
      if (!value) {
        warnings.push('NEXT_PUBLIC_CHAT_MODE not set, defaulting to mock mode');
        return null;
      }
      if (value !== 'api' && value !== 'mock') {
        return 'Must be "api" or "mock"';
      }
      if (value === 'mock') {
        warnings.push('Chat mode is "mock" - set to "api" for production');
      }
      return null;
    }
  }
];

console.log(`${BOLD}Checking required environment variables...${RESET}\n`);

REQUIRED_VARS.forEach(({ name, description, validate }) => {
  const value = process.env[name];
  const error = validate(value);

  if (error) {
    console.log(`${RED}✗${RESET} ${name}`);
    console.log(`  ${description}`);
    console.log(`  ${RED}Error: ${error}${RESET}\n`);
    allValid = false;
  } else {
    console.log(`${GREEN}✓${RESET} ${name}`);
    console.log(`  ${description}`);
    // Show truncated value for security
    if (value) {
      const displayValue = value.length > 30
        ? `${value.substring(0, 20)}...${value.substring(value.length - 10)}`
        : value;
      console.log(`  Value: ${displayValue}\n`);
    }
  }
});

// Show warnings
if (warnings.length > 0) {
  console.log(`\n${BOLD}${YELLOW}Warnings:${RESET}`);
  warnings.forEach(warning => {
    console.log(`${YELLOW}⚠${RESET}  ${warning}`);
  });
  console.log('');
}

// Final result
console.log('─'.repeat(60));
if (allValid) {
  console.log(`\n${GREEN}${BOLD}✓ All environment variables are configured correctly!${RESET}\n`);
  console.log('Next steps:');
  console.log('1. Set these same variables in Vercel Dashboard');
  console.log('2. Set ODDS_API_KEY and OPENAI_API_KEY as Supabase secrets');
  console.log('3. Deploy edge functions: supabase functions deploy odds-assistant');
  console.log('4. Push to trigger Vercel deployment\n');
  process.exit(0);
} else {
  console.log(`\n${RED}${BOLD}✗ Some environment variables are missing or invalid${RESET}\n`);
  console.log('Please check the errors above and update your .env.local file');
  console.log('Template available at: web/.env.template\n');
  process.exit(1);
}
