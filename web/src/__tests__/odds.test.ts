import { americanToDecimal, decimalToAmerican, decimalToFractional, impliedProbability } from "@/lib/odds/convert";

describe("odds conversion", () => {
  it("converts american to decimal", () => {
    expect(americanToDecimal(-110)).toBeCloseTo(1.909, 2);
    expect(americanToDecimal(150)).toBeCloseTo(2.5, 2);
  });

  it("converts decimal to american", () => {
    expect(decimalToAmerican(1.91)).toBe(-110);
    expect(decimalToAmerican(2.5)).toBe(150);
  });

  it("computes fractional", () => {
    expect(decimalToFractional(1.5)).toBe("1/2");
  });

  it("computes implied probability", () => {
    expect(impliedProbability(-110, "american")).toBeCloseTo(0.5238, 3);
  });
});
