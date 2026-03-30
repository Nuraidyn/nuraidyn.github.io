import { describe, it, expect } from "vitest";
import {
  calcSalaryGap,
  calcSalaryGapPercent,
  calcCumulativeInflation,
  calcRealIncome,
  rankCountriesByRealEarnings,
} from "../incomeAnalysis";

// ── calcSalaryGap ────────────────────────────────────────────────────────────

describe("calcSalaryGap", () => {
  it("returns positive gap when user earns more than average", () => {
    expect(calcSalaryGap(5000, 3000)).toBe(2000);
  });

  it("returns zero when user salary equals average", () => {
    expect(calcSalaryGap(3000, 3000)).toBe(0);
  });

  it("returns negative gap when user earns less than average", () => {
    expect(calcSalaryGap(2000, 3000)).toBe(-1000);
  });

  it("handles zero user salary", () => {
    expect(calcSalaryGap(0, 3000)).toBe(-3000);
  });

  it("handles zero country average", () => {
    expect(calcSalaryGap(3000, 0)).toBe(3000);
  });
});

// ── calcSalaryGapPercent ─────────────────────────────────────────────────────

describe("calcSalaryGapPercent", () => {
  it("returns +100% when user salary is double the average", () => {
    expect(calcSalaryGapPercent(6000, 3000)).toBeCloseTo(100, 5);
  });

  it("returns -50% when user salary is half the average", () => {
    expect(calcSalaryGapPercent(1500, 3000)).toBeCloseTo(-50, 5);
  });

  it("returns 0 when salaries are equal", () => {
    expect(calcSalaryGapPercent(3000, 3000)).toBe(0);
  });

  it("returns 0 when countryAvg is zero or negative (guard)", () => {
    expect(calcSalaryGapPercent(3000, 0)).toBe(0);
    expect(calcSalaryGapPercent(3000, -100)).toBe(0);
  });

  it("handles zero user salary gracefully", () => {
    expect(calcSalaryGapPercent(0, 3000)).toBeCloseTo(-100, 5);
  });
});

// ── calcCumulativeInflation ──────────────────────────────────────────────────

describe("calcCumulativeInflation", () => {
  it("returns 0 when years is 0", () => {
    const result = calcCumulativeInflation({ 2023: 5.0 }, 0);
    expect(result).toBe(0);
  });

  it("returns positive cumulative inflation for known data", () => {
    // 1-year with 10% inflation → cumulative = 0.10
    const currentYear = new Date().getFullYear();
    const yearlyInflation = { [currentYear - 1]: 10 };
    const result = calcCumulativeInflation(yearlyInflation, 1);
    expect(result).toBeCloseTo(0.1, 5);
  });

  it("compounds inflation over multiple years", () => {
    // Two years at 10% each: (1.1 * 1.1) - 1 = 0.21
    const currentYear = new Date().getFullYear();
    const yearlyInflation = {
      [currentYear - 2]: 10,
      [currentYear - 1]: 10,
    };
    const result = calcCumulativeInflation(yearlyInflation, 2);
    expect(result).toBeCloseTo(0.21, 5);
  });

  it("uses 3% fallback when year data is missing", () => {
    // 1-year with no data → fallback 3%
    const result = calcCumulativeInflation({}, 1);
    expect(result).toBeCloseTo(0.03, 5);
  });

  it("handles negative inflation (deflation)", () => {
    const currentYear = new Date().getFullYear();
    const yearlyInflation = { [currentYear - 1]: -2 };
    const result = calcCumulativeInflation(yearlyInflation, 1);
    expect(result).toBeCloseTo(-0.02, 5);
  });
});

// ── calcRealIncome ───────────────────────────────────────────────────────────

describe("calcRealIncome", () => {
  it("returns nominal income when inflation is 0", () => {
    expect(calcRealIncome(5000, 0)).toBe(5000);
  });

  it("reduces income when inflation is positive", () => {
    // 5000 / 1.10 ≈ 4545
    expect(calcRealIncome(5000, 0.1)).toBeCloseTo(4545.45, 1);
  });

  it("increases real income when inflation is negative (deflation)", () => {
    // 5000 / 0.98 > 5000
    expect(calcRealIncome(5000, -0.02)).toBeGreaterThan(5000);
  });

  it("handles zero income", () => {
    expect(calcRealIncome(0, 0.1)).toBe(0);
  });
});

// ── rankCountriesByRealEarnings ──────────────────────────────────────────────

describe("rankCountriesByRealEarnings", () => {
  const testData = {
    HIGH: {
      name: "High Income Country",
      avgMonthlyIncome: 5000,
      yearlyInflation: {},      // will use 3% fallback
    },
    LOW: {
      name: "Low Income Country",
      avgMonthlyIncome: 1000,
      yearlyInflation: {},
    },
    MID: {
      name: "Mid Income Country",
      avgMonthlyIncome: 3000,
      yearlyInflation: {},
    },
  };

  it("returns an array with one entry per country", () => {
    const result = rankCountriesByRealEarnings(testData, 1);
    expect(result).toHaveLength(3);
  });

  it("sorts by real income descending", () => {
    const result = rankCountriesByRealEarnings(testData, 1);
    expect(result[0].code).toBe("HIGH");
    expect(result[1].code).toBe("MID");
    expect(result[2].code).toBe("LOW");
  });

  it("each entry has required fields", () => {
    const result = rankCountriesByRealEarnings(testData, 1);
    const entry = result[0];
    expect(entry).toHaveProperty("code");
    expect(entry).toHaveProperty("name");
    expect(entry).toHaveProperty("realIncome");
    expect(entry).toHaveProperty("cumInfl");
    expect(entry).toHaveProperty("avgMonthlyIncome");
  });

  it("real income is always less than or equal to nominal income (positive inflation)", () => {
    // With positive fallback inflation (3%), real < nominal
    const result = rankCountriesByRealEarnings(testData, 1);
    result.forEach((entry) => {
      expect(entry.realIncome).toBeLessThan(entry.avgMonthlyIncome);
    });
  });

  it("handles empty country data without throwing", () => {
    const result = rankCountriesByRealEarnings({}, 3);
    expect(result).toHaveLength(0);
  });

  it("handles zero years without throwing", () => {
    const result = rankCountriesByRealEarnings(testData, 0);
    expect(result).toHaveLength(3);
    // 0-year inflation = 0, so real === nominal
    result.forEach((entry) => {
      expect(entry.realIncome).toBeCloseTo(entry.avgMonthlyIncome, 5);
    });
  });
});
