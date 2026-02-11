'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ButtonProps = {
    variant?: 'primary' | 'outline' | 'secondary';
    href?: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    target?: string;
    rel?: string;
};

export default function PageButton({
    variant = 'primary',
    href,
    children,
    className = '',
    onClick,
    target,
    rel,
}: ButtonProps) {
    const base =
        'inline-flex items-center justify-center box-border text-sm font-semibold transition ' +
        'focus:outline-none focus:ring-0 active:outline-none active:ring-0';

    /**
     * IMPORTANT: Use min-w / min-h instead of w / h so callers can override easily.
     * Keep padding small and let consumers expand via className.
     */
    const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
        primary:
            // default pill look, but no hard width/height so `className` can override
            'rounded-[20px] min-w-[160px] min-h-[40px] py-2 px-4 bg-[#17375B] text-white hover:bg-[#102741] border-none',
        outline:
            'rounded-[20px] min-w-[150px] min-h-[40px] py-2 px-4 border border-[#17375B] text-[#17375B] hover:bg-[#B7C1CC]',
        secondary:
            'gap-2 rounded-full min-h-[36px] py-2 px-4 bg-[#31C2B5] text-white hover:bg-[#28A49A]',
    };

    const variantClasses = variantStyles[variant];

    // Compose classes with className last so it can override earlier utilities
    const classes = cn(base, variantClasses, className);

    // LINK RENDERING
    if (href) {
        return (
            <Link href={href} target={target} rel={rel} className={classes}>
                {children}
            </Link>
        );
    }

    // BUTTON RENDERING
    return (
        <button type="button" onClick={onClick} className={classes}>
            {children}
        </button>
    );
}
