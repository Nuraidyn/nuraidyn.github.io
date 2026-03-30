import { describe, it, expect } from "vitest";
import {
  calcSavings,
  calcSavingsRate,
  calcProjectedIncome,
  calcFinancialStatus,
  getTopCountriesForProfession,
  getIncomeTips,
  getExpenseTips,
  getActionPlan,
} from "../incomeAnalysis";

describe("Income Analysis calculations", () => {
  it("calculates net savings", () => {
    expect(calcSavings(3000, 2000)).toBe(1000);
    expect(calcSavings(2000, 2000)).toBe(0);
    expect(calcSavings(1500, 2000)).toBe(-500);
  });

  it("calculates savings rate", () => {
    expect(calcSavingsRate(4000, 3000)).toBeCloseTo(25, 5);
    expect(calcSavingsRate(3000, 2400)).toBeCloseTo(20, 5);
    expect(calcSavingsRate(3000, 3000)).toBe(0);
  });

  it("handles zero income in savings rate", () => {
    expect(calcSavingsRate(0, 500)).toBe(0);
    expect(calcSavingsRate(-100, 500)).toBe(0);
  });

  it("calculates 1-year projected income with 0% growth", () => {
    expect(calcProjectedIncome(3000, 0, 1)).toBe(3000);
  });

  it("calculates 1-year projected income with positive growth", () => {
    expect(calcProjectedIncome(1000, 10, 1)).toBeCloseTo(1100, 5);
  });

  it("calculates multi-year projected income", () => {
    expect(calcProjectedIncome(1000, 10, 2)).toBeCloseTo(1210, 5);
  });

  it("returns deficit status when expenses exceed income", () => {
    expect(calcFinancialStatus(1500, 2000)).toBe("deficit");
    expect(calcFinancialStatus(0, 100)).toBe("deficit");
  });

  it("returns stable status when savings rate is positive but < 20%", () => {
    expect(calcFinancialStatus(3000, 2500)).toBe("stable"); // 16.7%
    expect(calcFinancialStatus(3000, 2700)).toBe("stable"); // 10%
  });

  it("returns strong status when savings rate is >= 20%", () => {
    expect(calcFinancialStatus(3000, 2400)).toBe("strong"); // exactly 20%
    expect(calcFinancialStatus(5000, 3000)).toBe("strong"); // 40%
  });
});

describe("getTopCountriesForProfession", () => {
  it("returns countries for engineer keyword", () => {
    const result = getTopCountriesForProfession("Software Engineer");
    expect(result).toHaveLength(3);
    expect(result).toContain("USA");
  });

  it("returns countries for doctor keyword", () => {
    const result = getTopCountriesForProfession("doctor");
    expect(result).toContain("Germany");
  });

  it("returns fallback for unknown profession", () => {
    const result = getTopCountriesForProfession("Underwater Basket Weaver");
    expect(result).toHaveLength(3);
    expect(result).toContain("USA");
  });

  it("handles empty string", () => {
    const result = getTopCountriesForProfession("");
    expect(result).toHaveLength(3);
  });
});

describe("getIncomeTips", () => {
  it("returns 3 tips for any savings rate", () => {
    expect(getIncomeTips(-10)).toHaveLength(3);
    expect(getIncomeTips(10)).toHaveLength(3);
    expect(getIncomeTips(30)).toHaveLength(3);
  });
});

describe("getExpenseTips", () => {
  it("returns 3 tips for any savings rate", () => {
    expect(getExpenseTips(-10)).toHaveLength(3);
    expect(getExpenseTips(10)).toHaveLength(3);
    expect(getExpenseTips(30)).toHaveLength(3);
  });
});

describe("getActionPlan", () => {
  it("returns all three milestones", () => {
    const plan = getActionPlan(3000, 2000, 33.3, 3);
    expect(plan).toHaveProperty("month3");
    expect(plan).toHaveProperty("month6");
    expect(plan).toHaveProperty("month12");
    expect(typeof plan.month3).toBe("string");
    expect(typeof plan.month6).toBe("string");
    expect(typeof plan.month12).toBe("string");
  });

  it("returns deficit-specific month3 plan when savings are negative", () => {
    const plan = getActionPlan(1000, 1500, -50, 1);
    expect(plan.month3).toMatch(/deficit|expenses|cut/i);
  });

  it("returns certification goal for low experience", () => {
    const plan = getActionPlan(2000, 1500, 25, 0);
    expect(plan.month12).toMatch(/certif|course|career/i);
  });
});
