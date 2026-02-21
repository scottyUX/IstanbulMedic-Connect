'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Container from '@/components/ui/container';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { CONSULTATION_LINK } from '@/lib/constants';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useTranslations } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/common/LanguageSelector';

interface HeaderProps {
    forceMobileNav?: boolean;
}

export default function Header({ forceMobileNav = false }: HeaderProps) {
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const pathname = usePathname();
    const t = useTranslations();

    // Use type assertion to handle the translation structure
    const navLabels = (t('navigation.header') as unknown) as Record<string, string>;

    const navItems = useMemo(
        () => [
            { label: navLabels?.solutions || 'Solutions', href: '/solutions' },
            { label: navLabels?.hospitals || 'Hospitals', href: '/hospitals' },
            { label: navLabels?.why || 'Why', href: '/why' },
            { label: navLabels?.price || 'Prices', href: '/price' },
            { label: navLabels?.articles || 'Articles', href: '/articles' },
            { label: navLabels?.faq || 'FAQs', href: '/faq' },
            { label: navLabels?.team || 'Team', href: '/team' },
        ],
        [navLabels],
    );

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        if (open) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!open) return;
            const el = panelRef.current;
            if (el && !el.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;

        const setHeaderHeight = () => {
            const height = el.offsetHeight || 80;
            document.documentElement.style.setProperty('--header-height', `${height}px`);
        };

        setHeaderHeight();

        const resizeObserver =
            typeof ResizeObserver !== 'undefined' ? new ResizeObserver(setHeaderHeight) : null;
        resizeObserver?.observe(el);
        window.addEventListener('resize', setHeaderHeight);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', setHeaderHeight);
        };
    }, []);

    return (
        <header
            ref={headerRef}
            className="fixed inset-x-0 top-0 z-[70] flex h-[80px] items-center bg-white"
        >
            <Container className="flex h-full items-center justify-between gap-6">
                <Logo onClick={() => setOpen(false)} />

                {/* Desktop nav */}
                <nav className={`hidden items-center gap-1 ${forceMobileNav ? '' : 'md:flex'}`}>
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href || (item.href !== '/' && pathname?.startsWith(`${item.href}`));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rounded-full px-4 py-2 text-sm transition-transform duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102544] transform origin-center ${isActive
                                    ? 'scale-105 font-extrabold text-[#0D1E32]'
                                    : 'font-semibold text-slate-600 hover:text-[#0D1E32]'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className={`hidden items-center gap-4 ${forceMobileNav ? '' : 'md:flex'}`}>
                    <LanguageSelector />
                    <Button
                        variant="teal-primary"
                        href={CONSULTATION_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {String(t('common.ctas.bookConsultation') ?? '')}
                    </Button>
                </div>

                {/* Mobile toggle + panel */}
                <div className={`flex items-center gap-3 ${forceMobileNav ? '' : 'md:hidden'}`}>
                    <LanguageSelector align="left" size="sm" />
                    <div className="relative">
                        <button
                            type="button"
                            aria-label="Toggle menu"
                            aria-haspopup="true"
                            aria-expanded={open}
                            onClick={() => setOpen((prev) => !prev)}
                            className="relative z-[51] -mr-1 grid h-10 w-10 place-items-center rounded-md active:scale-95"
                        >
                            <Menu />
                        </button>

                        <AnimatePresence>
                            {open && (
                                <>
                                    {/* backdrop */}
                                    <motion.button
                                        type="button"
                                        aria-label="Close menu"
                                        className={`fixed inset-0 z-40 bg-black/10 ${forceMobileNav ? '' : 'md:hidden'}`}
                                        onClick={() => setOpen(false)}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                    />

                                    {/* panel */}
                                    <motion.div
                                        ref={panelRef}
                                        role="dialog"
                                        aria-modal="true"
                                        className="absolute -right-3 z-50 mt-3 w-[calc(100vw-2rem)] max-w-xs rounded-[8px] border border-black/5 bg-white px-5 py-5 shadow-[0px_5px_5px_-3px_#00000033,0px_8px_10px_1px_#00000024,0px_3px_14px_2px_#0000001F]"
                                        initial={{ opacity: 0, y: -12, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -12, scale: 0.95 }}
                                        transition={{ duration: 0.22, ease: 'easeOut' }}
                                    >
                                        <nav className="space-y-6">
                                            {navItems.map((item) => {
                                                const isActive =
                                                    pathname === item.href ||
                                                    (item.href !== '/' && pathname?.startsWith(`${item.href}`));

                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        className={`block rounded-2xl px-4 py-3 im-text-body-lg leading-6 transition-transform duration-200 transform origin-left ${isActive
                                                            ? 'scale-[1.03] font-extrabold text-[#0D1E32]'
                                                            : 'font-semibold text-[#0F2446] hover:text-[#0D1E32]'
                                                            }`}
                                                        onClick={() => setOpen(false)}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                );
                                            })}

                                            <Button
                                                variant="teal-secondary"
                                                href={CONSULTATION_LINK}
                                                onClick={() => setOpen(false)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full shadow-[0_12px_30px_rgba(49,194,181,0.35)]"
                                            >
                                                {String(t('common.ctas.bookConsultation') ?? '')}
                                            </Button>
                                        </nav>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </Container>
        </header>
    );
}
