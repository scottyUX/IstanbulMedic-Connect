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

// Minimal translations for the landing page header and footer
const translationsData = {
  en: {
    languages: {
      label: 'Languages',
      options: {
        en: { name: 'English', abbr: 'En' },
        de: { name: 'German', abbr: 'De' },
        tr: { name: 'Turkish', abbr: 'Tr' },
      },
    },
    footer: {
      tagline: 'A trusted partner for hair transplant in Istanbul with AI-powered support and multilingual care.',
      navigation: {
        solutions: 'Solutions',
        why: 'Why',
        hospitals: 'Hospitals',
        price: 'Prices',
        articles: 'Articles',
        faq: 'FAQs',
        team: 'Team',
      },
      contact: {
        heading: 'Contact Us',
        phone: '+44 772 828 9170',
        email: 'info@istanbulmedic.com',
        address: 'Caferaga Mahallesi, Moda Caddesi, No:108, Daire:14, 34710 Kadikoy/Istanbul',
      },
      instagramAria: 'IstanbulMedic on Instagram',
      languageSelectorDescription: 'Switch site language',
      certificationNotice: 'IstanbulMedic is a registered trademark of OGO Turizm ve Seyahat Ltd. Şti. OGO Turizm is a licensed travel agency, registered with the Association of Turkish Travel Agencies (TÜRSAB) under license number 7282 with a title name of ONOSGA Turizm ve Seyahat Acentası.',
      copyright: 'Copyright © 2025 IstanbulMedic. IstanbulMedic is a trademark of OGO Turizm ve Seyahat Ltd Sti.',
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
      options: {
        en: { name: 'İngilizce', abbr: 'En' },
        de: { name: 'Almanca', abbr: 'De' },
        tr: { name: 'Türkçe', abbr: 'Tr' },
      },
    },
    footer: {
      tagline: 'Yapay zeka destekli ve çok dilli bakım ile İstanbul\'da saç ekimi için güvenilir bir ortak.',
      navigation: {
        solutions: 'Çözümler',
        why: 'Neden',
        hospitals: 'Hastaneler',
        price: 'Fiyatlar',
        articles: 'Makaleler',
        faq: 'SSS',
        team: 'Ekip',
      },
      contact: {
        heading: 'İletişim',
        phone: '+44 772 828 9170',
        email: 'info@istanbulmedic.com',
        address: 'Caferaga Mahallesi, Moda Caddesi, No:108, Daire:14, 34710 Kadikoy/İstanbul',
      },
      instagramAria: 'Instagram\'da IstanbulMedic',
      languageSelectorDescription: 'Dil değiştir',
      certificationNotice: 'IstanbulMedic, OGO Turizm ve Seyahat Ltd. Şti.\'nin tescilli markasıdır. OGO Turizm, Türkiye Seyahat Acentaları Birliği (TÜRSAB) bünyesinde 7282 lisans numarası ile ONOSGA Turizm ve Seyahat Acentası unvanıyla kayıtlı lisanslı bir seyahat acentesidir.',
      copyright: 'Telif Hakkı © 2025 IstanbulMedic. IstanbulMedic, OGO Turizm ve Seyahat Ltd Sti. markasıdır.',
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

function getNestedValue(language: LanguageCode, path: string): string | Record<string, unknown> | undefined {
  const segments = path.split('.');
  let current: unknown = translationsData[language];

  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in (current as object)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' || (typeof current === 'object' && current !== null) ? current as string | Record<string, unknown> : undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageCode] = useState<LanguageCode>(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && isLanguageCode(stored) ? stored : DEFAULT_LANGUAGE;
  });

  // Persist whenever language changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const translate = useCallback(
    (path: string): string | Record<string, unknown> => {
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
