import { americanToDecimal, convertAll, convertOdds, decimalToAmerican, decimalToFractional } from "@/lib/odds/convert";

describe("odds conversion", () => {
  it("converts american to decimal", () => {
    expect(americanToDecimal(-110)).toBeCloseTo(1.9091, 4);
    expect(americanToDecimal(150)).toBeCloseTo(2.5);
  });

  it("converts decimal to american", () => {
    expect(decimalToAmerican(2.5)).toBe(150);
    expect(decimalToAmerican(1.8)).toBe(-125);
  });

  it("converts between formats", () => {
    expect(convertOdds(-110, "american", "decimal")).toBeCloseTo(1.9091, 4);
    expect(convertOdds(2.5, "decimal", "american")).toBe(150);
    expect(convertOdds(2.5, "decimal", "fractional")).toBe("3/2");
  });

  it("produces implied probability", () => {
    const odds = convertAll(-135);
    expect(odds.impliedProbability).toBeCloseTo(57.45);
    expect(decimalToFractional(odds.decimal)).toBe(odds.fractional);
  });
});
