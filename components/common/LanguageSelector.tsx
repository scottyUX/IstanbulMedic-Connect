'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { AVAILABLE_LANGUAGES, type LanguageCode, useLanguage } from '@/contexts/LanguageContext';
import clsx from 'clsx';

type LanguageSelectorProps = {
  align?: 'left' | 'right';
  size?: 'md' | 'sm';
  className?: string;
};

const MENU_SHADOW =
  'shadow-[0px_5px_5px_-3px_#00000033,0px_8px_10px_1px_#00000024,0px_3px_14px_2px_#0000001F]';

export default function LanguageSelector({
  align = 'right',
  size = 'md',
  className,
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const labels = useMemo(
    () =>
      AVAILABLE_LANGUAGES.reduce<Record<LanguageCode, string>>(
        (acc, code) => {
          acc[code] = code.toUpperCase() as string;
          return acc;
        },
        {} as Record<LanguageCode, string>,
      ),
    [],
  );

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const buttonPadding = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-1.5 text-base';

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          'flex items-center gap-2 rounded-[20px] border border-[var(--Navy-500,#17375B)]  font-semibold uppercase text-[#17375B] transition-colors hover:bg-[var(--Teal-50,#ECF8F8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17375B]',
          buttonPadding,
        )}
      >
        <span className="text-sm font-semibold">{labels[language]}</span>
        <ChevronDown
          className={clsx('h-4 w-4 transition-transform', open && 'rotate-180')}
          strokeWidth={2.5}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-activedescendant={`language-option-${language}`}
            className={clsx(
              'absolute top-[calc(100%+8px)] z-50 min-w-[120px] overflow-hidden rounded-[20px] border border-white/60 bg-white  text-sm text-[#17375B]',
              MENU_SHADOW,
              align === 'right' ? 'right-0' : 'left-0',
            )}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {AVAILABLE_LANGUAGES.map((code) => (
              <li key={code}>
                <button
                  id={`language-option-${code}`}
                  role="option"
                  type="button"
                  aria-selected={language === code}
                  onClick={() => {
                    setLanguage(code);
                    setOpen(false);
                  }}
                  className={clsx(
                    'text-sm flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-base transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17375B]',
                    language === code
                      ? 'bg-[var(--Teal-100,#C3EAE9)] font-semibold'
                      : 'hover:bg-[var(--Teal-50,#ECF8F8)]',
                  )}
                >
                  {labels[code]}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
