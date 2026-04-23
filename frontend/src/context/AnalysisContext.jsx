import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { listCountries, listIndicators } from "../api/analyticsApi";
import { DEFAULT_COUNTRIES, DEFAULT_INDICATORS, getIndicatorLabel } from "../data/indicatorCatalog";
import { useI18n } from "./I18nContext";

const AnalysisContext = createContext(null);
const MIN_ANALYSIS_YEAR = 1990;

/* ── locale map: app lang code → BCP-47 for Intl APIs ── */
const LOCALE_MAP = { en: "en", ru: "ru", kz: "kk" };

/**
 * Resolve a country's display name in the given language.
 * Uses Intl.DisplayNames (browser-native, covers all ISO 3166-1 alpha-2 codes).
 * WB aggregate codes (EUU, WLD, OED, HIC, ECS …) are 3-letter and not in
 * ISO 3166 — Intl returns the code unchanged, so we fall back to the English
 * DB name in that case.
 */
function localizeCountryName(code, apiName, language) {
  const locale = LOCALE_MAP[language] || language;
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    const displayName = dn.of(code);
    return displayName === code ? (apiName || code) : displayName;
  } catch {
    return apiName || code;
  }
}

function buildLocalizedCountries(rawCountries, language) {
  return rawCountries.map((item) => ({
    ...item,
    name: localizeCountryName(item.code, item.name, language),
  }));
}

function buildLocalizedIndicators(rawIndicators, language) {
  return rawIndicators.map((item) => ({
    ...item,
    label: getIndicatorLabel(item.code, language, item.label || item.name || item.code),
  }));
}

export function AnalysisProvider({ children }) {
  const { language } = useI18n();
  const currentYear = new Date().getFullYear();
  const maxAnalysisYear = Math.max(MIN_ANALYSIS_YEAR, currentYear - 1);

  const clampYear = useCallback((value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return MIN_ANALYSIS_YEAR;
    const integer = Math.trunc(numeric);
    return Math.min(maxAnalysisYear, Math.max(MIN_ANALYSIS_YEAR, integer));
  }, [maxAnalysisYear]);

  /* Raw catalog data — always stored in English (source of truth) */
  const [countriesRaw, setCountriesRaw] = useState(DEFAULT_COUNTRIES);
  const [indicatorsRaw, setIndicatorsRaw] = useState(DEFAULT_INDICATORS);
  const [catalogStatus, setCatalogStatus] = useState({ loading: true, error: "" });

  /* Localized views — recomputed whenever language or raw data changes */
  const countries = useMemo(
    () => buildLocalizedCountries(countriesRaw, language),
    [countriesRaw, language],
  );
  const indicators = useMemo(
    () => buildLocalizedIndicators(indicatorsRaw, language),
    [indicatorsRaw, language],
  );

  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [chartType, setChartType] = useState("line");
  const [startYear, setStartYearState] = useState(
    clampYear(Math.max(MIN_ANALYSIS_YEAR, currentYear - 20)),
  );
  const [endYear, setEndYearState] = useState(maxAnalysisYear);

  const setStartYear = useCallback((value) => setStartYearState(clampYear(value)), [clampYear]);
  const setEndYear = useCallback((value) => setEndYearState(clampYear(value)), [clampYear]);

  const loadCatalog = useCallback(async () => {
    setCatalogStatus({ loading: true, error: "" });
    try {
      const [countriesData, indicatorData] = await Promise.all([listCountries(), listIndicators()]);
      if (Array.isArray(countriesData) && countriesData.length) {
        setCountriesRaw(countriesData);
      }
      if (Array.isArray(indicatorData) && indicatorData.length) {
        /* Merge API indicators into raw store (keyed by code) */
        const mapped = indicatorData.map((item) => ({
          code: item.code,
          label: item.name || item.code,
        }));
        setIndicatorsRaw((prev) => {
          const merged = new Map(prev.map((entry) => [entry.code, entry]));
          mapped.forEach((entry) => merged.set(entry.code, entry));
          return Array.from(merged.values());
        });
      }
      setCatalogStatus({ loading: false, error: "" });
    } catch {
      setCatalogStatus({ loading: false, error: "Catalog service is unavailable. Using default lists." });
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const presetPayload = useMemo(
    () => ({ selectedCountries, selectedIndicators, chartType, startYear, endYear }),
    [selectedCountries, selectedIndicators, chartType, startYear, endYear],
  );

  const applyPresetPayload = useCallback((payload) => {
    if (!payload || typeof payload !== "object") return;
    if (Array.isArray(payload.selectedCountries)) setSelectedCountries(payload.selectedCountries);
    if (Array.isArray(payload.selectedIndicators)) setSelectedIndicators(payload.selectedIndicators);
    if (typeof payload.chartType === "string") setChartType(payload.chartType);
    const nextStart = typeof payload.startYear === "number" ? clampYear(payload.startYear) : startYear;
    const nextEnd = typeof payload.endYear === "number" ? clampYear(payload.endYear) : endYear;
    if (nextStart <= nextEnd) {
      setStartYear(nextStart);
      setEndYear(nextEnd);
    } else {
      setStartYear(nextEnd);
      setEndYear(nextStart);
    }
  }, [clampYear, endYear, setEndYear, setStartYear, startYear]);

  const value = useMemo(
    () => ({
      countries,
      indicators,
      catalogStatus,
      selectedCountries,
      setSelectedCountries,
      selectedIndicators,
      setSelectedIndicators,
      chartType,
      setChartType,
      startYear,
      setStartYear,
      endYear,
      setEndYear,
      minAnalysisYear: MIN_ANALYSIS_YEAR,
      maxAnalysisYear,
      presetPayload,
      applyPresetPayload,
      reloadCatalog: loadCatalog,
    }),
    [
      countries,
      indicators,
      catalogStatus,
      selectedCountries,
      selectedIndicators,
      chartType,
      startYear,
      endYear,
      maxAnalysisYear,
      presetPayload,
      applyPresetPayload,
      loadCatalog,
    ],
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}

export default AnalysisContext;
