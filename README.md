# DeltaSports - Intelligent Sports Betting Platform

**DeltaSports** is a comprehensive sports betting intelligence platform that combines real-time odds data, AI-powered analysis, and advanced bankroll management to help sports bettors make informed decisions.

> Conversational sports intelligence platform. Everything from the best odds on a bet to advanced stats giving you an edge.

---

## 🎯 Key Features

### 📊 Real-Time Odds Scanner
- Live odds from multiple sportsbooks (DraftKings, FanDuel, BetMGM)
- Market-based Expected Value (EV) calculations
- Consensus probability analysis
- Multiple market types (Moneyline, Spreads, Totals)

### 🤖 AI-Powered Chat Assistant
- Natural language betting queries
- GPT-4 powered analysis and insights
- Contextual recommendations based on user history
- Multiple tone preferences (Neutral, Confident, Cautious)

### 💰 Bankroll Management
- Multi-account bankroll tracking
- Bet logging with automatic settlement
- Performance analytics and ROI tracking
- Behavioral insights and pattern detection

### 📈 Advanced Analytics
- Win rate and ROI calculations
- Behavioral analytics with tagging
- Market intelligence and edge detection
- Accountability reporting system

### 🔐 Secure User Management
- Supabase authentication (email/password + magic links)
- Row Level Security (RLS) for data isolation
- User profiles with preferences
- Chat history persistence

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React 18** - UI library

### Backend
- **Supabase** - PostgreSQL database, authentication, edge functions
- **Deno** - Edge function runtime
- **OpenAI API** - GPT-4 powered analysis
- **The Odds API** - Real-time sports odds data

### Infrastructure
- **Vercel** - Frontend hosting and deployment
- **PostgreSQL** - Primary database (via Supabase)
- **Supabase Edge Functions** - Serverless API endpoints

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Vercel account ([vercel.com](https://vercel.com)) (for deployment)
- The Odds API key ([the-odds-api.com](https://the-odds-api.com)) (free tier: 500 req/month)
- OpenAI API key ([platform.openai.com](https://platform.openai.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/Adnan-Yonathan/DeltaSports.git
cd DeltaSports

# Install dependencies
cd web
npm install

# Copy environment template
cp .env.template .env.local

# Fill in your API keys in .env.local
# (See ENVIRONMENT_SETUP.md for details)
```

### Deployment

Follow our **automated deployment process** in 5 phases (~2 hours total):

#### **Phase 1: Database Setup** (30-45 min)
Deploy database schema and security policies:
```sql
-- In Supabase SQL Editor:
-- 1. Run: supabase/01-schema.sql
-- 2. Run: supabase/02-rls-policies.sql
```

#### **Phase 2: Environment Configuration** (20-30 min)
Automated environment setup:
```bash
cd web

# Configure and validate
cp .env.template .env.local
# Edit .env.local with your API keys
npm run check-config

# Setup Supabase secrets (automated)
npm run setup-supabase
```
See [PHASE2_QUICKSTART.md](PHASE2_QUICKSTART.md) for detailed guide.

#### **Phase 3: Edge Functions** (15-20 min)
Automated deployment and testing:
```bash
# Deploy all edge functions
npm run deploy-functions

# Test deployment
npm run test-all
```
See [PHASE3_QUICKSTART.md](PHASE3_QUICKSTART.md) for detailed guide.

#### **Phase 4: Documentation & Verification** (5-10 min)
Comprehensive deployment verification:
```bash
# Verify complete deployment
npm run verify-deployment
```

#### **Phase 5: Production Deployment** (20-30 min)
Deploy to Vercel:
```bash
# Prepare for production
npm run prepare-vercel

# Deploy (from web directory)
vercel --prod

# Verify production
npm run verify-production https://your-url.vercel.app
```
See [PHASE5_QUICKSTART.md](PHASE5_QUICKSTART.md) for detailed guide.

### Complete Documentation

- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Complete step-by-step deployment (all phases)
- **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)** - System overview and architecture
- **[ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)** - Detailed environment configuration guide
- **[PHASE2_QUICKSTART.md](PHASE2_QUICKSTART.md)** - 30-minute environment setup
- **[PHASE3_QUICKSTART.md](PHASE3_QUICKSTART.md)** - 15-minute edge function deployment
- **[PHASE5_QUICKSTART.md](PHASE5_QUICKSTART.md)** - 20-minute production deployment
- **[Product Requirements](docs/PRD.md)** - Product specifications
- **[Design Kickoff](docs/design/kickoff.md)** - Design documentation
- **[Edge Functions](supabase/functions/README.md)** - Edge functions workspace guide

---

## 🛠️ Development

### Local Development

```bash
# From repository root
cd web

# Start development server
npm run dev

# Open http://localhost:3000
```

### Available Scripts

```bash
# Configuration & Testing
npm run verify-env           # Validate environment variables
npm run test-api-keys        # Test external API connectivity
npm run check-config         # Run all config checks

# Supabase
npm run setup-supabase       # Automated Supabase setup
npm run deploy-functions     # Deploy edge functions

# Testing
npm run test-functions       # Test edge functions
npm run test-integration     # Run integration tests
npm run verify-deployment    # Comprehensive deployment verification
npm run test-all            # Complete test suite

# Production Deployment
npm run prepare-vercel       # Prepare for Vercel deployment
npm run verify-production    # Verify production deployment (requires URL)

# Build & Deploy
npm run build               # Build for production
npm run lint                # Run ESLint
```

---

## 🔧 Environment Configuration

### Required Environment Variables

Set these in `web/.env.local` for local development and in Vercel for production:

| Variable | Location | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Public anon key for browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Service role key (keep secret!) |
| `ODDS_API_KEY` | Server + Edge | The Odds API key |
| `OPENAI_API_KEY` | Server + Edge | OpenAI API key |
| `NEXT_PUBLIC_CHAT_MODE` | Client | `api` (live) or `mock` (simulator) |

### Quick Setup

```bash
# 1. Copy template
cd web
cp .env.template .env.local

# 2. Fill in your API keys in .env.local

# 3. Validate
npm run verify-env

# 4. Test connectivity
npm run test-api-keys

# 5. Setup Supabase secrets
npm run setup-supabase
```

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for complete instructions.

---

## 📊 Database Schema

### Core Tables (11 total)

- **`user_profiles`** - User settings and preferences
- **`chat_sessions`** / **`chat_messages`** - Chat history persistence
- **`bankroll_accounts`** - Bankroll tracking
- **`bets`** / **`bet_tags`** - Bet logging and behavioral tagging
- **`edge_alerts`** / **`alert_events`** - Market intelligence and notifications
- **`creator_profiles`** / **`creator_posts`** / **`creator_subscriptions`** - Creator network

### Security

All tables use **Row Level Security (RLS)** to ensure users can only access their own data. Service role bypasses RLS for edge function operations.

Schema files:
- [01-schema.sql](supabase/01-schema.sql) - Complete database schema
- [02-rls-policies.sql](supabase/02-rls-policies.sql) - Security policies
- [sql-prompts.md](supabase/sql-prompts.md) - Schema documentation

---

## 🧪 Testing

### Automated Test Suite

```bash
# Run complete test suite (~2 minutes)
npm run test-all
```

This runs:
1. ✅ Environment validation
2. ✅ API key connectivity testing
3. ✅ Edge function testing
4. ✅ Full-stack integration testing

### Individual Tests

```bash
# Test configuration
npm run check-config

# Test edge functions
npm run test-functions

# Test full integration
npm run test-integration
```

### Manual Testing

```bash
# Test odds-assistant edge function
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/odds-assistant" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"Get NBA odds","sportKey":"basketball_nba"}'
```

---

## 🚀 Deployment to Vercel

### Automatic Deployment

```bash
# Push to your branch
git push origin your-branch

# Vercel automatically detects and deploys
```

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod
```

### Environment Variables

Configure in Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add all 6 required variables
3. Select all environments (Production, Preview, Development)
4. Trigger redeploy

---

## 💰 Cost Breakdown

### Development/Testing (~$1-2/month)

| Service | Plan | Cost |
|---------|------|------|
| **Supabase** | Free Tier | $0 |
| **Vercel** | Hobby | $0 |
| **The Odds API** | Free (500 req/mo) | $0 |
| **OpenAI API** | Pay-as-you-go | $1-2 |
| **Total** | | **~$1-2/month** |

### Production with Higher Usage

| Service | Plan | Cost |
|---------|------|------|
| **Supabase** | Pro | $0-25 |
| **Vercel** | Hobby/Pro | $0-20 |
| **The Odds API** | Paid tiers | $10-50 |
| **OpenAI API** | Pay-as-you-go | $5-20 |
| **Total** | | **~$15-115/month** |

---

## 📁 Project Structure

```
DeltaSports/
├── web/                          # Next.js application
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── (app)/           # Authenticated routes
│   │   │   │   ├── analytics/   # Analytics dashboard
│   │   │   │   ├── bankroll/    # Bankroll management
│   │   │   │   ├── dashboard/   # Main dashboard
│   │   │   │   ├── odds-scanner/# Real-time odds scanner
│   │   │   │   ├── profile/     # User profile
│   │   │   │   └── reports/     # Performance reports
│   │   │   ├── api/             # API routes
│   │   │   │   └── chat/        # Chat API endpoint
│   │   │   ├── sign-in/         # Authentication pages
│   │   │   └── sign-up/
│   │   ├── components/          # React components
│   │   │   ├── auth/            # Authentication
│   │   │   ├── bankroll/        # Bankroll components
│   │   │   ├── chat/            # Chat interface
│   │   │   ├── dashboard/       # Dashboard widgets
│   │   │   ├── insights/        # Analytics widgets
│   │   │   └── odds/            # Odds components
│   │   └── lib/                 # Utilities
│   │       ├── chat/            # Chat logic
│   │       ├── odds.ts          # Odds calculations
│   │       └── supabaseClient.ts # Supabase client
│   ├── .env.template            # Environment template
│   └── package.json             # Dependencies & scripts
├── supabase/                    # Supabase configuration
│   ├── functions/               # Edge functions (Deno)
│   │   ├── odds-assistant/      # Main AI assistant
│   │   ├── on-auth-profile/     # User profile creation
│   │   ├── bankroll-metrics-sync/
│   │   ├── edge-alerts-dispatch/
│   │   ├── creator-feed-publish/
│   │   └── shared/              # Shared types & utilities
│   ├── 01-schema.sql            # Database schema
│   ├── 02-rls-policies.sql      # Security policies
│   └── sql-prompts.md           # Schema documentation
├── scripts/                     # Automation scripts
│   ├── verify-env.mjs           # Environment validation
│   ├── test-api-keys.mjs        # API connectivity tests
│   ├── setup-supabase.sh        # Supabase automated setup
│   ├── deploy-functions.sh      # Function deployment
│   ├── test-functions.mjs       # Function testing
│   ├── test-integration.mjs     # Integration tests
│   └── README.md                # Scripts documentation
├── docs/                        # Product documentation
│   ├── PRD.md                   # Product requirements
│   └── design/                  # Design docs
├── DEPLOYMENT_CHECKLIST.md      # Complete deployment guide
├── ENVIRONMENT_SETUP.md         # Environment configuration
├── PHASE2_QUICKSTART.md         # Phase 2 quick start (20 min)
├── PHASE3_QUICKSTART.md         # Phase 3 quick start (15 min)
├── vercel.json                  # Vercel configuration
└── README.md                    # This file
```

---

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Check TypeScript errors
npm run lint

# Verify environment
npm run verify-env
```

#### API Connection Issues
```bash
# Test API keys
npm run test-api-keys

# Check edge function logs
supabase functions logs odds-assistant
```

#### Database Issues
```bash
# Run integration tests
npm run test-integration

# Check if tables exist in Supabase Dashboard
```

#### "Required API keys are missing"
```bash
# Check Supabase secrets
supabase secrets list

# Re-set if needed
supabase secrets set ODDS_API_KEY=your_key
supabase secrets set OPENAI_API_KEY=your_key

# Redeploy functions
npm run deploy-functions
```

### Detailed Troubleshooting Guides

- [ENVIRONMENT_SETUP.md - Troubleshooting](ENVIRONMENT_SETUP.md#troubleshooting)
- [PHASE2_QUICKSTART.md - Common Issues](PHASE2_QUICKSTART.md#common-issues--fixes)
- [PHASE3_QUICKSTART.md - Common Issues](PHASE3_QUICKSTART.md#common-issues--fixes)

---

## 🔒 Security

### Authentication
- Supabase Auth with email/password and magic links
- JWT-based session management
- Secure password hashing (bcrypt)

### Data Protection
- Row Level Security (RLS) on all tables
- Service role key never exposed to client
- Environment variables properly secured
- HTTPS/TLS encryption everywhere

### API Security
- Rate limiting on edge functions
- Input validation and sanitization
- Error messages don't leak sensitive data
- API keys stored as secrets

---

## 📖 Documentation Index

### Quick Start Guides (< 30 min each)
- [Phase 2 Quick Start](PHASE2_QUICKSTART.md) - Environment setup
- [Phase 3 Quick Start](PHASE3_QUICKSTART.md) - Edge function deployment

### Comprehensive Guides
- [Complete Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Full step-by-step (all phases)
- [Environment Setup Guide](ENVIRONMENT_SETUP.md) - Detailed API configuration

### Technical Documentation
- [Database Schema](supabase/01-schema.sql) - PostgreSQL schema
- [RLS Policies](supabase/02-rls-policies.sql) - Security policies
- [SQL Prompts](supabase/sql-prompts.md) - Schema documentation
- [Edge Functions](supabase/functions/README.md) - Edge functions workspace
- [Scripts Documentation](scripts/README.md) - All automation scripts

### Product Documentation
- [Product Requirements](docs/PRD.md) - Product specifications
- [Design Kickoff](docs/design/kickoff.md) - Design documentation

---

## 🎓 Operations Checklist

### Initial Setup
1. ✅ Clone repository and install dependencies
2. ✅ Configure `.env.local` with all API keys
3. ✅ Run `npm run check-config` to validate
4. ✅ Deploy database schema via Supabase SQL Editor
5. ✅ Run `npm run setup-supabase` for automated setup
6. ✅ Run `npm run deploy-functions` to deploy edge functions
7. ✅ Run `npm run test-all` to verify everything works
8. ✅ Configure Vercel environment variables
9. ✅ Deploy to Vercel
10. ✅ Test in production

### Maintenance
- Monitor API usage (Odds API dashboard, OpenAI usage)
- Check edge function logs regularly
- Rotate API keys periodically
- Update dependencies monthly
- Monitor Vercel deployment logs
- Review user feedback and errors

### Key Rotation
When rotating Supabase or external API keys:
1. Update `.env.local` for local development
2. Update Vercel environment variables
3. Update Supabase secrets: `supabase secrets set KEY=value`
4. Redeploy edge functions: `npm run deploy-functions`
5. Trigger Vercel redeploy

---

## 🗺️ Roadmap

### Completed ✅
- ✅ Real-time odds scanner with EV calculations
- ✅ AI-powered chat assistant with GPT-4
- ✅ Comprehensive bankroll management
- ✅ Bet logging and performance tracking
- ✅ User authentication with profiles
- ✅ Advanced analytics and behavioral insights
- ✅ Market intelligence and edge detection
- ✅ Complete deployment automation
- ✅ Comprehensive testing suite

### In Progress 🚧
- Mobile responsive improvements
- Advanced filtering and search
- Performance optimizations

### Planned 🎯
- Push notifications for edge alerts
- Historical odds data analysis
- Social features and bet sharing
- Integration with more sportsbooks
- Advanced ML models for predictions
- Mobile app (iOS/Android)

---

## 🤝 Contributing

This is a private project. If you have access and want to contribute:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly: `npm run test-all`
4. Commit with clear, descriptive messages
5. Push and create a pull request

---

## 📜 License

Private project. All rights reserved.

---

## 🙏 Acknowledgments

### Technologies
- [Next.js](https://nextjs.org/) by Vercel
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [OpenAI](https://openai.com/) - GPT-4 API
- [The Odds API](https://the-odds-api.com/) - Real-time sports odds
- [Vercel](https://vercel.com/) - Hosting and deployment
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) - Type safety

### Methodologies
- Market-based EV calculation principles
- Bankroll management best practices
- Responsible gambling frameworks

---

## 📞 Support

For issues or questions:
1. Check [troubleshooting section](#-troubleshooting)
2. Review [comprehensive documentation](#-documentation-index)
3. Check deployment logs (Vercel + Supabase dashboards)
4. Verify environment configuration: `npm run check-config`
5. Test integration: `npm run test-all`

---

**Built with ❤️ for intelligent, responsible sports betting**

*DeltaSports - Where data meets decision-making*
