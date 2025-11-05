export type OddsFormat = "american" | "decimal" | "fractional";

export function americanToDecimal(american: number): number {
  if (american === 0) throw new Error("American odds cannot be zero");
  return american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
}

export function decimalToAmerican(decimal: number): number {
  if (decimal <= 1) throw new Error("Decimal odds must be greater than 1");
  return decimal >= 2 ? Math.round((decimal - 1) * 100) : Math.round(-100 / (decimal - 1));
}

export function fractionalToDecimal(fractional: string): number {
  const [num, denom] = fractional.split("/").map((part) => Number(part.trim()));
  if (!Number.isFinite(num) || !Number.isFinite(denom) || denom === 0) {
    throw new Error("Invalid fractional odds");
  }
  return 1 + num / denom;
}

export function decimalToFractional(decimal: number, precision = 1000): string {
  if (decimal <= 1) throw new Error("Decimal odds must be greater than 1");
  const value = decimal - 1;
  const numerator = Math.round(value * precision);
  const denominator = precision;
  const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
  const divisor = gcd(numerator, denominator);
  return `${numerator / divisor}/${denominator / divisor}`;
}

export function convertOdds(value: number | string, from: OddsFormat, to: OddsFormat): number | string {
  if (from === to) return value;

  let decimal: number;
  switch (from) {
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
      throw new Error(`Unsupported odds format: ${from}`);
  }

  switch (to) {
    case "american":
      return decimalToAmerican(decimal);
    case "decimal":
      return decimal;
    case "fractional":
      return decimalToFractional(decimal);
    default:
      throw new Error(`Unsupported odds format: ${to}`);
  }
}

export function impliedProbabilityFromDecimal(decimal: number): number {
  if (decimal <= 0) throw new Error("Decimal odds must be positive");
  return 1 / decimal;
}

export function impliedProbability(value: number | string, format: OddsFormat): number {
  switch (format) {
    case "decimal":
      return impliedProbabilityFromDecimal(Number(value));
    case "american":
      return impliedProbabilityFromDecimal(americanToDecimal(Number(value)));
    case "fractional":
      return impliedProbabilityFromDecimal(fractionalToDecimal(String(value)));
    default:
      throw new Error(`Unsupported odds format: ${format}`);
  }
}
