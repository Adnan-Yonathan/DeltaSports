# DeltaSports – Fully Functional PRD
## Conversational Sports Intelligence Platform

**Design Inspiration:** ChatGPT × OddsJam
**Vision:** The smartest sports betting assistant – conversational like ChatGPT, data-driven like OddsJam
**Version:** 2.0 – Fully Functional Specification
**Last Updated:** November 8, 2025

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Philosophy](#2-product-vision--philosophy)
3. [Target Users & Personas](#3-target-users--personas)
4. [Core Features (MVP)](#4-core-features-mvp)
5. [Design System](#5-design-system)
6. [User Flows & Journeys](#6-user-flows--journeys)
7. [Technical Architecture](#7-technical-architecture)
8. [Data Models](#8-data-models)
9. [API Specifications](#9-api-specifications)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Success Metrics](#11-success-metrics)

---

## 1. Executive Summary

DeltaSports transforms sports betting from guesswork into intelligent decision-making. By combining **ChatGPT's conversational elegance** with **OddsJam's data-driven betting tools**, we create a platform where users chat with an AI that understands betting context, scans real-time odds across 100+ sportsbooks, and provides actionable insights.

**What makes us different:**
- **Chat-first interface** – No overwhelming dashboards, just conversation
- **Real-time +EV detection** – Scan 1M+ odds per minute for value
- **Intelligent bankroll tracking** – AI that learns your patterns and nudges you away from tilt
- **Instant market context** – Know why lines move before placing a bet

**Core Differentiator:** We're not a dashboard with a chatbot – we're a conversational AI with betting superpowers.

---

## 2. Product Vision & Philosophy

### 2.1 Design Philosophy

**Inspired by ChatGPT:**
- Clean, distraction-free interface
- Conversational interactions feel natural
- Dark mode optimized for extended use
- Sidebar for session history and quick navigation
- Streaming responses that appear in real-time
- Mobile-first, responsive design

**Inspired by OddsJam:**
- Real-time odds comparison across 100+ sportsbooks
- Positive EV (+EV) detection and highlighting
- Professional-grade analytics and data density
- Low-latency data updates (sub-second)
- Arbitrage and value finder tools
- Sharp betting tools for serious players

**Our Unique Blend:**
- **Information architecture:** ChatGPT's simplicity + OddsJam's data richness
- **Interaction model:** Natural language queries → AI-powered insights → Actionable data
- **Visual hierarchy:** Conversational flow primary, data tables secondary (when needed)

### 2.2 User Experience Principles

1. **Conversational > Dashboard** – Default to chat, reveal data on demand
2. **Context-aware** – AI remembers bankroll, bets, preferences
3. **Proactive alerts** – Surface insights before users ask
4. **Speed matters** – Real-time odds, instant responses
5. **Build trust** – Explain every recommendation transparently

---

## 3. Target Users & Personas

### Persona 1: The Aspiring Sharp
**Name:** Marcus, 28, Marketing Manager
**Betting Experience:** 2 years, transitioning from casual to serious
**Pain Points:**
- Overwhelmed by data, doesn't know what matters
- Loses discipline after bad beats
- Unsure if he's getting best odds

**Jobs to be Done:**
- "Help me find +EV bets without doing hours of research"
- "Stop me from chasing losses"
- "Teach me to bet like a sharp"

**How DeltaSports Helps:**
- AI explains line movements in plain English
- Behavioral nudges when bankroll patterns show tilt
- +EV scanner highlights best opportunities automatically

### Persona 2: The Data-Driven Pro
**Name:** Sarah, 34, Software Engineer
**Betting Experience:** 6+ years, tracks everything in spreadsheets
**Pain Points:**
- Manually comparing odds across 8+ sportsbooks
- Misses +EV windows due to manual workflow
- Wants deeper analytics without building custom tools

**Jobs to be Done:**
- "Automate odds comparison across all books"
- "Alert me instantly when +EV exceeds 5%"
- "Track ROI by sport, market, and bet type"

**How DeltaSports Helps:**
- Real-time odds aggregation (100+ sportsbooks)
- Custom EV alerts with push notifications
- Advanced analytics with export capabilities

### Persona 3: The Recreational Player
**Name:** Jason, 41, Finance Professional
**Betting Experience:** Casual weekend bettor
**Pain Points:**
- Bets on gut feel, no system
- Doesn't track results (win/loss unclear)
- Wants to be smarter but lacks time

**Jobs to be Done:**
- "Give me quick, confident recommendations"
- "Help me understand my betting patterns"
- "Make betting more fun and less risky"

**How DeltaSports Helps:**
- Instant chat-based recommendations
- Auto-tracking with minimal input (NLP bet parsing)
- Weekly summaries showing progress

---

## 4. Core Features (MVP)

### 4.1 Command Center (Home Chat)

**Design Inspiration:** ChatGPT's main interface

**Components:**
- **Collapsible Sidebar** (left, 280px)
  - Session history (grouped by day)
  - Quick filters (Today, This Week, All)
  - New chat button (prominent)
  - Settings access (bottom)

- **Main Chat Canvas** (center, fluid)
  - Message stream (user + assistant bubbles)
  - Streaming indicator during AI responses
  - Quick prompt chips (preset queries)
  - Input composer with voice support

- **Context Panel** (right, 320px, toggleable)
  - Live bankroll summary card
  - Top 3 +EV opportunities (refreshes every 30s)
  - Recent bets (last 5)
  - Active alerts counter

**Key Interactions:**
1. User asks: "What are tonight's best NBA bets?"
2. AI streams response with:
   - Game breakdown
   - +EV picks with odds comparison table
   - Reasoning (why these picks)
   - Quick action buttons ("Log Bet", "Set Alert")

**Technical Requirements:**
- Server-Sent Events (SSE) for streaming
- LocalStorage for session persistence
- Optimistic UI updates (instant message rendering)
- Error boundary with graceful degradation

---

### 4.2 Real-Time Odds Scanner

**Design Inspiration:** OddsJam's comparison tools

**Features:**
- **Odds Aggregation**
  - Scan 100+ sportsbooks every 30 seconds
  - Display best odds per market (moneyline, spread, total)
  - Highlight discrepancies ≥ 0.5 points or 5% EV

- **Market View**
  - Sport filter tabs (NBA, NFL, MLB, NHL, Soccer)
  - Game cards with expandable markets
  - Side-by-side sportsbook comparison
  - "Best odds" badge on optimal books

- **+EV Detection**
  - Calculate expected value vs consensus lines
  - Color-coded EV tiers:
    - Green (≥5% EV) – Strong edge
    - Yellow (2-5% EV) – Moderate edge
    - Gray (<2% EV) – Neutral
  - Inline EV explanation tooltips

**UI Layout:**
```
┌─────────────────────────────────────────────────┐
│ [NBA] [NFL] [MLB] [NHL] [Soccer]       [Filter]│
├─────────────────────────────────────────────────┤
│ Lakers vs Celtics · 7:30 PM ET                 │
│ ┌─────────────┬─────────────┬─────────────┐    │
│ │ Moneyline   │ Spread      │ Total       │    │
│ ├─────────────┼─────────────┼─────────────┤    │
│ │ LAL +145    │ LAL +3.5    │ O 220.5     │    │
│ │ 🟢 +6.2% EV │ 🟡 +2.8% EV │ ⚪ +0.5% EV  │    │
│ │ FanDuel     │ DraftKings  │ BetMGM      │    │
│ └─────────────┴─────────────┴─────────────┘    │
│ [Compare Odds] [Set Alert] [Chat About This]   │
└─────────────────────────────────────────────────┘
```

**Technical Requirements:**
- WebSocket or polling for real-time updates
- Redis caching for odds data (TTL: 30s)
- Postgres for historical odds tracking
- Edge function for EV calculations

---

### 4.3 Intelligent Bankroll Tracker

**Features:**
- **Quick Bet Entry**
  - NLP parsing: "50 on Lakers ML at +145"
  - Manual form fallback
  - Auto-populate from odds scanner
  - Voice input support

- **Bankroll Dashboard**
  - Current balance (large, prominent)
  - Unit size recommendation
  - ROI by sport (pie chart)
  - Win/loss streak indicator

- **Behavioral Analytics**
  - Bet pattern detection:
    - Chasing losses (bet size ↑ after loss)
    - Tilt indicators (rapid-fire bets)
    - Overbetting (>5% bankroll per bet)
  - AI nudges: "You've bet 3x your unit size after losses. Consider taking a break."

- **Performance Metrics**
  - Total P/L (all-time, 30-day, 7-day)
  - ROI by sport, market, bet type
  - Win rate % (overall, by category)
  - Best/worst performing markets

**UI Layout:**
```
┌─────────────────────────────────────────────────┐
│ Bankroll: $2,450.00 (+12.3% ROI)               │
│ Unit Size: $50 (2%)                            │
├─────────────────────────────────────────────────┤
│ [Quick Add Bet]                                 │
│ "50 on Lakers ML +145" → [Log Bet]             │
├─────────────────────────────────────────────────┤
│ Recent Bets                                     │
│ ✅ Warriors ML +120 · Won +$60 · Yesterday     │
│ ❌ Celtics -5.5 · Lost -$55 · Yesterday        │
│ ⏳ Lakers +3.5 · Pending · Tonight             │
├─────────────────────────────────────────────────┤
│ Performance by Sport                            │
│ 🏀 NBA: +$450 (15.2% ROI) · 12-8 record       │
│ 🏈 NFL: -$120 (-4.1% ROI) · 8-10 record       │
└─────────────────────────────────────────────────┘
```

**Technical Requirements:**
- Postgres tables: `bankroll_accounts`, `bets`
- Edge function: `bankroll-metrics-sync` (on bet update)
- NLP parser using OpenAI for bet entry
- Real-time balance calculations

---

### 4.4 Edge Alert System

**Features:**
- **Custom Alert Builder**
  - Set conditions:
    - Spread movement ≥ X points
    - +EV exceeds Y%
    - Specific team/player props
    - Key number crossings (NFL 3, 7, 10)
  - Delivery methods: In-app, Push notification

- **Smart Alert Feed**
  - Chronological stream in sidebar
  - Badge counter for unread
  - Expandable cards with context
  - Quick actions: "View Odds", "Log Bet", "Dismiss"

- **Pre-Built Templates**
  - "Sharp money moves (≥0.5 pt shift)"
  - "+5% EV on NBA player props"
  - "Line crosses key number (NFL)"

**UI Layout:**
```
┌─────────────────────────────────────────────────┐
│ 🔔 Alerts (3 new)                               │
├─────────────────────────────────────────────────┤
│ 🟢 +EV Alert · 2 mins ago                      │
│ Warriors ML now +6.8% EV on FanDuel            │
│ Was +145, now +155 (line moved +10 cents)      │
│ [View Odds] [Log Bet] [Dismiss]                │
├─────────────────────────────────────────────────┤
│ 📊 Line Movement · 15 mins ago                 │
│ Lakers spread moved from +3 to +3.5            │
│ Sharp money detected on FanDuel, BetMGM        │
│ [View Details] [Dismiss]                       │
└─────────────────────────────────────────────────┘
```

**Technical Requirements:**
- Edge function: `edge-alerts-dispatch`
- Scheduled cron: `ev-scanner-refresh` (every 5 mins)
- Push notifications via Supabase Realtime
- Postgres table: `edge_alerts`

---

### 4.5 Market Intelligence

**Features:**
- **Line Movement Tracker**
  - Visual timeline of odds changes
  - Volume indicators (sharp vs public money)
  - Key event annotations (injury news, etc.)

- **Why Lines Move**
  - AI-generated explanations:
    - "Lakers spread moved +3 → +3.5 due to heavy public money on Celtics (68% of bets) but sharp action detected on Lakers"
  - Sourced from:
    - Betting percentages (Action Network API)
    - News aggregation (ESPN, Twitter)
    - Historical patterns

- **Consensus View**
  - Public betting % vs Sharp betting %
  - RLM (Reverse Line Movement) detector
  - Steam move alerts

**UI Layout:**
```
┌─────────────────────────────────────────────────┐
│ Lakers vs Celtics · Market Intelligence        │
├─────────────────────────────────────────────────┤
│ Line Movement (Last 24 hrs)                    │
│ LAL +3.5 ●━━━●━━●━━━━● +3.0 (current)         │
│         ^     ^   ^                            │
│       Open  Sharp Public                       │
│                  Money  Move                   │
├─────────────────────────────────────────────────┤
│ Why It Moved                                    │
│ "The line moved from +3.5 to +3.0 despite 68% │
│ of public bets on Celtics. Sharp bettors are  │
│ taking Lakers +3.5, indicating value. RLM     │
│ detected – consider Lakers spread."            │
├─────────────────────────────────────────────────┤
│ Public: 68% on Celtics -3.5                    │
│ Sharp: 62% on Lakers +3.5 (RLM ⚠️)            │
└─────────────────────────────────────────────────┘
```

**Technical Requirements:**
- Historical odds storage (Postgres time-series)
- Betting percentages API integration
- OpenAI for narrative generation
- Real-time data streaming

---

## 5. Design System

### 5.1 Visual Design Principles

**Inspired by ChatGPT:**
- **Minimalism:** Remove chrome, focus on content
- **Typography-first:** Readable, hierarchical text
- **Subtle animations:** Smooth transitions, no jarring movements
- **Generous whitespace:** Let content breathe

**Inspired by OddsJam:**
- **Data density:** Pack information without clutter
- **Color-coded insights:** Instant visual comprehension
- **Professional aesthetic:** Trading floor vibes
- **Quick scanning:** Eye-track optimized layouts

### 5.2 Color Palette

```css
/* Base Colors (ChatGPT-inspired dark theme) */
--bg-primary: #0f172a;      /* Deep slate background */
--bg-secondary: #1e293b;    /* Elevated surfaces */
--bg-tertiary: #334155;     /* Hover states */

--text-primary: #f1f5f9;    /* Primary text (off-white) */
--text-secondary: #94a3b8;  /* Secondary text (muted) */
--text-tertiary: #64748b;   /* Tertiary text (subtle) */

/* Accent Colors (OddsJam-inspired) */
--accent-primary: #3b82f6;  /* Primary blue (CTAs) */
--accent-success: #10b981;  /* Green (+EV, wins) */
--accent-warning: #f59e0b;  /* Yellow (moderate EV) */
--accent-danger: #ef4444;   /* Red (losses, alerts) */
--accent-neutral: #6b7280;  /* Gray (neutral data) */

/* Status Colors */
--ev-high: #10b981;         /* ≥5% EV (green) */
--ev-medium: #f59e0b;       /* 2-5% EV (yellow) */
--ev-low: #6b7280;          /* <2% EV (gray) */

/* Borders & Dividers */
--border-subtle: rgba(255, 255, 255, 0.05);
--border-medium: rgba(255, 255, 255, 0.1);
--border-strong: rgba(255, 255, 255, 0.2);
```

### 5.3 Typography

```css
/* Font Family */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px - Labels, captions */
--text-sm: 0.875rem;   /* 14px - Secondary text */
--text-base: 1rem;     /* 16px - Body text */
--text-lg: 1.125rem;   /* 18px - Emphasis */
--text-xl: 1.25rem;    /* 20px - Headings */
--text-2xl: 1.5rem;    /* 24px - Large headings */
--text-3xl: 1.875rem;  /* 30px - Page titles */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 5.4 Component Library

#### Message Bubble (Chat)
```tsx
// User Message
<div className="
  bg-accent-primary
  text-white
  rounded-2xl
  px-4 py-3
  max-w-[80%]
  ml-auto
  shadow-lg
">
  What are tonight's best NBA bets?
</div>

// Assistant Message
<div className="
  bg-bg-secondary
  text-text-primary
  rounded-2xl
  px-4 py-3
  max-w-[80%]
  border border-border-subtle
">
  Here are tonight's top +EV opportunities...
</div>
```

#### Odds Comparison Table
```tsx
<div className="
  bg-bg-secondary
  rounded-xl
  border border-border-subtle
  overflow-hidden
">
  <table className="w-full">
    <thead className="bg-bg-tertiary">
      <tr>
        <th className="text-left p-3 text-sm font-medium">Sportsbook</th>
        <th className="text-right p-3 text-sm font-medium">Odds</th>
        <th className="text-right p-3 text-sm font-medium">EV</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-t border-border-subtle hover:bg-bg-tertiary">
        <td className="p-3">FanDuel</td>
        <td className="p-3 text-right font-mono">+145</td>
        <td className="p-3 text-right text-ev-high font-semibold">+6.2%</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### Alert Card
```tsx
<div className="
  bg-bg-secondary
  rounded-xl
  border-l-4 border-accent-success
  p-4
  space-y-2
  hover:bg-bg-tertiary
  transition-colors
">
  <div className="flex items-center gap-2">
    <span className="text-ev-high text-xl">🟢</span>
    <span className="font-semibold">+EV Alert</span>
    <span className="text-text-tertiary text-sm ml-auto">2 mins ago</span>
  </div>
  <p className="text-text-secondary">
    Warriors ML now +6.8% EV on FanDuel
  </p>
  <div className="flex gap-2">
    <button className="btn-primary">View Odds</button>
    <button className="btn-secondary">Dismiss</button>
  </div>
</div>
```

### 5.5 Responsive Breakpoints

```css
/* Mobile First */
--screen-sm: 640px;   /* Small tablets */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Laptops */
--screen-xl: 1280px;  /* Desktops */
--screen-2xl: 1536px; /* Large desktops */

/* Layout Adjustments */
@media (max-width: 768px) {
  /* Stack sidebar below on mobile */
  /* Hide context panel, show as modal */
  /* Full-width chat messages */
}
```

---

## 6. User Flows & Journeys

### 6.1 First-Time User Onboarding

**Goal:** Get user to first valuable interaction within 60 seconds

**Flow:**
1. **Landing** → Simple value prop + "Start Chatting" CTA
2. **Profile Setup** (optional, skippable)
   - Favorite sports (multi-select)
   - Typical unit size ($25, $50, $100, custom)
   - Preferred odds format (American, Decimal, Fractional)
3. **Bankroll Setup** (optional, skippable)
   - Starting balance
   - Label (e.g., "Main Account")
4. **First Chat** → Pre-populated with:
   - "What are tonight's best NBA bets?"
   - "Show me +EV opportunities"
   - "Explain how this works"
5. **Aha Moment** → AI returns real odds + explanation
6. **Next Step Prompt** → "Log your first bet to track ROI"

**Success Metric:** 75% complete onboarding, 50% log first bet

---

### 6.2 Daily Active User Journey

**Scenario:** User checks DeltaSports before placing bets

**Flow:**
1. **Open App** → Auto-load last session
2. **Context Panel** shows:
   - Bankroll snapshot
   - 3 new +EV alerts (highlighted)
   - Pending bets status
3. **User Action:** Click "+EV Alert: Lakers ML +6.8%"
4. **Detail View:**
   - Odds comparison table
   - Line movement chart
   - AI explanation of edge
   - Quick action: "Log Bet"
5. **Log Bet** → NLP input: "50 on Lakers ML at +155"
6. **Confirmation** → "Bet logged. Good luck! 🍀"
7. **Post-Game** → Auto-update bet status (won/lost)
8. **Weekly Summary** → "You went 12-8 this week (+$450, 15% ROI)"

**Success Metric:** 3+ sessions per week, 5+ bets logged

---

### 6.3 Power User Journey

**Scenario:** Pro bettor uses DeltaSports for edge hunting

**Flow:**
1. **Custom Alert Setup:**
   - "Alert me when NBA player props exceed +7% EV"
   - "Notify on NFL spread moves ≥1 point"
2. **Real-Time Monitoring:**
   - WebSocket connection for live odds
   - Browser/mobile push notifications
3. **Rapid Bet Logging:**
   - Voice input: "100 on Curry over 28.5 points at -110"
   - Keyboard shortcut (Cmd+K) → Quick log
4. **Analytics Deep Dive:**
   - Export CSV of all bets
   - Filter ROI by sportsbook, time of day, bet type
5. **API Access** (future):
   - Programmatic bet logging
   - Custom dashboard integrations

**Success Metric:** 10+ bets/week, 90-day retention

---

## 7. Technical Architecture

### 7.1 System Diagram

```
┌─────────────────────────────────────────────────┐
│              Frontend (Next.js 14)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Chat UI │  │ Odds     │  │ Bankroll │     │
│  │          │  │ Scanner  │  │ Tracker  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│          API Layer (Next.js API Routes)         │
│  /api/chat       /api/odds       /api/bets     │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         Supabase Edge Functions (Deno)          │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ odds-        │  │ bankroll-    │            │
│  │ assistant    │  │ metrics-sync │            │
│  └──────────────┘  └──────────────┘            │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ edge-alerts- │  │ ev-scanner-  │            │
│  │ dispatch     │  │ refresh      │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │ Redis Cache  │
│  (Supabase)  │      │ (Upstash)    │
└──────────────┘      └──────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│        External APIs                 │
│  • The Odds API (odds data)          │
│  • OpenAI GPT-4o (AI responses)      │
│  • Action Network (betting %)        │
└──────────────────────────────────────┘
```

### 7.2 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14 (App Router) | React Server Components, excellent DX |
| **UI Framework** | React 18 + TypeScript | Type safety, component reusability |
| **Styling** | Tailwind CSS | Rapid prototyping, consistent design |
| **State Management** | React hooks + Context | Simple, no over-engineering |
| **Backend** | Supabase (BaaS) | Auth, DB, Edge Functions, Realtime |
| **Database** | PostgreSQL (Supabase) | Relational data, powerful queries |
| **Caching** | Redis (Upstash) | Low-latency odds caching |
| **AI/LLM** | OpenAI GPT-4o-mini | Fast, cost-effective, accurate |
| **Odds Data** | The Odds API | 100+ sportsbooks, low latency |
| **Hosting** | Vercel (frontend) | Auto-deploy, edge network |
| **Real-time** | Server-Sent Events (SSE) | Streaming AI responses |
| **Monitoring** | Sentry (errors) | Error tracking (no PostHog) |

### 7.3 Data Flow Examples

#### Chat Request Flow
```
1. User types: "What are tonight's best NBA bets?"
2. Frontend → POST /api/chat { message, session_id }
3. API Route → Supabase Edge Function: odds-assistant
4. Edge Function:
   a. Fetch user context (bankroll, preferences)
   b. Call The Odds API (live NBA odds)
   c. Calculate +EV for each market
   d. Generate AI response via OpenAI
   e. Stream response chunks via SSE
5. Frontend receives chunks → Update UI in real-time
6. Save conversation to Postgres
```

#### +EV Alert Flow
```
1. Cron trigger (every 5 mins) → ev-scanner-refresh
2. Edge Function:
   a. Fetch latest odds from cache
   b. Compare vs historical fair odds
   c. Calculate EV deltas
   d. Check user alert conditions
3. If condition met → edge-alerts-dispatch
4. Insert alert into edge_alerts table
5. Supabase Realtime → Broadcast to connected clients
6. Frontend shows push notification + in-app badge
```

---

## 8. Data Models

### 8.1 Core Tables

#### user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) UNIQUE,
  email TEXT,
  display_name TEXT,
  favorite_sports TEXT[], -- ['NBA', 'NFL', 'MLB']
  preferred_odds_format TEXT DEFAULT 'american', -- 'american', 'decimal', 'fractional'
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### bankroll_accounts
```sql
CREATE TABLE bankroll_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- 'Main Account', 'FanDuel Bankroll'
  currency TEXT DEFAULT 'USD',
  starting_balance NUMERIC(10, 2) NOT NULL,
  current_balance NUMERIC(10, 2) NOT NULL,
  unit_size NUMERIC(10, 2), -- Recommended unit (e.g., 2% of bankroll)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### bets
```sql
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  bankroll_id UUID REFERENCES bankroll_accounts(id) ON DELETE SET NULL,

  -- Bet Details
  event_name TEXT NOT NULL, -- 'Lakers vs Celtics'
  sport TEXT NOT NULL, -- 'NBA', 'NFL'
  market TEXT NOT NULL, -- 'moneyline', 'spread', 'total'
  bet_type TEXT, -- 'over', 'under', 'home', 'away'
  selection TEXT, -- 'Lakers ML', 'Over 220.5'

  -- Odds & Stake
  odds_american TEXT, -- '+145'
  odds_decimal NUMERIC(6, 2), -- 2.45
  wager_amount NUMERIC(10, 2) NOT NULL,
  expected_value NUMERIC(5, 2), -- 6.2 (%)

  -- Sportsbook
  sportsbook TEXT, -- 'FanDuel', 'DraftKings'

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'won', 'lost', 'push', 'void'
  settled_at TIMESTAMP WITH TIME ZONE,
  settled_payout NUMERIC(10, 2), -- Actual payout if won

  -- Metadata
  tags TEXT[], -- ['tilt', 'chase', 'sharp']
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_sport ON bets(sport);
```

#### edge_alerts
```sql
CREATE TABLE edge_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Alert Condition
  sport TEXT NOT NULL,
  market TEXT, -- 'moneyline', 'spread', 'player_props'
  trigger_condition TEXT NOT NULL, -- 'ev_exceeds_5', 'line_moves_0.5'
  threshold_value NUMERIC(6, 2), -- 5.0 (for 5% EV)

  -- Alert Details
  event_name TEXT,
  message TEXT NOT NULL, -- 'Warriors ML now +6.8% EV on FanDuel'
  ev_value NUMERIC(5, 2), -- 6.8
  odds_value TEXT, -- '+155'
  sportsbook TEXT,

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'dismissed'
  acknowledged_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_alerts_user_status ON edge_alerts(user_id, status);
CREATE INDEX idx_alerts_created_at ON edge_alerts(created_at DESC);
```

#### odds_history (time-series)
```sql
CREATE TABLE odds_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event
  sport TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_start_time TIMESTAMP WITH TIME ZONE,

  -- Market
  market TEXT NOT NULL,
  selection TEXT,

  -- Odds Snapshot
  sportsbook TEXT NOT NULL,
  odds_american TEXT,
  odds_decimal NUMERIC(6, 2),

  -- Metadata
  snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Betting Percentages (if available)
  public_bet_percentage NUMERIC(5, 2), -- 68.0 (%)
  sharp_bet_percentage NUMERIC(5, 2)
);

CREATE INDEX idx_odds_history_event ON odds_history(event_name, market);
CREATE INDEX idx_odds_history_time ON odds_history(snapshot_time DESC);
```

#### chat_sessions
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT, -- Auto-generated from first message
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_sessions_user_id ON chat_sessions(user_id, last_message_at DESC);
```

#### chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  metadata JSONB, -- Structured data (odds tables, charts)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_messages_session_id ON chat_messages(session_id, created_at);
```

---

## 9. API Specifications

### 9.1 Chat API

**Endpoint:** `POST /api/chat`

**Request:**
```json
{
  "message": "What are tonight's best NBA bets?",
  "session_id": "uuid-here",
  "user_id": "uuid-here"
}
```

**Response:** (Server-Sent Events stream)
```
data: {"type":"chunk","content":"Here are tonight's top +EV opportunities"}

data: {"type":"chunk","content":" for NBA:\n\n"}

data: {"type":"structured","data":{"type":"odds_table","games":[...]}}

data: {"type":"done"}
```

---

### 9.2 Odds API

**Endpoint:** `GET /api/odds`

**Query Params:**
- `sport` (required): `NBA`, `NFL`, etc.
- `market` (optional): `moneyline`, `spreads`, `totals`
- `min_ev` (optional): `5` (only show ≥5% EV)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "event_name": "Lakers vs Celtics",
      "event_start_time": "2025-11-08T19:30:00Z",
      "markets": {
        "moneyline": [
          {
            "selection": "Lakers",
            "best_odds": {
              "sportsbook": "FanDuel",
              "odds_american": "+145",
              "odds_decimal": 2.45,
              "ev": 6.2
            }
          }
        ]
      }
    }
  ]
}
```

---

### 9.3 Bets API

**Create Bet:** `POST /api/bets`

**Request:**
```json
{
  "user_id": "uuid",
  "bankroll_id": "uuid",
  "event_name": "Lakers vs Celtics",
  "sport": "NBA",
  "market": "moneyline",
  "selection": "Lakers ML",
  "odds_american": "+145",
  "wager_amount": 50.00,
  "sportsbook": "FanDuel",
  "expected_value": 6.2
}
```

**Response:**
```json
{
  "success": true,
  "bet_id": "uuid",
  "message": "Bet logged successfully"
}
```

---

**Update Bet Status:** `PATCH /api/bets/:id`

**Request:**
```json
{
  "status": "won",
  "settled_payout": 122.50
}
```

---

### 9.4 Alerts API

**Create Alert:** `POST /api/alerts`

**Request:**
```json
{
  "user_id": "uuid",
  "sport": "NBA",
  "market": "player_props",
  "trigger_condition": "ev_exceeds",
  "threshold_value": 7.0
}
```

---

**Get Active Alerts:** `GET /api/alerts?user_id=uuid&status=active`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "message": "Warriors ML now +6.8% EV on FanDuel",
      "ev_value": 6.8,
      "created_at": "2025-11-08T18:45:00Z",
      "status": "active"
    }
  ]
}
```

---

## 10. Implementation Roadmap

### Phase 1: MVP Core (Weeks 1-4)

**Week 1-2: Foundation**
- ✅ Set up Next.js project structure
- ✅ Implement chat UI (ChatGPT-style)
- ✅ Integrate OpenAI streaming responses
- ✅ Build sidebar navigation
- ✅ Create responsive layout (mobile-first)

**Week 3-4: Odds Integration**
- [ ] Connect The Odds API
- [ ] Build odds aggregation service
- [ ] Implement +EV calculation logic
- [ ] Create odds comparison table component
- [ ] Cache layer (Redis) for performance

**Success Criteria:**
- Users can chat and get AI responses
- Live odds displayed for NBA/NFL
- +EV highlights working

---

### Phase 2: Bankroll & Bets (Weeks 5-6)

**Week 5:**
- [ ] Build bankroll setup flow
- [ ] Implement bet logging (manual + NLP)
- [ ] Create bankroll dashboard
- [ ] ROI calculations and charts

**Week 6:**
- [ ] Behavioral analytics (tilt detection)
- [ ] AI nudges based on patterns
- [ ] Bet history view with filters
- [ ] Performance by sport/market

**Success Criteria:**
- Users can track bankroll
- Auto-calculated ROI and win rate
- Behavioral insights shown

---

### Phase 3: Alerts & Intelligence (Weeks 7-8)

**Week 7:**
- [ ] Edge alert system (backend)
- [ ] Alert builder UI
- [ ] Push notification setup
- [ ] Alert feed component

**Week 8:**
- [ ] Line movement tracker
- [ ] "Why lines move" AI explanations
- [ ] Consensus view (public vs sharp)
- [ ] RLM detection

**Success Criteria:**
- Real-time alerts working
- Line movement visualization
- Users receiving push notifications

---

### Phase 4: Polish & Launch (Weeks 9-10)

**Week 9:**
- [ ] Performance optimization
- [ ] Mobile app testing
- [ ] Onboarding flow refinement
- [ ] Error handling improvements

**Week 10:**
- [ ] Beta user testing
- [ ] Bug fixes
- [ ] Documentation
- [ ] Production deployment

**Success Criteria:**
- App loads <2s
- Zero critical bugs
- Positive beta feedback

---

## 11. Success Metrics

### 11.1 Acquisition Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Signups/week** | 100+ (beta) | Auth webhook |
| **Onboarding completion** | ≥75% | Users who reach first chat |
| **Time to first value** | <60 seconds | Timestamp: signup → first AI response |

### 11.2 Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **DAU/MAU ratio** | ≥30% | Active users tracked via sessions |
| **Sessions/user/week** | ≥3 | Session creation count |
| **Messages/session** | ≥8 | Average messages per chat |
| **Bets logged/user** | ≥5/week | Bet creation count |
| **Alert engagement** | ≥40% CTR | Alerts clicked / alerts shown |

### 11.3 Retention Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Day 1 retention** | ≥60% | Users who return next day |
| **Day 7 retention** | ≥40% | Users active 7 days post-signup |
| **Day 30 retention** | ≥25% | Users active 30 days post-signup |

### 11.4 Product Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **AI response latency** | <2s (p95) | Time to first chunk |
| **Odds data freshness** | <30s | Last update timestamp |
| **Error rate** | <1% | Sentry tracking |
| **Uptime** | ≥99.5% | Vercel monitoring |

### 11.5 Business Metrics (Future)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Paid conversion** | ≥8% | Free → Pro upgrades |
| **MRR growth** | +20% MoM | Subscription revenue |
| **Churn rate** | <5%/month | Canceled subscriptions |

---

## 12. Future Enhancements (Post-MVP)

### 12.1 Advanced Features
- **Voice input/output** – Siri/Alexa-style betting
- **Mobile apps** – Native iOS/Android
- **Smart bet sizing** – Kelly Criterion calculator
- **Parlay optimizer** – Find best correlated bets
- **Live betting assistant** – In-game odds tracking

### 12.2 Integrations
- **Sportsbook APIs** – Auto-import bets (DraftKings, FanDuel)
- **Calendar sync** – Add games to calendar
- **Apple Health** – Mood correlation tracking
- **Discord/Slack bots** – Alert forwarding

### 12.3 Monetization
- **Pro tier** ($29/mo) – Unlimited alerts, advanced analytics
- **Elite tier** ($199/mo) – API access, custom models
- **Affiliate revenue** – Sportsbook referrals

---

## Appendix A: Competitive Analysis

| Feature | DeltaSports | OddsJam | ChatGPT | Action Network |
|---------|-------------|---------|---------|----------------|
| **Chat Interface** | ✅ Primary | ❌ | ✅ Primary | ❌ |
| **Real-time Odds** | ✅ 100+ books | ✅ 100+ books | ❌ | ✅ Limited |
| **+EV Detection** | ✅ Auto | ✅ Manual scan | ❌ | ❌ |
| **Bankroll Tracking** | ✅ AI-powered | ❌ | ❌ | ✅ Basic |
| **Line Movement** | ✅ + AI explanations | ✅ | ❌ | ✅ |
| **Behavioral Insights** | ✅ Tilt detection | ❌ | ❌ | ❌ |
| **Mobile App** | 🔄 Roadmap | ✅ | ✅ | ✅ |
| **Price** | $29/mo (planned) | $49/mo | $20/mo | Free + $9.99/mo |

**Our Edge:**
1. Only platform combining conversational AI + betting tools
2. Behavioral analytics (tilt, chase detection)
3. AI-generated line movement explanations
4. Seamless chat → bet logging workflow

---

## Appendix B: Technical Considerations

### Security
- **Row Level Security (RLS)** on all user tables
- **API rate limiting** to prevent abuse
- **Input sanitization** for NLP bet parsing
- **HTTPS only**, no mixed content

### Scalability
- **Serverless architecture** (auto-scales)
- **Redis caching** reduces DB load
- **CDN for static assets** (Vercel Edge)
- **Database indexing** on high-query columns

### Performance
- **Code splitting** (Next.js dynamic imports)
- **Image optimization** (next/image)
- **SSE streaming** for instant feedback
- **Prefetching** critical odds data

### Accessibility
- **WCAG 2.1 AA compliance**
- **Keyboard navigation** for all interactions
- **Screen reader support**
- **Color contrast ratios** ≥4.5:1

---

## Conclusion

DeltaSports reimagines sports betting as a conversation, not a spreadsheet. By blending ChatGPT's intuitive interface with OddsJam's data-driven tools, we create a platform that's both powerful for pros and accessible for aspiring sharps.

**Next Steps:**
1. Review and approve this PRD
2. Begin Phase 1 implementation (Weeks 1-2)
3. Set up analytics tracking (Sentry, not PostHog)
4. Recruit beta testers from betting communities

**Questions or feedback?** Let's build the future of intelligent betting. 🚀
