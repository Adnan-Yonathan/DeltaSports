export type SportsQuery = {
  /**
   * Natural language prompt submitted by the user. This value provides
   * conversational context to the downstream sports data provider so it can
   * determine what information to return.
   */
  query: string;
  /** Optional sport to scope the request to (e.g. "nba", "mlb"). */
  sport?: string;
  /** Optional league for further specialization (e.g. "western-conference"). */
  league?: string;
  /** Optional market or bet type the user is interested in. */
  market?: string;
  /** Optional time horizon for the request such as "today" or "this week". */
  timeframe?: string;
};

export type SportsDataResult = {
  query: SportsQuery;
  generatedAt: string;
};

/**
 * Placeholder implementation that mimics a real data provider. In production
 * this helper would call external APIs; in the tests we only need the
 * structured response so the TypeScript contract remains intact.
 */
export async function fetchSportsData(query: SportsQuery): Promise<SportsDataResult> {
  return {
    query,
    generatedAt: new Date().toISOString(),
  };
}
