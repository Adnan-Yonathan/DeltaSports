# Delta – Conversational Sports Intelligence Platform

## 1. 🏗️ Product Overview

Delta transforms how serious and aspiring sports bettors interact with data by merging real-time betting intelligence with conversational AI. Designed to feel like ChatGPT meets a Bloomberg Terminal for betting, Delta’s chat-first experience replaces dashboards with conversation — enabling smarter, faster, and sharper decision-making.

## 2. 🎯 Target Users

### 🧱 Core Users (Moat)

- **Aspiring Sharps:** Transitioning from casual to calculated, need education, discipline, and line value clarity.
- **Professional Bettors:** ROI-driven, high-volume users needing context, line movement tracking, and edge analytics.

### 🌱 Secondary Audience (Growth Focus)

- **Casual Bettors:** Curious users looking for help, confidence, and a smarter betting experience. Sim Mode and onboarding gamify sharp behavior.

## 3. 💡 Core Features (V1 Must-Haves)

### 3.1 Conversational AI Hub (Home Screen)

- Natural language and voice input.
- Persistent memory (bankroll, recent bets, behavioral patterns).
- Live stream of "Your Edge Alerts," "Market Shifts," and "Bankroll Summary."
- Tone Toggle: Casual / Sharp (switch between light coaching or sharp data delivery).
- Design: Feels like Bloomberg x ChatGPT, optimized for betting flow.

### 3.2 Bankroll + Bet Tracking Engine

- Manual and NLP-based entry (e.g., "$50 on Knicks ML").
- Unit tracking, ROI by sport, bet type, and time.
- Behavior tags detect tilt, chasing, overbetting.
- Visualizations: P/L curve, unit heatmap, discipline score.

### 3.3 Line + EV Scanner (Market Context Engine)

- Odds aggregation across major books (FanDuel, DraftKings, BetRivers).
- EV differential engine auto-highlights value.
- Key number tagging (e.g., NFL 3, 7).
- Short-form insights such as "Sharp money pushed Saints from +14 → +12.5 on FanDuel."
- Widget: "Top Market Discrepancies" live feed.

### 3.4 Edge Cards (Dynamic Insights Feed)

- Bite-sized smart alerts, including:
  - "You’re +6.3% ROI on NBA unders this week."
  - "Line dropped 0.5 pts — value improving."
  - "You’re 1 for 9 on parlays. Try single markets."
- System: Data → Narrative → Action.
- Also used for upsells, streak management, and creator highlights.

## 4. 🚀 Leverage Features (Engagement & Retention)

### 4.1 Adaptive Betting Intelligence Loop (ABIL)

- Learns from streaks, unit sizing, post-loss behavior.
- Smart nudges (e.g., "You overbet after losses. Adjust unit to 0.75 this week.")
- Monthly report: EV, bankroll trends, discipline rating.

### 4.2 Line Movement Tracker + Alerts

- Real-time market context with custom alerts:
  - If spread moves ≥ 0.5 pts.
  - If EV > 5% on player props.
- iOS lock screen widget for live games.

### 4.3 Creator-Linked Feed

- Verified pick feeds: "Joke’s Picks," "Sharp Trends."
- Each pick gets AI summary that explains rationale to users.
- Tracks creator conversions and powers revenue share.

### 4.4 Bankroll Simulation Mode

- Fake bankroll paired with real market data.
- Insights such as "If you stuck to plan, you'd be up +3.7 units."
- Unlocks Pro Mode after 10 sessions and triggers upsell.

## 5. 🧬 Moat Features (Differentiators)

### 5.1 Cross-Market Intelligence Engine

- Public vs. sharp behavior tracked in real-time.
- Scraped betting percentages and consensus alignment map.
- Alerts for reversals (e.g., "82% on Lakers, line moving opposite").

### 5.2 “Why the Line Moved” Engine

- Contextual education layer.
- Every odds shift receives a simple summary (e.g., "Books moved LAR -14.5 → -15 after heavy sharp volume and injury to Kamara.")

### 5.3 Smart Accountability Reports

- Sunday Night Report Drop.
- Example insights:
  - "42 bets. +2.4 units. Most profitable: NBA totals. You chased twice → cost -3.1u."
- Graphical, shareable, dopamine-driven.

### 5.4 In-App Psychology Layer (Optional Add-On)

- AI journaling (e.g., "What was your mindset before this bet?")
- Emotion tracking: "revenge," "chasing," "hot hand."
- Long-term analytics correlate bet behavior with mood for retention.

## 6. 💰 Monetization Framework

| Tier   | Price             | Includes                                                                 |
| ------ | ----------------- | ------------------------------------------------------------------------- |
| Pro    | $29/mo or $99/year | Core AI, bankroll tracking, line scanner, edge cards                     |
| Elite  | $199/mo or $999/year | All Pro features + creator feeds, EV dashboards, real-time smart alerts |
| Affiliate Rev | Rev share        | Bookmaker referrals, creator codes, smart alert link-outs               |

- No free tier — hard paywall on launch.
- Affiliate revenue covers CAC through link-outs, smart alerts, and creator share codes.
- In-product upsell flow via Sim Mode, locked Edge Cards, and alert gates.

## 7. 🧱 Tech Stack

| Layer    | Stack                      | Notes                                             |
| -------- | -------------------------- | ------------------------------------------------- |
| Frontend | Next.js + Tailwind (mobile-first) | Conversational UI, clean data visualizations |
| Backend  | Supabase (auth + DB)        | User data, bankrolls, history, creators           |
| Realtime | Supabase Realtime / Pusher | Odds feed, live alerts                            |
| LLM Layer| OpenAI GPT-4o / Claude 3   | Context memory, tone adaptation, summaries        |
| APIs     | OddsAPI, TheOdds, Sportsdata.io | Redundant sportsbook data                    |
| Storage  | Supabase Edge + Postgres   | Scalable, fast                                    |

## 8. 📊 Success Metrics

| Stage      | KPI                      | Target |
| ---------- | ------------------------ | ------ |
| Acquisition| CAC via creator/affiliate| < $10/user |
| Activation | % completing onboarding  | ≥ 75%  |
| Retention  | % active on Day 30       | ≥ 45%  |
| Engagement | Avg messages/user/week   | ≥ 25   |
| Monetization | Paid conversion rate   | ≥ 8%   |
| Affiliate RPM | Revenue per 1K clicks | $30+   |

## ✅ Summary

Delta isn’t another dashboard betting app — it’s a conversational intelligence layer for smart bettors. By combining edge detection, behavior feedback, and real-time odds inside a humanlike chat UX, Delta redefines how bettors interact with data — and more importantly, with themselves.

**Differentiator:** 🧠 The smartest sports bettor in your pocket — always learning, always watching the lines, and always speaking your language.
