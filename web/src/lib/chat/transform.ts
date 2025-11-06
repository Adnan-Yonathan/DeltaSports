import type {
  AssistantOdds,
  AssistantSection,
  SourceBadge,
} from "@/components/chat/types";

export type OddsAssistantPayload = {
  status?: string;
  odds_snapshot?: unknown;
  model_summary?: unknown;
  message?: unknown;
  details?: unknown;
};

export type TransformedAssistantResult = {
  headline: string;
  summary: string;
  odds?: AssistantOdds;
  sections: readonly AssistantSection[];
  sources: readonly SourceBadge[];
  warnings: readonly string[];
};

type SnapshotFilters = {
  regions?: string;
  markets?: string;
  bookmakers?: string;
  oddsFormat?: string;
};

type SnapshotOutcome = {
  name: string | null;
  price: number | null;
  point: number | null;
};

type SnapshotMarket = {
  key: string | null;
  lastUpdate: string | null;
  outcomes: SnapshotOutcome[];
};

type SnapshotBookmaker = {
  key: string | null;
  title: string | null;
  lastUpdate: string | null;
  markets: SnapshotMarket[];
};

type SnapshotEvent = {
  id: string | null;
  sportKey: string | null;
  sportTitle: string | null;
  commenceTime: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  bookmakers: SnapshotBookmaker[];
};

type OddsSnapshot = {
  sportKey: string | null;
  fetchedAt: string | null;
  filters: SnapshotFilters;
  events: SnapshotEvent[];
  warnings: string[];
};

const toString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const numeric = typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numeric) ? numeric : null;
};

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
};

const formatAmerican = (value: number): string =>
  value > 0 ? `+${Math.round(value)}` : `${Math.round(value)}`;

const americanToDecimal = (american: number): number | null => {
  if (!Number.isFinite(american) || american === 0) {
    return null;
  }

  if (american > 0) {
    return 1 + american / 100;
  }

  return 1 + 100 / Math.abs(american);
};

const americanToImpliedProbability = (american: number): number | null => {
  if (!Number.isFinite(american) || american === 0) {
    return null;
  }

  if (american > 0) {
    return 100 / (american + 100);
  }

  const abs = Math.abs(american);
  return abs / (abs + 100);
};

const americanToFractional = (american: number): string | null => {
  if (!Number.isFinite(american) || american === 0) {
    return null;
  }

  const numeratorBase = american > 0 ? Math.round(american) : 100;
  const denominatorBase = american > 0 ? 100 : Math.round(Math.abs(american));
  const divisor = gcd(numeratorBase, denominatorBase);
  return `${numeratorBase / divisor}/${denominatorBase / divisor}`;
};

const decimalToAmerican = (decimal: number): number | null => {
  if (!Number.isFinite(decimal) || decimal <= 1) {
    return null;
  }

  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }

  return Math.round(-100 / (decimal - 1));
};

const decimalToFractional = (decimal: number): string | null => {
  if (!Number.isFinite(decimal) || decimal <= 1) {
    return null;
  }

  const profit = decimal - 1;
  const denominator = 1000;
  const numerator = Math.round(profit * denominator);
  const divisor = gcd(numerator, denominator);
  return `${Math.round(numerator / divisor)}/${Math.round(denominator / divisor)}`;
};

const decimalToProbability = (decimal: number): number | null => {
  if (!Number.isFinite(decimal) || decimal <= 0) {
    return null;
  }

  return 1 / decimal;
};

const parseSnapshot = (raw: unknown): OddsSnapshot | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const filtersRecord =
    record.filters && typeof record.filters === "object"
      ? (record.filters as Record<string, unknown>)
      : {};

  const filters: SnapshotFilters = {
    regions: toString(filtersRecord.regions) ?? undefined,
    markets: toString(filtersRecord.markets) ?? undefined,
    bookmakers: toString(filtersRecord.bookmakers) ?? undefined,
    oddsFormat: toString(filtersRecord.oddsFormat) ?? undefined,
  };

  const eventsRaw = Array.isArray(record.events) ? record.events : [];
  const events: SnapshotEvent[] = [];

  for (const entry of eventsRaw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const eventRecord = entry as Record<string, unknown>;
    const bookmakersRaw = Array.isArray(eventRecord.bookmakers) ? eventRecord.bookmakers : [];
    const bookmakers: SnapshotBookmaker[] = [];

    for (const bookmakerEntry of bookmakersRaw) {
      if (!bookmakerEntry || typeof bookmakerEntry !== "object") {
        continue;
      }

      const bookmakerRecord = bookmakerEntry as Record<string, unknown>;
      const marketsRaw = Array.isArray(bookmakerRecord.markets) ? bookmakerRecord.markets : [];
      const markets: SnapshotMarket[] = [];

      for (const marketEntry of marketsRaw) {
        if (!marketEntry || typeof marketEntry !== "object") {
          continue;
        }

        const marketRecord = marketEntry as Record<string, unknown>;
        const outcomesRaw = Array.isArray(marketRecord.outcomes) ? marketRecord.outcomes : [];
        const outcomes: SnapshotOutcome[] = [];

        for (const outcomeEntry of outcomesRaw) {
          if (!outcomeEntry || typeof outcomeEntry !== "object") {
            continue;
          }

          const outcomeRecord = outcomeEntry as Record<string, unknown>;
          outcomes.push({
            name: toString(outcomeRecord.name),
            price: toNumber(outcomeRecord.price),
            point: toNumber(outcomeRecord.point),
          });
        }

        markets.push({
          key: toString(marketRecord.key),
          lastUpdate: toString(marketRecord.lastUpdate),
          outcomes,
        });
      }

      bookmakers.push({
        key: toString(bookmakerRecord.key),
        title: toString(bookmakerRecord.title),
        lastUpdate: toString(bookmakerRecord.lastUpdate),
        markets,
      });
    }

    events.push({
      id: toString(eventRecord.id),
      sportKey: toString(eventRecord.sportKey),
      sportTitle: toString(eventRecord.sportTitle),
      commenceTime: toString(eventRecord.commenceTime),
      homeTeam: toString(eventRecord.homeTeam),
      awayTeam: toString(eventRecord.awayTeam),
      bookmakers,
    });
  }

  const warnings = Array.isArray(record.warnings)
    ? record.warnings.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

  return {
    sportKey: toString(record.sportKey),
    fetchedAt: toString(record.fetchedAt),
    filters,
    events,
    warnings,
  };
};

const buildOdds = (snapshot: OddsSnapshot | null): AssistantOdds | undefined => {
  if (!snapshot) {
    return undefined;
  }

  for (const event of snapshot.events) {
    for (const bookmaker of event.bookmakers) {
      for (const market of bookmaker.markets) {
        const outcome = market.outcomes.find((entry) => entry.price !== null);
        if (!outcome || outcome.price === null) {
          continue;
        }

        const oddsFormat = snapshot.filters.oddsFormat ?? "american";
        let american: number | null = null;
        let decimal: number | null = null;
        let fractional: string | null = null;
        let impliedProbability: number | null = null;

        if (oddsFormat === "american") {
          american = outcome.price;
          decimal = americanToDecimal(american);
          fractional = americanToFractional(american);
          impliedProbability = americanToImpliedProbability(american);
        } else if (oddsFormat === "decimal") {
          decimal = outcome.price;
          american = decimalToAmerican(decimal);
          fractional = decimalToFractional(decimal);
          impliedProbability = decimalToProbability(decimal);
        } else {
          // Assume fractional odds (a/b) can be derived from provided price
          const price = outcome.price;
          if (price && price > 0) {
            // Treat the numeric price as the numerator with denominator 1
            const numerator = Math.round(price);
            const denominator = 1;
            const divisor = gcd(numerator, denominator);
            fractional = `${numerator / divisor}/${denominator / divisor}`;
          }
        }

        if (american !== null) {
          if (decimal === null) {
            decimal = americanToDecimal(american);
          }
          if (!fractional) {
            fractional = americanToFractional(american);
          }
          if (impliedProbability === null) {
            impliedProbability = americanToImpliedProbability(american);
          }
        }

        if (decimal !== null && impliedProbability === null) {
          impliedProbability = decimalToProbability(decimal);
        }

        const result: AssistantOdds = {};
        if (american !== null) {
          result.american = formatAmerican(american);
        }
        if (decimal !== null) {
          result.decimal = decimal.toFixed(2);
        }
        if (fractional) {
          result.fractional = fractional;
        }
        if (impliedProbability !== null) {
          result.impliedProbability = `${(impliedProbability * 100).toFixed(1)}%`;
        }

        return result;
      }
    }
  }

  return undefined;
};

const formatCommenceTime = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const buildSections = (snapshot: OddsSnapshot | null): AssistantSection[] => {
  if (!snapshot) {
    return [];
  }

  const sections: AssistantSection[] = [];

  const primaryEvent = snapshot.events[0];
  if (primaryEvent) {
    const commence = formatCommenceTime(primaryEvent.commenceTime);
    const matchupParts = [primaryEvent.awayTeam, primaryEvent.homeTeam].filter(Boolean);
    const matchup = matchupParts.length === 2 ? `${matchupParts[0]} @ ${matchupParts[1]}` : matchupParts.join(" vs ");
    const items: string[] = [];
    if (matchup) {
      items.push(matchup);
    }
    if (primaryEvent.sportTitle) {
      items.push(`Competition: ${primaryEvent.sportTitle}`);
    }
    if (commence) {
      items.push(`Commences: ${commence}`);
    }
    sections.push({ id: "event", title: "Top event", items });
  }

  const bookmakers = new Set<string>();
  for (const event of snapshot.events) {
    for (const bookmaker of event.bookmakers) {
      if (bookmaker.title) {
        const lastUpdated = bookmaker.lastUpdate ? formatCommenceTime(bookmaker.lastUpdate) : null;
        bookmakers.add(lastUpdated ? `${bookmaker.title} · updated ${lastUpdated}` : bookmaker.title);
      }
    }
  }
  if (bookmakers.size > 0) {
    sections.push({
      id: "bookmakers",
      title: "Bookmaker coverage",
      items: Array.from(bookmakers).slice(0, 6),
    });
  }

  const filters: string[] = [];
  if (snapshot.filters.regions) {
    filters.push(`Regions: ${snapshot.filters.regions}`);
  }
  if (snapshot.filters.markets) {
    filters.push(`Markets: ${snapshot.filters.markets}`);
  }
  if (snapshot.filters.bookmakers) {
    filters.push(`Preferred books: ${snapshot.filters.bookmakers}`);
  }
  if (snapshot.fetchedAt) {
    const fetched = formatCommenceTime(snapshot.fetchedAt);
    if (fetched) {
      filters.push(`Fetched: ${fetched}`);
    }
  }
  if (filters.length > 0) {
    sections.push({ id: "filters", title: "Snapshot filters", items: filters });
  }

  return sections;
};

const buildHeadline = (snapshot: OddsSnapshot | null): string => {
  if (snapshot?.events?.length) {
    const event = snapshot.events[0];
    const sportLabel = event.sportTitle ?? snapshot.sportKey ?? "odds";
    if (event.homeTeam && event.awayTeam) {
      return `${event.awayTeam} @ ${event.homeTeam}`;
    }
    if (sportLabel) {
      return `Live ${sportLabel} odds`;
    }
  }

  if (snapshot?.sportKey) {
    return `Odds snapshot · ${snapshot.sportKey}`;
  }

  return "Odds assistant";
};

const buildSources = (summary: string): SourceBadge[] => {
  const sources: SourceBadge[] = [
    { id: "supabase-edge", label: "Supabase Edge" },
    { id: "odds-api", label: "The Odds API" },
  ];

  if (summary.trim().length > 0) {
    sources.push({ id: "openai", label: "OpenAI" });
  }

  return sources;
};

export const transformAssistantPayload = (
  payload: OddsAssistantPayload
): TransformedAssistantResult => {
  const snapshot = parseSnapshot(payload.odds_snapshot);
  const summary = toString(payload.model_summary) ?? "No summary returned.";
  const headline = buildHeadline(snapshot);
  const odds = buildOdds(snapshot);
  const sections = buildSections(snapshot);
  const sources = buildSources(summary);
  const warnings = snapshot?.warnings ?? [];

  return {
    headline,
    summary,
    odds,
    sections,
    sources,
    warnings,
  };
};

export const isAssistantError = (payload: OddsAssistantPayload): payload is OddsAssistantPayload & {
  status: string;
  message: string;
} => payload.status === "error" && typeof payload.message === "string";
