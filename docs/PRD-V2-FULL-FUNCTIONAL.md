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

## 8. Supabase Database Schema

This section contains the complete SQL schema for DeltaSports. Execute these statements in the Supabase SQL Editor in order.

### 8.1 Enable Extensions

```sql
-- Ensures UUID generation helpers are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 8.2 Domain & Enum Types

```sql
-- Normalized currency code type (ISO-4217)
CREATE DOMAIN currency_code AS TEXT
  CHECK (value ~ '^[A-Z]{3}$');

-- Track bet outcomes
CREATE TYPE bet_status AS ENUM ('pending', 'won', 'lost', 'push', 'void');

-- Identify how an alert was generated
CREATE TYPE alert_origin AS ENUM ('model', 'manual');
```

**Note:** Removed `'creator'` from `alert_origin` enum as creator feed is not included.

### 8.3 Core Tables

#### user_profiles

Links authenticated users to betting preferences and settings.

```sql
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  preferred_timezone TEXT DEFAULT 'UTC',
  favorite_sports TEXT[] DEFAULT ARRAY[]::TEXT[],
  bankroll_goal NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(auth_user_id)
);
```

**Key Fields:**
- `auth_user_id` - Links to Supabase Auth users table
- `favorite_sports` - Array of sport preferences (e.g., `['NBA', 'NFL']`)
- `bankroll_goal` - Optional target bankroll amount
- `preferred_timezone` - For displaying times in user's local timezone

---

#### bankroll_accounts

Track multiple bankroll accounts a bettor manages.

```sql
CREATE TABLE IF NOT EXISTS public.bankroll_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  currency currency_code NOT NULL DEFAULT 'USD',
  starting_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Key Fields:**
- `label` - User-friendly name (e.g., "Main Account", "FanDuel Bankroll")
- `currency` - ISO-4217 currency code (constrained by domain type)
- `starting_balance` - Initial balance when account created
- `current_balance` - Updated automatically by `bankroll-metrics-sync` edge function

---

#### bets

Individual bets tied to bankrolls with full outcome tracking.

```sql
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  bankroll_id UUID REFERENCES public.bankroll_accounts (id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  market TEXT NOT NULL,
  wager_amount NUMERIC(12,2) NOT NULL,
  american_odds INTEGER,
  decimal_odds NUMERIC(8,4),
  expected_value NUMERIC(8,4),
  status bet_status NOT NULL DEFAULT 'pending',
  settled_payout NUMERIC(12,2),
  notes TEXT,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Key Fields:**
- `event_name` - Human-readable event (e.g., "Lakers vs Celtics")
- `market` - Bet type (e.g., "moneyline", "spread", "total")
- `american_odds` - American format odds (e.g., -110, +145)
- `decimal_odds` - Decimal format odds (e.g., 1.91, 2.45)
- `expected_value` - +EV percentage if calculated
- `status` - Enum type for bet outcome
- `placed_at` - When bet was placed (distinct from `created_at`)

---

#### bet_tags

Optional tags that drive behavioral insights (tilt detection, pattern analysis).

```sql
CREATE TABLE IF NOT EXISTS public.bet_tags (
  bet_id UUID REFERENCES public.bets (id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  tagged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bet_id, tag)
);
```

**Common Tags:**
- `tilt` - Bet placed during emotional state
- `chase` - Bet placed to recover losses
- `sharp` - Well-researched, high-confidence bet
- `line_shopper` - Best odds secured across books

---

#### edge_alerts

Alerts emitted from value models when EV thresholds are crossed.

```sql
CREATE TABLE IF NOT EXISTS public.edge_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  origin alert_origin NOT NULL DEFAULT 'model',
  source_handle TEXT,
  market TEXT NOT NULL,
  sportsbook TEXT,
  edge_value NUMERIC(8,4) NOT NULL,
  trigger_threshold NUMERIC(8,4),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Key Fields:**
- `origin` - How alert was generated (`model` or `manual`)
- `edge_value` - Expected value percentage (e.g., 0.068 = 6.8% EV)
- `trigger_threshold` - Minimum EV that triggered alert
- `message` - Human-readable alert text
- `status` - Alert lifecycle (`active`, `acknowledged`, `dismissed`)

---

#### alert_events

Immutable log of alert consumption for accountability reports.

```sql
CREATE TABLE IF NOT EXISTS public.alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.edge_alerts (id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Common Actions:**
- `dispatched` - Alert created and sent
- `acknowledged` - User viewed alert
- `dismissed` - User dismissed without action
- `tailed` - User placed bet based on alert

---

### 8.4 Chat Tables

#### chat_sessions

```sql
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  title TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_user_id ON chat_sessions(user_id, last_message_at DESC);
```

#### chat_messages

```sql
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions (id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  metadata JSONB, -- Structured data (odds tables, charts)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_session_id ON chat_messages(session_id, created_at);
```

---

### 8.5 Utility Functions & Triggers

Keep `updated_at` columns current without manual writes.

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER user_profiles_updated
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER bankroll_accounts_updated
BEFORE UPDATE ON public.bankroll_accounts
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER bets_updated
BEFORE UPDATE ON public.bets
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
```

---

### 8.6 Row Level Security (RLS)

After running schema prompts, configure RLS policies to restrict reads/writes to the owning user.

**Example RLS Policy for `user_profiles`:**
```sql
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = auth_user_id);
```

**Apply similar policies to:**
- `bankroll_accounts` (users own their bankrolls)
- `bets` (users own their bets)
- `edge_alerts` (users see their own alerts)
- `chat_sessions` and `chat_messages`

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

## 9.5 Supabase Edge Functions

Edge functions provide the real-time glue for bankroll analytics, edge alerts, and conversational summaries. Each function is deployed to Supabase's Deno runtime and can be triggered via HTTP, database webhooks, or cron schedules.

### Environment Variables

All functions rely on Supabase service role configuration plus feature-specific variables:

| Variable | Description | Required By |
|----------|-------------|-------------|
| `SUPABASE_URL` | Project REST endpoint | All functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for privileged operations | All functions |
| `ODDS_API_KEY` | The Odds API key | `odds-assistant` |
| `OPENAI_API_KEY` | OpenAI API key for chat completions | `odds-assistant` |
| `ODDS_FEED_URLS` | Comma-separated odds feed URLs | `ev-scanner-refresh` |
| `EV_MIN_THRESHOLD` | Minimum EV% for alerts (e.g., `3`) | `ev-scanner-refresh` |

---

### 9.5.1 odds-assistant

**Purpose:** Conversational helper that blends The Odds API snapshots with bettor context before asking OpenAI for a summary.

**Trigger:** HTTP POST from `/api/chat` route

**Request Payload:**
```json
{
  "query": "Any value angles on tonight's Lakers game?",
  "sportKey": "basketball_nba",
  "regions": "us,us2",
  "markets": "h2h,spreads,totals",
  "bookmakers": "draftkings,fanduel,betmgm",
  "userProfileId": "00000000-0000-4000-8000-000000000000"
}
```

**Parameters:**
- `query` (required) - User's natural language question
- `sportKey` (optional) - Sport key from [The Odds API](https://the-odds-api.com/liveapi/guides/v4/#operation/get_sports)
- `regions`, `markets`, `bookmakers` (optional) - Filters for odds API
- `userProfileId` (optional) - Loads user context (profile, bankroll, recent bets)
- `model` (optional) - Override default `gpt-4o-mini`

**Response:**
```json
{
  "status": "ok",
  "odds_snapshot": {
    "sportKey": "basketball_nba",
    "fetchedAt": "2024-04-26T18:03:52.044Z",
    "filters": {
      "regions": "us,us2",
      "markets": "h2h,spreads,totals",
      "bookmakers": "draftkings,fanduel,betmgm",
      "oddsFormat": "american"
    },
    "events": [
      {
        "id": "example-event-id",
        "sportKey": "basketball_nba",
        "sportTitle": "NBA",
        "commenceTime": "2024-04-27T00:00:00Z",
        "homeTeam": "Los Angeles Lakers",
        "awayTeam": "Denver Nuggets",
        "bookmakers": [
          {
            "key": "draftkings",
            "title": "DraftKings",
            "lastUpdate": "2024-04-26T17:59:13Z",
            "markets": [
              {
                "key": "spreads",
                "lastUpdate": "2024-04-26T17:59:13Z",
                "outcomes": [
                  { "name": "Los Angeles Lakers", "price": -110, "point": -4.5 },
                  { "name": "Denver Nuggets", "price": -110, "point": 4.5 }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "model_summary": "DraftKings and FanDuel are aligned at Lakers -4.5 (-110). Your bankroll is concentrated on NBA sides, so scale entry modestly unless you have an injury angle."
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Failed to fetch odds",
  "details": { ... }
}
```

---

### 9.5.2 bankroll-metrics-sync

**Purpose:** Calculates bankroll aggregates, ROI snapshots, and behavioral tag summaries whenever a bet is inserted or updated.

**Trigger:** Database webhook on `public.bets` table (INSERT/UPDATE events)

**Deployment:**
```bash
supabase functions deploy bankroll-metrics-sync --env-file ../.env
supabase functions trigger new --function bankroll-metrics-sync \
  --table public.bets --event-type INSERT --event-type UPDATE
```

**Webhook Payload:**
```json
{
  "type": "INSERT",
  "table": "bets",
  "record": {
    "id": "2f1...",
    "user_id": "83d...",
    "bankroll_id": "50e...",
    "wager_amount": 250,
    "status": "pending"
  }
}
```

**Response:**
```json
{
  "status": "ok",
  "metrics": {
    "totalBets": 42,
    "activeBets": 11,
    "settledBets": 31,
    "winRate": 0.58,
    "roi30d": 0.17,
    "bankrolls": [
      {
        "id": "50e...",
        "label": "MLB Futures",
        "currency": "USD",
        "startingBalance": 5000,
        "currentBalance": 6125,
        "profit": 1125
      }
    ],
    "topTags": [
      { "tag": "line_shopper", "count": 8 },
      { "tag": "live_bet", "count": 5 }
    ]
  }
}
```

**Side Effects:**
- Updates `current_balance` in `bankroll_accounts` table
- Can be consumed by web dashboard for real-time metrics

---

### 9.5.3 edge-alerts-dispatch

**Purpose:** Receives threshold-crossing payloads from internal scanners, persists them to `edge_alerts`, and emits notification objects for real-time broadcast.

**Trigger:** HTTP POST from EV scanner or manual alert creation

**Request:**
```json
{
  "defaultTone": "engaging",
  "alerts": [
    {
      "market": "Chiefs @ Bills - Moneyline",
      "sportsbook": "BookA",
      "edgeValue": 0.045,
      "triggerThreshold": 0.03,
      "url": "https://booka.example/line",
      "metadata": { "reason": "Line lagged vs. consensus" }
    }
  ]
}
```

**Response:**
```json
{
  "status": "ok",
  "alerts": [
    {
      "id": "1c2...",
      "market": "Chiefs @ Bills - Moneyline",
      "edge_value": 0.045,
      "status": "active"
    }
  ],
  "notifications": [
    {
      "alertId": "1c2...",
      "message": "🚨 Chiefs @ Bills - Moneyline: BookA is hanging value (4.5% edge). Jump before it moves!",
      "tone": "engaging"
    }
  ]
}
```

**Side Effects:**
- Creates row in `edge_alerts` table
- Logs `alert_events` row with `action = "dispatched"`
- Notifications can be broadcast via Supabase Realtime

---

### 9.5.4 edge-alerts-ack

**Purpose:** Acknowledgment webhook invoked when a bettor consumes an edge alert.

**Trigger:** HTTP POST from chat hub or mobile clients

**Request:**
```json
{
  "alertId": "1c2...",
  "userId": "83d...",
  "metadata": { "cta": "tailed" },
  "resolveAlert": true
}
```

**Response:**
```json
{
  "status": "ok",
  "alert": {
    "id": "1c2...",
    "status": "acknowledged",
    "resolved_at": "2024-05-01T12:00:00Z"
  }
}
```

**Side Effects:**
- Creates `alert_events` row with `action = "acknowledged"` (or custom action)
- If `resolveAlert = true`, updates `edge_alerts.status` to `acknowledged` and sets `resolved_at`

---

### 9.5.5 ev-scanner-refresh

**Purpose:** Scheduled odds ingestion that aggregates third-party lines, calculates EV deltas, and synchronizes active entries in `edge_alerts`.

**Trigger:** Cron schedule (every 10 minutes recommended)

**Deployment:**
```bash
supabase functions deploy ev-scanner-refresh --env-file ../.env
supabase functions schedule new daily-odds \
  --function ev-scanner-refresh \
  --cron "*/10 * * * *"
```

**Configuration:**
- `ODDS_FEED_URLS` - Comma-separated list of odds API endpoints
- `EV_MIN_THRESHOLD` - Minimum EV% to keep alert active (e.g., `3` for 3%)

**Manual Test Payload:**
```json
{
  "tone": "engaging",
  "markets": [
    {
      "eventId": "nba-123",
      "market": "Lakers @ Warriors - Spread",
      "consensusDecimalOdds": 1.91,
      "books": [
        { "sportsbook": "BookA", "decimalOdds": 2.05 },
        { "sportsbook": "BookB", "decimalOdds": 1.88 }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "status": "ok",
  "alerts": [
    {
      "id": "c644...",
      "market": "Lakers @ Warriors - Spread",
      "sportsbook": "BookA",
      "edge_value": 0.07
    }
  ],
  "summary": "1 edge refreshed above 3.0% EV."
}
```

**Side Effects:**
- Upserts/inserts rows in `edge_alerts` table
- Logs `alert_events` with `action = "refreshed"`

---

### 9.5.6 on-auth-profile

**Purpose:** Creates or updates bettor profile when Supabase Auth events fire. Ensures every user starts with consistent defaults.

**Trigger:** Supabase Auth webhook (SIGNED_IN, SIGNED_UP events)

**Expected Payload:**
```json
{
  "type": "SIGNED_IN",
  "record": {
    "id": "00000000-0000-0000-0000-000000000000",
    "raw_user_meta_data": {
      "preferred_timezone": "America/New_York",
      "favorite_sports": ["NBA", "NFL"],
      "bankroll_goal": 2500
    }
  }
}
```

**Behavior:**
- Checks if `user_profiles` entry exists for `auth_user_id`
- If not, creates profile with metadata defaults
- If exists, updates with new metadata
- Metadata fields are optional (safe defaults applied)

**Side Effects:**
- Creates/updates row in `user_profiles` table

---

### 9.5.7 chat-digest

**Purpose:** Generates a conversational-ready summary for the home hub based on bankroll, bet, and alert data.

**Trigger:** HTTP POST from frontend or cron job

**Request:**
```json
{
  "userProfileId": "83d...",
  "tone": "engaging"
}
```

**Response:**
```json
{
  "status": "ok",
  "tone": "engaging",
  "summary": "Good day, NBA fan! In UTC time you're sitting on Bankroll 6125.00 (+1125.00 vs. start). 5 recent bets; latest won on Nuggets ML. 2 live edges queued.",
  "highlights": [
    {
      "type": "bankroll",
      "title": "Bankroll snapshot",
      "description": "Total balance 6125.00 (+1125.00 vs. start)."
    },
    {
      "type": "bet",
      "title": "Latest bet",
      "description": "Nuggets vs. Suns – Moneyline (won). Stake 250.00."
    }
  ],
  "context": {
    "profile": { "preferred_timezone": "UTC" },
    "bankrolls": [{ "label": "Main", "current_balance": 6125.0 }],
    "recentBets": [{ "event_name": "Nuggets vs. Suns" }],
    "activeAlerts": [{ "market": "Nuggets -3.5" }]
  }
}
```

**Use Cases:**
- Home screen digest ("Welcome back! Here's what's happening...")
- Daily email summaries
- Push notification content

---

### 9.5.8 Shared Utilities

Located in `/supabase/functions/shared/`, these utilities are imported by all edge functions:

**`env.ts`**
- `requireEnv(key: string)` - Reads environment variable, throws clear error if missing

**`client.ts`**
- `createServiceRoleClient()` - Creates Supabase client with service role key
- Opts out of session persistence for serverless context

**`response.ts`**
- `jsonResponse(data, status)` - Wraps payload in JSON with CORS headers
- `emptyResponse(status)` - Returns empty response (default 204)
- `errorResponse(message, status, details)` - Standardized error format

**`types.ts`**
- TypeScript definitions for public schema
- Helpers: `Tables`, `TablesRow`, `TablesInsert`, `TablesUpdate`

---

### Local Development Workflow

1. **Start Supabase locally:**
   ```bash
   supabase start
   ```

2. **Apply schema:**
   ```bash
   # Run SQL from section 8 in Supabase SQL Editor
   ```

3. **Serve individual function:**
   ```bash
   # Example: odds-assistant
   supabase functions serve odds-assistant --env-file ../.env --debug

   # Test with curl
   curl -i -X POST -H "Content-Type: application/json" \
     -d '{"query": "Best NBA bets tonight", "sportKey": "basketball_nba"}' \
     http://localhost:54321/functions/v1/odds-assistant
   ```

4. **Deploy to production:**
   ```bash
   supabase functions deploy odds-assistant --env-file ../.env
   ```

---

### Observability & Monitoring

**Logging:**
- View logs in Supabase Dashboard: **Project Settings → Logs → Edge Functions**
- Filter by function name and log level

**Scheduled Functions:**
- `ev-scanner-refresh` should run every 10 minutes
- Monitor via Supabase Log Explorer with `edge-alerts` label

**Triggers:**
- `bankroll-metrics-sync` fires on bet INSERT/UPDATE
- Check for recalculation errors in logs

**Alerts:**
- `edge-alerts-dispatch` logs to `alert_events` table
- Full lifecycle trail available for analytics

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
