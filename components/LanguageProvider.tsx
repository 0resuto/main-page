"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, Locale, normalizeLocale, translations } from "../app/i18n";

type LanguageContextValue = {
  locale: Locale;
  t: (typeof translations)[Locale];
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  t: translations[DEFAULT_LOCALE],
});

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    const browserLocale = normalizeLocale(
      navigator.languages?.[0] || navigator.language,
    );

    setLocale(browserLocale);
    document.documentElement.lang = browserLocale;
  }, []);

  const value = useMemo(
    () => ({
      locale,
      t: translations[locale],
    }),
    [locale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
