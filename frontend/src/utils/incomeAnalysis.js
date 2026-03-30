/**
 * Income Analysis — pure calculation utilities.
 * All functions are side-effect-free and work on plain numbers.
 */

/**
 * Net monthly savings (income minus expenses).
 * @param {number} income
 * @param {number} expenses
 * @returns {number}
 */
export function calcSavings(income, expenses) {
  return income - expenses;
}

/**
 * Savings rate as a percentage of income.
 * Returns 0 when income is zero or negative to avoid division by zero.
 * @param {number} income
 * @param {number} expenses
 * @returns {number} percentage 0-100 (can be negative if expenses > income)
 */
export function calcSavingsRate(income, expenses) {
  if (income <= 0) return 0;
  return ((income - expenses) / income) * 100;
}

/**
 * Compound-growth projected income after `years` years.
 * @param {number} income  - current monthly income
 * @param {number} growthPct - annual growth percentage (e.g. 5 for 5%)
 * @param {number} [years=1]
 * @returns {number}
 */
export function calcProjectedIncome(income, growthPct, years = 1) {
  return income * Math.pow(1 + growthPct / 100, years);
}

/**
 * Qualitative financial status label.
 * - "deficit"  — expenses exceed income
 * - "stable"   — savings rate < 20%
 * - "strong"   — savings rate >= 20%
 * @param {number} income
 * @param {number} expenses
 * @returns {"deficit"|"stable"|"strong"}
 */
export function calcFinancialStatus(income, expenses) {
  const savings = calcSavings(income, expenses);
  const rate = calcSavingsRate(income, expenses);
  if (savings < 0) return "deficit";
  if (rate < 20) return "stable";
  return "strong";
}

/* ── Static AI insight helpers ───────────────────────────── */

/** Profession keyword → top 3 recommended countries */
const PROFESSION_COUNTRIES = {
  engineer:    ["USA", "Germany", "Canada"],
  developer:   ["USA", "Germany", "Canada"],
  software:    ["USA", "Germany", "Netherlands"],
  doctor:      ["Germany", "Switzerland", "Australia"],
  nurse:       ["Germany", "UK", "Australia"],
  teacher:     ["Finland", "Germany", "Canada"],
  lawyer:      ["USA", "UK", "Germany"],
  accountant:  ["USA", "UK", "Australia"],
  designer:    ["USA", "Netherlands", "UK"],
  data:        ["USA", "UK", "Germany"],
  analyst:     ["USA", "UK", "Germany"],
  manager:     ["USA", "UK", "Switzerland"],
  finance:     ["USA", "UK", "Switzerland"],
  marketing:   ["USA", "UK", "Australia"],
  architect:   ["USA", "Germany", "Netherlands"],
  scientist:   ["USA", "Germany", "Switzerland"],
};

/**
 * Returns top 3 countries for a given profession string.
 * Falls back to a generic list if no keyword matches.
 * @param {string} profession
 * @returns {string[]}
 */
export function getTopCountriesForProfession(profession) {
  const lower = (profession || "").toLowerCase();
  for (const [keyword, countries] of Object.entries(PROFESSION_COUNTRIES)) {
    if (lower.includes(keyword)) return countries;
  }
  return ["USA", "Germany", "Canada"];
}

/**
 * Income growth tips based on savings rate.
 * @param {number} savingsRate
 * @returns {string[]}
 */
export function getIncomeTips(savingsRate) {
  if (savingsRate < 0) {
    return [
      "Prioritize cutting non-essential expenses before seeking more income.",
      "Consider freelance or part-time work to bridge the monthly gap.",
      "Build a 1-month emergency buffer as the first financial milestone.",
    ];
  }
  if (savingsRate < 20) {
    return [
      "Aim to increase income by 10-15% through skill development or a new role.",
      "Negotiate a salary review — present market data for your profession.",
      "Explore side income streams aligned with your existing expertise.",
    ];
  }
  return [
    "Your savings rate is solid. Consider investing the surplus to grow wealth.",
    "Explore tax-advantaged accounts (pension, ISA/IRA) to compound gains.",
    "Evaluate passive income opportunities: dividends, real estate, or bonds.",
  ];
}

/**
 * Expense optimization tips based on savings rate.
 * @param {number} savingsRate
 * @returns {string[]}
 */
export function getExpenseTips(savingsRate) {
  if (savingsRate < 0) {
    return [
      "Apply the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
      "Audit subscriptions and recurring services — cancel unused ones.",
      "Cook at home more often; food spending is often the fastest to cut.",
    ];
  }
  if (savingsRate < 20) {
    return [
      "Track spending in 3 categories: fixed, variable, and discretionary.",
      "Reduce discretionary spending by 10% this month as a baseline test.",
      "Batch major purchases to leverage discounts and reduce impulse buying.",
    ];
  }
  return [
    "Expenses look healthy. Focus optimization on high-return investments.",
    "Review insurance and utilities annually — renegotiate or switch providers.",
    "Automate transfers to savings on payday to maintain discipline.",
  ];
}

/**
 * 3/6/12-month action plan goals.
 * @param {number} income
 * @param {number} expenses
 * @param {number} savingsRate
 * @param {number} experienceYears
 * @returns {{ month3: string, month6: string, month12: string }}
 */
export function getActionPlan(income, expenses, savingsRate, experienceYears) {
  const savings = calcSavings(income, expenses);
  const emergency = Math.max(income * 3, 0);

  const plan3 = savings < 0
    ? "Reduce monthly expenses by at least the deficit amount to break even."
    : `Build a 1-month emergency fund: save ${savings.toFixed(0)} ${savings > 0 ? "consistently" : "starting now"}.`;

  const plan6 = savingsRate < 20
    ? `Reach a 20% savings rate (target: ${(income * 0.2).toFixed(0)}/month) and identify one income growth action.`
    : `Reach a 3-month emergency reserve of ~${emergency.toFixed(0)} and start a recurring investment.`;

  const plan12 = experienceYears >= 2
    ? "Target a 10-15% income increase through promotion, job change, or freelance work."
    : "Complete one relevant certification or course to accelerate career progression.";

  return { month3: plan3, month6: plan6, month12: plan12 };
}

// ── Income Comparison calculations ──────────────────────────────────────────

/** Nominal salary gap vs country average */
export function calcSalaryGap(userSalary, countryAvg) {
  return userSalary - countryAvg;
}

/** Salary gap as percentage of country average */
export function calcSalaryGapPercent(userSalary, countryAvg) {
  if (countryAvg <= 0) return 0;
  return ((userSalary - countryAvg) / countryAvg) * 100;
}

/**
 * Cumulative inflation over N years ending at currentYear.
 * yearlyInflation: { [year]: pct }  e.g. { 2022: 8.0, 2023: 4.1 }
 */
export function calcCumulativeInflation(yearlyInflation, years) {
  const currentYear = new Date().getFullYear();
  let cumulative = 1;
  for (let y = currentYear - years; y < currentYear; y++) {
    const rate = (yearlyInflation[y] ?? 3) / 100; // fallback 3%
    cumulative *= (1 + rate);
  }
  return cumulative - 1; // e.g. 0.15 = 15%
}

/** Inflation-adjusted (real) income */
export function calcRealIncome(nominalIncome, cumulativeInflation) {
  return nominalIncome / (1 + cumulativeInflation);
}

/**
 * Rank countries by real earning potential:
 * score = avgMonthlyIncome / (1 + cumulativeInflation)
 */
export function rankCountriesByRealEarnings(countriesData, years) {
  return Object.entries(countriesData)
    .map(([code, d]) => {
      const cumInfl = calcCumulativeInflation(d.yearlyInflation, years);
      const realIncome = calcRealIncome(d.avgMonthlyIncome, cumInfl);
      return { code, name: d.name, realIncome, cumInfl, avgMonthlyIncome: d.avgMonthlyIncome };
    })
    .sort((a, b) => b.realIncome - a.realIncome);
}
