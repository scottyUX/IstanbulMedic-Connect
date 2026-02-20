'use client';

import { ReactNode } from 'react';
import { FadeInUp } from '@/components/ui/motionPrimitives';
import { cn } from '@/lib/utils';

type SubtitleProps = {
    children: ReactNode;
    className?: string;
    reveal?: boolean;
};

export default function PageSubtitle({ children, className, reveal = false }: SubtitleProps) {
    return (
        <FadeInUp reveal={reveal}>
            <p className={cn("im-text-body-lg im-text-muted text-center leading-[140%]", className)}>
                {children}
            </p>
        </FadeInUp>
    );
}
