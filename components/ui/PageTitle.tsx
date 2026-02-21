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
    const Tag = (as ?? 'h2') as keyof JSX.IntrinsicElements;

    return (
        <FadeInUp reveal={reveal}>
            <Tag
                className={cn(
                    'im-heading-1 text-center text-im-text-primary',
                    className,
                )}
            >
                {children}
            </Tag>
        </FadeInUp>
    );
}
