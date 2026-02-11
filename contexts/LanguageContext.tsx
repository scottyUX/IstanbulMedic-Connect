'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// Minimal translations for the landing page header
const translationsData = {
  en: {
    languages: {
      label: 'Languages',
    },
    common: {
      ctas: {
        bookConsultation: 'Book Your Consultation',
        chatWhatsapp: 'Chat on WhatsApp',
      },
    },
    navigation: {
      header: {
        solutions: 'Solutions',
        why: 'Why',
        hospitals: 'Hospitals',
        price: 'Prices',
        articles: 'Articles',
        faq: 'FAQs',
        team: 'Team',
      },
    },
  },
  de: {
    languages: {
      label: 'Sprachen',
    },
    common: {
      ctas: {
        bookConsultation: 'Beratung Buchen',
        chatWhatsapp: 'Chat auf WhatsApp',
      },
    },
    navigation: {
      header: {
        solutions: 'Lösungen',
        why: 'Warum',
        hospitals: 'Kliniken',
        price: 'Preise',
        articles: 'Artikel',
        faq: 'FAQs',
        team: 'Team',
      },
    },
  },
  tr: {
    languages: {
      label: 'Diller',
    },
    common: {
      ctas: {
        bookConsultation: 'Danışmanlık Alın',
        chatWhatsapp: 'WhatsApp Sohbeti',
      },
    },
    navigation: {
      header: {
        solutions: 'Çözümler',
        why: 'Neden',
        hospitals: 'Hastaneler',
        price: 'Fiyatlar',
        articles: 'Makaleler',
        faq: 'SSS',
        team: 'Ekip',
      },
    },
  },
};

type Translations = typeof translationsData;
type LanguageCode = keyof Translations;

// Simplified type for deep nested access
type TranslateFn = (path: string) => string;

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: TranslateFn;
};

const DEFAULT_LANGUAGE: LanguageCode = 'en';
export const AVAILABLE_LANGUAGES = Object.keys(translationsData) as LanguageCode[];
const STORAGE_KEY = 'istanbulmedic.language';

function isLanguageCode(value: string): value is LanguageCode {
  return AVAILABLE_LANGUAGES.includes(value as LanguageCode);
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getNestedValue(language: LanguageCode, path: string): string | undefined {
  const segments = path.split('.');
  let current: any = translationsData[language];

  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in current) {
      current = current[segment];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageCode] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  // Load persisted language on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isLanguageCode(stored) && stored !== language) {
      setLanguageCode(stored);
    }
  }, []); 

  // Persist whenever language changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const translate = useCallback(
    (path: string): string => {
      const directValue = getNestedValue(language, path);
      if (directValue !== undefined) return directValue;

      const fallbackValue = getNestedValue(DEFAULT_LANGUAGE, path);
      if (fallbackValue !== undefined) return fallbackValue;

      return path; // Return key if missing
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (code: LanguageCode) => {
        if (AVAILABLE_LANGUAGES.includes(code)) {
          setLanguageCode(code);
        }
      },
      t: translate,
    }),
    [language, translate],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return { language: context.language, setLanguage: context.setLanguage };
}

export function useTranslations() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslations must be used within LanguageProvider');
  }
  return context.t;
}

export type { LanguageCode };
