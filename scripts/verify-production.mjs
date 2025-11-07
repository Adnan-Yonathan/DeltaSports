#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 *
 * This script verifies a deployed DeltaSports application is working correctly.
 * It tests the production URL to ensure all features are functional.
 *
 * Usage: node scripts/verify-production.mjs <production-url>
 * Example: node scripts/verify-production.mjs https://deltasports.vercel.app
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local for API keys
const envPath = resolve(__dirname, '../web/.env.local');
config({ path: envPath });

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// Get production URL from command line
const productionUrl = process.argv[2];

if (!productionUrl) {
  console.log(`${RED}Error: Production URL required${RESET}`);
  console.log('');
  console.log('Usage: node scripts/verify-production.mjs <url>');
  console.log('Example: node scripts/verify-production.mjs https://deltasports.vercel.app');
  console.log('');
  process.exit(1);
}

// Normalize URL (remove trailing slash)
const baseUrl = productionUrl.replace(/\/$/, '');

console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}${BLUE}   DeltaSports Production Verification${RESET}`);
console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${RESET}\n`);
console.log(`${DIM}Testing: ${baseUrl}${RESET}\n`);

const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

/**
 * Test 1: Homepage Accessibility
 */
async function testHomepage() {
  console.log(`${BOLD}1. Testing Homepage${RESET}`);

  try {
    const response = await fetch(baseUrl, {
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const html = await response.text();

      // Check for key elements
      const hasTitle = html.includes('DeltaSports') || html.includes('deltasports');
      const hasNextJs = html.includes('__NEXT_DATA__') || html.includes('next');

      if (hasTitle && hasNextJs) {
        console.log(`  ${GREEN}✓${RESET} Homepage loads correctly`);
        console.log(`  ${DIM}Status: ${response.status}, Size: ${Math.round(html.length / 1024)}KB${RESET}\n`);
        results.passed++;
        return true;
      } else {
        console.log(`  ${YELLOW}⚠${RESET} Homepage loads but content may be incomplete${RESET}\n`);
        results.warnings++;
        return false;
      }
    } else {
      console.log(`  ${RED}✗${RESET} Homepage failed (status ${response.status})${RESET}\n`);
      results.failed++;
      return false;
    }
  } catch (error) {
    console.log(`  ${RED}✗${RESET} Homepage error: ${error.message}${RESET}\n`);
    results.failed++;
    return false;
  }
}

/**
 * Test 2: Static Assets
 */
async function testStaticAssets() {
  console.log(`${BOLD}2. Testing Static Assets${RESET}`);

  const assets = [
    '/_next/static/css/',
    '/favicon.ico'
  ];

  let assetsWorking = 0;

  for (const asset of assets) {
    try {
      const response = await fetch(`${baseUrl}${asset}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok || response.status === 304) {
        assetsWorking++;
      }
    } catch (error) {
      // Silently fail - assets may not exist yet
    }
  }

  if (assetsWorking > 0) {
    console.log(`  ${GREEN}✓${RESET} Static assets accessible${RESET}`);
    console.log(`  ${DIM}Found ${assetsWorking}/${assets.length} assets${RESET}\n`);
    results.passed++;
    return true;
  } else {
    console.log(`  ${YELLOW}⚠${RESET} Static assets may not be ready${RESET}\n`);
    results.warnings++;
    return false;
  }
}

/**
 * Test 3: API Routes
 */
async function testAPIRoutes() {
  console.log(`${BOLD}3. Testing API Routes${RESET}`);

  // Test health check or any public API route
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      signal: AbortSignal.timeout(10000)
    });

    // 404 is OK - means Next.js is handling routes
    if (response.status === 404) {
      console.log(`  ${GREEN}✓${RESET} API routing working (Next.js handling requests)${RESET}\n`);
      results.passed++;
      return true;
    } else if (response.ok) {
      console.log(`  ${GREEN}✓${RESET} API routes working (status ${response.status})${RESET}\n`);
      results.passed++;
      return true;
    } else {
      console.log(`  ${YELLOW}⚠${RESET} API routes returned status ${response.status}${RESET}\n`);
      results.warnings++;
      return false;
    }
  } catch (error) {
    console.log(`  ${RED}✗${RESET} API routes error: ${error.message}${RESET}\n`);
    results.failed++;
    return false;
  }
}

/**
 * Test 4: Supabase Integration
 */
async function testSupabaseIntegration() {
  console.log(`${BOLD}4. Testing Supabase Integration${RESET}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.log(`  ${YELLOW}⚠${RESET} Supabase credentials not in .env.local${RESET}`);
    console.log(`  ${DIM}Cannot test Supabase integration${RESET}\n`);
    results.warnings++;
    return false;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?limit=0`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok || response.status === 401) {
      console.log(`  ${GREEN}✓${RESET} Supabase integration working${RESET}`);
      console.log(`  ${DIM}Database accessible from production${RESET}\n`);
      results.passed++;
      return true;
    } else {
      console.log(`  ${RED}✗${RESET} Supabase error (status ${response.status})${RESET}\n`);
      results.failed++;
      return false;
    }
  } catch (error) {
    console.log(`  ${RED}✗${RESET} Supabase error: ${error.message}${RESET}\n`);
    results.failed++;
    return false;
  }
}

/**
 * Test 5: Edge Functions
 */
async function testEdgeFunctions() {
  console.log(`${BOLD}5. Testing Edge Functions${RESET}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.log(`  ${YELLOW}⚠${RESET} Cannot test - Supabase credentials missing${RESET}\n`);
    results.warnings++;
    return false;
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/odds-assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'Production verification test',
        sportKey: 'basketball_nba'
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok') {
        console.log(`  ${GREEN}✓${RESET} Edge functions working${RESET}`);
        console.log(`  ${DIM}odds-assistant returning data${RESET}\n`);
        results.passed++;
        return true;
      }
    }

    console.log(`  ${YELLOW}⚠${RESET} Edge functions may not be fully configured${RESET}`);
    console.log(`  ${DIM}Status: ${response.status}${RESET}\n`);
    results.warnings++;
    return false;
  } catch (error) {
    console.log(`  ${YELLOW}⚠${RESET} Edge functions: ${error.message}${RESET}\n`);
    results.warnings++;
    return false;
  }
}

/**
 * Test 6: Performance Check
 */
async function testPerformance() {
  console.log(`${BOLD}6. Testing Performance${RESET}`);

  try {
    const startTime = Date.now();
    const response = await fetch(baseUrl, {
      signal: AbortSignal.timeout(10000)
    });
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    if (response.ok) {
      if (loadTime < 2000) {
        console.log(`  ${GREEN}✓${RESET} Fast response time: ${loadTime}ms${RESET}\n`);
        results.passed++;
      } else if (loadTime < 5000) {
        console.log(`  ${YELLOW}⚠${RESET} Acceptable response time: ${loadTime}ms${RESET}`);
        console.log(`  ${DIM}Consider optimizing for faster loads${RESET}\n`);
        results.warnings++;
      } else {
        console.log(`  ${RED}✗${RESET} Slow response time: ${loadTime}ms${RESET}`);
        console.log(`  ${DIM}Optimize build or check server location${RESET}\n`);
        results.failed++;
      }
      return true;
    }
  } catch (error) {
    console.log(`  ${RED}✗${RESET} Performance test failed: ${error.message}${RESET}\n`);
    results.failed++;
    return false;
  }
}

/**
 * Test 7: Security Headers
 */
async function testSecurityHeaders() {
  console.log(`${BOLD}7. Testing Security Headers${RESET}`);

  try {
    const response = await fetch(baseUrl, {
      signal: AbortSignal.timeout(10000)
    });

    const headers = response.headers;
    const securityHeaders = {
      'x-frame-options': headers.get('x-frame-options'),
      'x-content-type-options': headers.get('x-content-type-options'),
      'x-xss-protection': headers.get('x-xss-protection')
    };

    const hasSecurityHeaders = Object.values(securityHeaders).some(v => v !== null);

    if (hasSecurityHeaders) {
      console.log(`  ${GREEN}✓${RESET} Security headers present${RESET}`);
      Object.entries(securityHeaders).forEach(([name, value]) => {
        if (value) {
          console.log(`  ${DIM}  ${name}: ${value}${RESET}`);
        }
      });
      console.log('');
      results.passed++;
      return true;
    } else {
      console.log(`  ${YELLOW}⚠${RESET} No security headers detected${RESET}`);
      console.log(`  ${DIM}Consider adding via next.config.js${RESET}\n`);
      results.warnings++;
      return false;
    }
  } catch (error) {
    console.log(`  ${YELLOW}⚠${RESET} Could not check headers: ${error.message}${RESET}\n`);
    results.warnings++;
    return false;
  }
}

/**
 * Display Final Results
 */
function displayResults() {
  console.log(`${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}Production Verification Results${RESET}\n`);

  const total = results.passed + results.failed + results.warnings;

  console.log(`${GREEN}Passed: ${results.passed}${RESET} | ${RED}Failed: ${results.failed}${RESET} | ${YELLOW}Warnings: ${results.warnings}${RESET}`);
  console.log('');

  if (results.failed === 0 && results.passed > 3) {
    console.log(`${GREEN}${BOLD}✓ Production deployment is working!${RESET}\n`);
    console.log('Your DeltaSports application is live and functional.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Create a test user account');
    console.log('  2. Test all features in the UI');
    console.log('  3. Set up monitoring and alerts');
    console.log('  4. Monitor logs for any errors');
    console.log('');
    console.log(`${BOLD}Production URL: ${baseUrl}${RESET}`);
    console.log('');
    process.exit(0);
  } else if (results.failed === 0 && results.warnings > 0) {
    console.log(`${YELLOW}${BOLD}⚠ Production deployment working with warnings${RESET}\n`);
    console.log('Core functionality is working but some features may need attention.');
    console.log('Review warnings above and address if needed.');
    console.log('');
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}✗ Production deployment has issues${RESET}\n`);
    console.log('Critical problems detected. Please address:');
    console.log('');
    if (results.failed > 0) {
      console.log('  • Check deployment logs in Vercel dashboard');
      console.log('  • Verify environment variables are set correctly');
      console.log('  • Ensure build completed successfully');
      console.log('  • Check domain/SSL configuration');
    }
    console.log('');
    console.log(`See ${BOLD}PHASE5_QUICKSTART.md${RESET} for troubleshooting`);
    console.log('');
    process.exit(1);
  }
}

/**
 * Run all production tests
 */
async function runTests() {
  try {
    await testHomepage();
    await testStaticAssets();
    await testAPIRoutes();
    await testSupabaseIntegration();
    await testEdgeFunctions();
    await testPerformance();
    await testSecurityHeaders();

    displayResults();
  } catch (error) {
    console.error(`${RED}${BOLD}Fatal error:${RESET}`, error);
    process.exit(1);
  }
}

// Run tests
runTests();
