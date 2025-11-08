# Supabase SQL Prompts

Use the following statements directly inside the Supabase SQL Editor to create the core schema for the DeltaSports conversational betting platform. Execute them in order and adjust names or constraints as needed for your specific environment.

## 1. Enable Extensions
```sql
-- Ensures UUID generation helpers are available
create extension if not exists "pgcrypto";
```

## 2. Domain & Enum Types
```sql
-- Normalized currency code type (ISO-4217)
create domain currency_code as text
  check (value ~ '^[A-Z]{3}$');

-- Track bet outcomes
create type bet_status as enum ('pending', 'won', 'lost', 'push', 'void');

-- Identify how an alert was generated
create type alert_origin as enum ('model', 'manual');
```

## 3. Core Profiles
```sql
-- Link authenticated users to betting preferences
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  preferred_timezone text default 'UTC',
  favorite_sports text[] default array[]::text[],
  bankroll_goal numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(auth_user_id)
);
```

## 4. Bankroll Tracking
```sql
-- Track bankroll accounts a bettor manages
create table if not exists public.bankroll_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  label text not null,
  currency currency_code not null default 'USD',
  starting_balance numeric(12,2) not null default 0,
  current_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Individual bets tied to bankrolls
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  bankroll_id uuid references public.bankroll_accounts (id) on delete set null,
  event_name text not null,
  market text not null,
  wager_amount numeric(12,2) not null,
  american_odds integer,
  decimal_odds numeric(8,4),
  expected_value numeric(8,4),
  status bet_status not null default 'pending',
  settled_payout numeric(12,2),
  notes text,
  placed_at timestamptz not null default now(),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional tags that drive behavioral insights
create table if not exists public.bet_tags (
  bet_id uuid references public.bets (id) on delete cascade,
  tag text not null,
  tagged_at timestamptz not null default now(),
  primary key (bet_id, tag)
);
```

## 5. Edge Intelligence
```sql
-- Alerts emitted from the value models
create table if not exists public.edge_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles (id) on delete cascade,
  origin alert_origin not null default 'model',
  source_handle text,
  market text not null,
  sportsbook text,
  edge_value numeric(8,4) not null,
  trigger_threshold numeric(8,4),
  message text not null,
  status text not null default 'active',
  triggered_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Immutable log of alert consumption for accountability reports
create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.edge_alerts (id) on delete cascade,
  user_id uuid references public.user_profiles (id) on delete cascade,
  action text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

## 6. Utility Triggers
```sql
-- Keep updated_at columns current without manual writes
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_profiles_updated
before update on public.user_profiles
for each row execute procedure public.set_updated_at();

create trigger bankroll_accounts_updated
before update on public.bankroll_accounts
for each row execute procedure public.set_updated_at();

create trigger bets_updated
before update on public.bets
for each row execute procedure public.set_updated_at();
```

---

After running these prompts, configure Supabase Row Level Security (RLS) policies that align with your auth model (e.g., restrict reads/writes to the owning `auth_user_id`).
