'use client';

import Image from 'next/image';
import Link from 'next/link';
import Container from '@/components/ui/container';
import { Instagram } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useLanguage, useTranslations } from '@/contexts/LanguageContext';
import type { LanguageCode } from '@/contexts/LanguageContext';

const navLinks = [
  { href: '/clinics#solutions', labelKey: 'solutions' },
  { href: '/clinics', labelKey: 'hospitals' },
  { href: '/clinics#why', labelKey: 'why' },
  { href: '/clinics#price', labelKey: 'price' },
  { href: '/clinics#articles', labelKey: 'articles' },
  { href: '/clinics#faq', labelKey: 'faq' },
  { href: '/clinics#team', labelKey: 'team' },
] as const;

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations();
  const { language, setLanguage } = useLanguage();

  const navLabels = t('footer.navigation') as unknown as Record<
    (typeof navLinks)[number]['labelKey'],
    string
  >;
  const contact = t('footer.contact') as unknown as {
    heading: string;
    phone: string;
    email: string;
    address: string;
  };
  const languageOptions = t('languages.options') as unknown as Record<
    LanguageCode,
    { name: string; abbr: string }
  >;
  const languages = (Object.entries(languageOptions || {}) || []) as [
    LanguageCode,
    { name: string; abbr: string },
  ][];

  const selectorDescription =
    (t('footer.languageSelectorDescription') as string) || 'Switch site language';
  const certificationNotice = (t('footer.certificationNotice') as string) || '';

  return (
    <footer className="bg-[#0D1E32] text-white">
      <Container className="flex flex-col gap-8 px-6 py-14 text-center sm:px-8 sm:py-16 lg:gap-12 lg:px-12 lg:py-20 lg:text-left">
        {/* Top grid */}
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] lg:items-start">
          {/* Col 1 */}
          <div className="flex flex-col gap-6 relative items-center lg:items-start">
            <Image
              src="/ista_footer_logo.png"
              alt="IstanbulMedic"
              width={325}
              height={67}
              className="h-[67px] w-[325px] opacity-100"
              priority
            />
            <p className="max-w-md text-base leading-relaxed text-[#EFEFEF]">
              {(t('footer.tagline') as string) || ''}
            </p>
            <div className="flex">
              <Image
                src="/certificate_footer.png"
                alt="International Health Tourism Authorization Certificate"
                width={360}
                height={260}
                className="h-auto w-full max-w-[240px] border border-white/10 object-contain"
              />
            </div>
          </div>

          {/* Col 2 - Navigation */}
          <div className="flex flex-col gap-3 text-base text-[#EFEFEF] items-center lg:items-start">
            {navLinks.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                className={`transition text-center lg:text-left hover:text-white ${
                  pathname === href ? 'font-semibold text-[#3EBBB7]' : ''
                }`}
              >
                {navLabels?.[labelKey] ?? labelKey}
              </Link>
            ))}
          </div>

          {/* Col 3 - Contact */}
          <div className="flex flex-col gap-6 text-base text-[#EFEFEF] items-center lg:items-start">
            <h3 className="text-lg font-semibold text-white">{contact?.heading}</h3>
            <div>
              <a
                href={`mailto:${contact?.email ?? ''}`}
                className="block transition text-center lg:text-left hover:text-white"
              >
                {contact?.email}
              </a>
              <p className="max-w-xs leading-relaxed">{contact?.address}</p>
            </div>
            <a
              href="https://www.instagram.com/istanbulmedic"
              aria-label={(t('footer.instagramAria') as string) || 'IstanbulMedic on Instagram'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-[#EFEFEF] transition hover:text-white/80 lg:justify-start"
            >
              <Instagram className="size-7" aria-hidden />
            </a>
          </div>

          {/* Col 4 - Languages */}
          <div className="flex flex-col gap-4 text-base text-white/80 items-center lg:items-start">
            <h3 className="text-lg font-semibold text-[#EFEFEF]">
              {(t('languages.label') as string) || 'Languages'}
            </h3>
            <div
              className="flex flex-wrap justify-center gap-4 text-center text-lg uppercase lg:justify-start lg:text-left"
              role="group"
              aria-label={selectorDescription}
            >
              {languages.map(([code, { abbr, name }]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  aria-pressed={language === code}
                  aria-label={`${selectorDescription}: ${name}`}
                  className={`cursor-pointer transition ${
                    language === code
                      ? 'font-semibold text-[#3EBBB7]'
                      : 'text-[#EFEFEF] hover:text-white'
                  }`}
                >
                  {abbr}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full space-y-3 text-center text-sm leading-relaxed text-[#C6C3C3] md:max-w-3xl">
          <p>{certificationNotice}</p>
          <p>{(t('footer.copyright') as string) || ''}</p>
        </div>
      </Container>
    </footer>
  );
}
