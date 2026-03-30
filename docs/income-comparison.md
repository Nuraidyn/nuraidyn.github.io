# Income Comparison Across Countries

## Overview

The Income Comparison section appears on the Income Analysis page after a user submits their financial profile. It benchmarks the user's monthly salary against country averages, adjusts for cumulative inflation, and ranks countries by real earning potential.

Key capabilities:
- KPI cards: salary gap vs local average, inflation over the selected period, real income, best benchmark country
- Interactive bar chart comparing nominal and real income across up to 6 countries
- Period toggle (1Y / 3Y / 5Y)
- Inflation-adjustment toggle (show nominal vs real side-by-side)
- "Show my salary" toggle to add the user's own salary as a bar for context
- Full i18n support (EN / RU / KZ)

---

## Metrics

### Salary Gap (Nominal)

```
salaryGap = userSalary - countryAvgMonthlyIncome
salaryGapPercent = (salaryGap / countryAvgMonthlyIncome) * 100
```

A positive gap means the user earns above the country average. A negative gap means below average.

### Cumulative Inflation

```
cumulativeInflation = ∏(1 + rate_y / 100) - 1
                       for y in [currentYear - N ... currentYear - 1]
```

Where `N` is the selected period in years (1, 3, or 5). If a year's inflation figure is missing from the data, a 3% fallback is used. The result is a decimal, e.g. `0.21` = 21% total inflation over the period.

### Real (Inflation-Adjusted) Income

```
realIncome = nominalIncome / (1 + cumulativeInflation)
```

This converts a nominal income figure into its purchasing-power equivalent at the start of the period, using the country's own inflation history.

### Country Ranking

Countries are ranked by `realIncome` (descending). This surfaces which country offers the highest purchasing-power-adjusted average income over the selected period, regardless of nominal figures.

---

## Data Layer

**Location:** `frontend/src/data/countryIncomeData.js`

The file exports:
- `COUNTRY_INCOME_DATA` — object keyed by ISO 2-letter country code. Each entry has `name`, `avgMonthlyIncome` (USD), `currency`, and `yearlyInflation` (an object of `{ year: percentage }` pairs).
- `COMPARISON_COUNTRIES` — flat array of `{ code, name }` for the dropdown UI.
- `PERIOD_YEARS` — mapping `{ "1Y": 1, "3Y": 3, "5Y": 5 }`.

### Replacing with a Real API

When the backend endpoint is ready:

1. Replace the static `COUNTRY_INCOME_DATA` import in `IncomeComparisonSection.jsx` with a data-fetching hook (e.g. `useCountryIncomeData()`).
2. The hook should call `GET /api/v1/income/countries` (FastAPI) and return the same shape: `{ [code]: { name, avgMonthlyIncome, currency, yearlyInflation } }`.
3. The calculation functions in `incomeAnalysis.js` require no changes — they operate on plain objects.
4. Add a loading/error state to the section while the API call is in flight.

---

## Component

**Location:** `frontend/src/components/income-analysis/IncomeComparisonSection.jsx`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `userSalary` | `number` | Monthly income from the form (USD) |
| `userCountry` | `string` | Country name from the form (matched to country code by name) |

**State:**
| State | Default | Description |
|---|---|---|
| `selectedCountry` | Matched from `userCountry` or `"US"` | Country code for KPI calculations |
| `comparisonCountries` | `["US", "DE", "GB"]` | Country codes shown in the chart |
| `period` | `"3Y"` | Selected period for inflation calculation |
| `adjustInflation` | `true` | Whether to show real income bars alongside nominal |
| `showMyLine` | `true` | Whether to include user's salary as a bar |

---

## Calculation Utilities

All functions are in `frontend/src/utils/incomeAnalysis.js`:

| Function | Purpose |
|---|---|
| `calcSalaryGap(userSalary, countryAvg)` | Nominal difference |
| `calcSalaryGapPercent(userSalary, countryAvg)` | Gap as % of country average |
| `calcCumulativeInflation(yearlyInflation, years)` | Compound inflation over N years |
| `calcRealIncome(nominalIncome, cumulativeInflation)` | Purchasing-power-adjusted income |
| `rankCountriesByRealEarnings(countriesData, years)` | Sorted array by real income |

---

## i18n Keys

All user-visible strings use `t()` from `useI18n()`. Keys are prefixed `comparison.*` and are defined in all three supported locales (EN / RU / KZ) in `frontend/src/context/I18nContext.jsx`.

---

## Currency Notes

All income figures in `COUNTRY_INCOME_DATA` are expressed in **USD equivalents** to make cross-country comparison meaningful. The currency field (e.g. `EUR`, `JPY`) is stored for reference but is not used in calculations. When a real API is wired up, currency conversion (via exchange rates) should be applied server-side before returning `avgMonthlyIncome`.

---

## Future / Production Checklist

- [ ] Wire up `GET /api/v1/income/countries` FastAPI endpoint returning live average incomes
- [ ] Add exchange-rate conversion so `avgMonthlyIncome` is always in a consistent base currency (USD or user-selected)
- [ ] Cache inflation data server-side (IMF / World Bank API)
- [ ] Add error boundary and loading skeleton to the comparison section
- [ ] Consider lazy-loading `IncomeComparisonSection` to reduce initial bundle size (chart.js is ~200 kB gzipped)
- [ ] Add CSV export button for the comparison table (consistent with other platform exports)
