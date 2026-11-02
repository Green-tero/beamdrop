import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Language, Translations } from './types';
import { en } from './en';
import { fa } from './fa';

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: Translations;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('beamdrop_lang');
    if (saved === 'fa' || saved === 'en') return saved;
    // Default to browser language if Persian
    return navigator.language.startsWith('fa') ? 'fa' : 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('beamdrop_lang', newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'fa' : 'en');
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  const value = useMemo(() => {
    const t = lang === 'fa' ? fa : en;
    const isRTL = lang === 'fa';
    return { lang, setLang, toggleLang, t, isRTL };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
