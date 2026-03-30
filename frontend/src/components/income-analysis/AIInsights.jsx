import React, { useState } from "react";
import { useI18n } from "../../context/I18nContext";
import {
  calcSavingsRate,
  getTopCountriesForProfession,
  getIncomeTips,
  getExpenseTips,
  getActionPlan,
} from "../../utils/incomeAnalysis";

function TipList({ items }) {
  return (
    <ul className="space-y-1.5 mt-2">
      {items.map((tip, idx) => (
        <li key={idx} className="flex items-start gap-2 text-sm text-muted">
          <span className="mt-0.5 shrink-0 text-[var(--accent)]">›</span>
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  );
}

function CountryPill({ name }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
      bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]
      text-[color-mix(in_srgb,var(--accent)_90%,var(--text))]
      border border-[color-mix(in_srgb,var(--accent)_28%,transparent)]">
      {name}
    </span>
  );
}

export default function AIInsights({ formData }) {
  const { t } = useI18n();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  function generate() {
    setLoading(true);
    // Simulate async generation with a short delay
    setTimeout(() => {
      const { profession, monthlyIncome, monthlyExpenses, experienceYears } = formData;
      const savingsRate = calcSavingsRate(monthlyIncome, monthlyExpenses);
      const topCountries = getTopCountriesForProfession(profession);
      const incomeTips = getIncomeTips(savingsRate);
      const expenseTips = getExpenseTips(savingsRate);
      const actionPlan = getActionPlan(monthlyIncome, monthlyExpenses, savingsRate, experienceYears);
      setInsights({ topCountries, incomeTips, expenseTips, actionPlan });
      setLoading(false);
    }, 800);
  }

  return (
    <div className="panel-wide space-y-5">
      <div>
        <span className="page-section-kicker">{t("incomeAnalysis.aiTitle")}</span>
        <p className="text-xs text-muted mt-1">{t("incomeAnalysis.aiSubtitle")}</p>
      </div>

      {!insights && !loading && (
        <button
          type="button"
          className="btn-primary"
          onClick={generate}
        >
          {t("incomeAnalysis.generateInsights")}
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-sm text-muted" aria-live="polite" aria-busy="true">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {t("incomeAnalysis.generating")}
        </div>
      )}

      {insights && (
        <div className="space-y-6">
          {/* Top Countries */}
          <div>
            <p className="label mb-2">{t("incomeAnalysis.topCountries")}</p>
            <div className="flex flex-wrap gap-2">
              {insights.topCountries.map((c) => <CountryPill key={c} name={c} />)}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Income Tips */}
            <div>
              <p className="label">{t("incomeAnalysis.incomeTips")}</p>
              <TipList items={insights.incomeTips} />
            </div>

            {/* Expense Tips */}
            <div>
              <p className="label">{t("incomeAnalysis.expenseTips")}</p>
              <TipList items={insights.expenseTips} />
            </div>
          </div>

          {/* Action Plan */}
          <div>
            <p className="label mb-3">{t("incomeAnalysis.actionPlan")}</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { key: "month3", label: t("incomeAnalysis.month3"), goal: insights.actionPlan.month3 },
                { key: "month6", label: t("incomeAnalysis.month6"), goal: insights.actionPlan.month6 },
                { key: "month12", label: t("incomeAnalysis.month12"), goal: insights.actionPlan.month12 },
              ].map(({ key, label, goal }) => (
                <div key={key} className="panel space-y-2">
                  <p className="text-xs uppercase tracking-widest text-faint font-semibold">{label}</p>
                  <p className="text-sm text-muted leading-relaxed">{goal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regenerate button */}
          <button
            type="button"
            className="btn-secondary text-xs py-1.5 px-4"
            onClick={generate}
          >
            {t("incomeAnalysis.generateInsights")}
          </button>
        </div>
      )}
    </div>
  );
}
