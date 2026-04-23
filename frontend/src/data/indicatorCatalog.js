const INDICATOR_CATALOG = {
  "SI.POV.GINI": {
    names: {
      en: "Gini Index",
      ru: "Индекс Джини",
      kz: "Джини индексі",
    },
  },
  "NY.GDP.MKTP.CD": {
    names: {
      en: "GDP (current US$)",
      ru: "ВВП (текущие доллары США)",
      kz: "ЖІӨ (ағымдағы АҚШ доллары)",
    },
  },
  "NY.GDP.PCAP.CD": {
    names: {
      en: "GDP per capita (current US$)",
      ru: "ВВП на душу населения (текущие доллары США)",
      kz: "Жан басына шаққандағы ЖІӨ (ағымдағы АҚШ доллары)",
    },
  },
  "NY.GDP.PCAP.KD.ZG": {
    names: {
      en: "GDP per capita growth (annual %)",
      ru: "Рост ВВП на душу населения (% в год)",
      kz: "Жан басына шаққандағы ЖІӨ өсімі (жылдық %)",
    },
  },
  "FP.CPI.TOTL.ZG": {
    names: {
      en: "Inflation (annual %)",
      ru: "Инфляция (% в год)",
      kz: "Инфляция (жылдық %)",
    },
  },
  "SL.UEM.TOTL.ZS": {
    names: {
      en: "Unemployment rate (%)",
      ru: "Уровень безработицы (%)",
      kz: "Жұмыссыздық деңгейі (%)",
    },
  },
  "SI.POV.DDAY": {
    names: {
      en: "Poverty headcount ($2.15/day)",
      ru: "Доля бедного населения ($2.15/день)",
      kz: "Кедейшілік деңгейі ($2.15/күн)",
    },
  },
  "NE.CON.GOVT.ZS": {
    names: {
      en: "Government consumption (% of GDP)",
      ru: "Государственное потребление (% ВВП)",
      kz: "Мемлекеттік тұтыну (ЖІӨ-нің %)",
    },
  },
  "SI.DST.FRST.20": {
    names: {
      en: "Income share lowest 20%",
      ru: "Доля доходов беднейших 20%",
      kz: "Ең кедей 20%-дың табыс үлесі",
    },
  },
  "SI.DST.05TH.20": {
    names: {
      en: "Income share highest 20%",
      ru: "Доля доходов богатейших 20%",
      kz: "Ең бай 20%-дың табыс үлесі",
    },
  },
};

/**
 * Resolve the display label for an indicator.
 * Fallback chain: catalog[code][lang] → catalog[code].en → apiName → code
 */
export function getIndicatorLabel(code, lang = "en", apiName = "") {
  const entry = INDICATOR_CATALOG[code];
  if (entry) {
    return entry.names[lang] || entry.names.en || apiName || code;
  }
  return apiName || code;
}

export const DEFAULT_INDICATORS = Object.entries(INDICATOR_CATALOG).map(([code, entry]) => ({
  code,
  label: entry.names.en,
}));

export const DEFAULT_COUNTRIES = [
  { code: "KZ", name: "Kazakhstan" },
  { code: "RU", name: "Russia" },
  { code: "US", name: "United States" },
  { code: "CN", name: "China" },
  { code: "DE", name: "Germany" },
  { code: "JP", name: "Japan" },
  { code: "FR", name: "France" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "ZA", name: "South Africa" },
  { code: "AU", name: "Australia" },
];
