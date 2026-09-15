'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppLanguage } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  isAmharic: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ater_language') as AppLanguage;
      if (saved === 'en' || saved === 'am') {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    } catch {}
  }, []);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('ater_language', lang);
    } catch {}
  };

  const toggleLanguage = () => {
    const nextLang: AppLanguage = language === 'en' ? 'am' : 'en';
    setLanguage(nextLang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isAmharic: language === 'am',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
