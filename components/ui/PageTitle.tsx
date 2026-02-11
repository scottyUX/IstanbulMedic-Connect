'use client';

import React, { JSX } from 'react';
import { FadeInUp } from '@/components/ui/motionPrimitives';
import { cn } from '@/lib/utils';

export type PageTitleProps<T extends keyof JSX.IntrinsicElements = 'h2'> = {
    children: React.ReactNode;
    className?: string;
    as?: T;
    reveal?: boolean;
};

export default function PageTitle<T extends keyof JSX.IntrinsicElements = 'h2'>({
    children,
    className = '',
    as,
    reveal = false,
}: PageTitleProps<T>) {
    // default to 'h2' when not provided
    const Tag = (as ?? 'h2') as keyof JSX.IntrinsicElements;

    return (
        <FadeInUp
            as={Tag}
            reveal={reveal}
            className={cn(
                `
         font-bold
         leading-[140%]
         /* MOBILE - unchanged */
         text-[28px] 
         sm:text-[32px]
         xl:text-[40px] 
         tracking-[0.02em]
         text-center
         text-[#0D1E32]
        `,
                className,
            )}
        >
            {children}
        </FadeInUp>
    );
}
