/**
 * IncomeAnalysisPage — personal income & savings analysis:
 *   1. Hero context
 *   2. Input form (8 fields)
 *   3. Result summary cards (shown after first submit)
 *   4. AI Insights block (on-demand generation)
 */
import React, { useState } from "react";

import { useI18n } from "../context/I18nContext";
import IncomeForm from "../components/income-analysis/IncomeForm";
import ResultSummary from "../components/income-analysis/ResultSummary";
import AIInsights from "../components/income-analysis/AIInsights";
import {
  calcSavings,
  calcSavingsRate,
  calcProjectedIncome,
  calcFinancialStatus,
} from "../utils/incomeAnalysis";

export default function IncomeAnalysisPage() {
  const { t } = useI18n();
  const [results, setResults] = useState(null);
  const [formData, setFormData] = useState(null);

  function handleSubmit(data) {
    const netSavings = calcSavings(data.monthlyIncome, data.monthlyExpenses);
    const savingsRate = calcSavingsRate(data.monthlyIncome, data.monthlyExpenses);
    const projectedIncome = calcProjectedIncome(data.monthlyIncome, data.growthPct, 1);
    const financialStatus = calcFinancialStatus(data.monthlyIncome, data.monthlyExpenses);

    setFormData(data);
    setResults({
      netSavings,
      savingsRate,
      projectedIncome,
      financialStatus,
      currency: data.currency,
    });
  }

  return (
    <>
      {/* ══ 1. HERO ══════════════════════════════════════════ */}
      <section className="hero">
        <div>
          <p className="hero-kicker">{t("incomeAnalysis.heroKicker")}</p>
          <h2 className="hero-title">{t("incomeAnalysis.heroTitle")}</h2>
          <p className="hero-subtitle">{t("incomeAnalysis.heroSubtitle")}</p>
        </div>
        <div className="hero-card">
          <h3 className="panel-title">{t("incomeAnalysis.notesTitle")}</h3>
          <ul className="text-xs text-muted space-y-2 mt-2">
            <li>{t("incomeAnalysis.note1")}</li>
            <li>{t("incomeAnalysis.note2")}</li>
          </ul>
        </div>
      </section>

      <div className="section-divider" aria-hidden="true" />

      {/* ══ 2. FORM + RESULTS ════════════════════════════════ */}
      <section className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <IncomeForm onSubmit={handleSubmit} />

          {results ? (
            <ResultSummary data={results} />
          ) : (
            <div className="panel flex items-center justify-center min-h-[14rem]">
              <p className="text-sm text-muted text-center px-4">
                {t("incomeAnalysis.emptyState")}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══ 3. AI INSIGHTS ═══════════════════════════════════ */}
      {results && formData && (
        <>
          <div className="section-divider" aria-hidden="true" />
          <AIInsights formData={formData} />
        </>
      )}
    </>
  );
}
