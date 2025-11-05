export type OddsFormat = "american" | "decimal" | "fractional";

export interface ConvertedOdds {
  american: number;
  decimal: number;
  fractional: string;
  impliedProbability: number;
}

const FRACTION_PRECISION = 1000;

export function americanToDecimal(american: number): number {
  if (american === 0) {
    throw new Error("American odds cannot be zero");
  }
  if (american > 0) {
    return 1 + american / 100;
  }
  return 1 + 100 / Math.abs(american);
}

export function decimalToAmerican(decimal: number): number {
  if (decimal <= 1) {
    throw new Error("Decimal odds must be greater than 1");
  }
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }
  return Math.round(-100 / (decimal - 1));
}

export function fractionalToDecimal(fractional: string): number {
  const [num, den] = fractional.split("/").map(Number);
  if (!den || den === 0) {
    throw new Error("Invalid fractional odds");
  }
  return 1 + num / den;
}

export function decimalToFractional(decimal: number): string {
  if (decimal <= 1) {
    throw new Error("Decimal odds must be greater than 1");
  }
  const value = decimal - 1;
  const numerator = Math.round(value * FRACTION_PRECISION);
  const denominator = FRACTION_PRECISION;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(numerator, denominator);
  return `${numerator / divisor}/${denominator / divisor}`;
}

export function impliedProbabilityFromDecimal(decimal: number): number {
  if (decimal <= 1) {
    throw new Error("Decimal odds must be greater than 1");
  }
  return 1 / decimal;
}

export function convertOdds(
  value: number | string,
  fromFormat: OddsFormat,
  toFormat: OddsFormat,
): number | string {
  let decimal: number;
  switch (fromFormat) {
    case "american":
      decimal = americanToDecimal(Number(value));
      break;
    case "decimal":
      decimal = Number(value);
      break;
    case "fractional":
      decimal = fractionalToDecimal(String(value));
      break;
    default:
      throw new Error(`Unsupported odds format: ${fromFormat}`);
  }

  switch (toFormat) {
    case "american":
      return decimalToAmerican(decimal);
    case "decimal":
      return parseFloat(decimal.toFixed(4));
    case "fractional":
      return decimalToFractional(decimal);
    default:
      throw new Error(`Unsupported odds format: ${toFormat}`);
  }
}

export function convertAll(american: number): ConvertedOdds {
  const decimal = americanToDecimal(american);
  const fractional = decimalToFractional(decimal);
  const impliedProbability = parseFloat(
    (impliedProbabilityFromDecimal(decimal) * 100).toFixed(2),
  );
  return {
    american,
    decimal: parseFloat(decimal.toFixed(4)),
    fractional,
    impliedProbability,
  };
}
