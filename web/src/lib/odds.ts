export type OddsComputation = {
  american: number;
  decimal: number;
  fractional: string;
  impliedProbability: number;
  expectedValue: number;
  confidenceNote: string;
};

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

const simplifyFraction = (numerator: number, denominator: number) => {
  const divisor = gcd(numerator, denominator) || 1;
  return `${Math.round(numerator / divisor)}/${Math.round(denominator / divisor)}`;
};

export const toDecimalOdds = (american: number) => {
  if (american === 0) {
    return 1.0;
  }
  if (american > 0) {
    return 1 + american / 100;
  }
  return 1 + 100 / Math.abs(american);
};

export const toFractionalOdds = (american: number) => {
  if (american === 0) {
    return "1/1";
  }
  const absolute = Math.abs(american);
  if (american > 0) {
    return simplifyFraction(american, 100);
  }
  return simplifyFraction(100, absolute);
};

export const toImpliedProbability = (american: number) => {
  if (american === 0) {
    return 0.5;
  }
  if (american > 0) {
    return 100 / (american + 100);
  }
  const absolute = Math.abs(american);
  return absolute / (absolute + 100);
};

export const computeExpectedValue = (american: number, stake = 100) => {
  const decimal = toDecimalOdds(american);
  const impliedProbability = toImpliedProbability(american);
  const potentialReturn = decimal * stake;
  const profitIfWin = potentialReturn - stake;
  const lossIfLose = stake;
  return impliedProbability * profitIfWin - (1 - impliedProbability) * lossIfLose;
};

export const confidenceBand = (probability: number) => {
  if (probability >= 0.6) {
    return "Heavy favorite";
  }
  if (probability >= 0.5) {
    return "Slight edge";
  }
  if (probability >= 0.4) {
    return "Toss-up";
  }
  return "Long shot";
};

export const summarizeOdds = (american: number, stake = 100): OddsComputation => {
  const decimal = toDecimalOdds(american);
  const fractional = toFractionalOdds(american);
  const impliedProbability = toImpliedProbability(american);
  const expectedValue = computeExpectedValue(american, stake);
  const confidenceNote = confidenceBand(impliedProbability);

  return {
    american,
    decimal,
    fractional,
    impliedProbability,
    expectedValue,
    confidenceNote,
  };
};

export const formatAmericanOdds = (value: number) => (value > 0 ? `+${value}` : `${value}`);

export const formatPercent = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

export const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
