'use client';

import { ReactNode } from 'react';
import type { MotionProps } from 'framer-motion';
import { FadeInUp } from '@/components/ui/motionPrimitives';
import { cn } from '@/lib/utils';

type SubtitleProps = Omit<React.HTMLAttributes<HTMLParagraphElement>, keyof MotionProps> &
    MotionProps & {
        children: ReactNode;
        className?: string;
        reveal?: boolean;
    };

export default function PageSubtitle({ children, className, reveal = false, ...props }: SubtitleProps) {
    return (
        <FadeInUp
            as="p"
            className={cn("im-text-body-lg im-text-muted text-center leading-[140%]", className)}
            {...(props as MotionProps)}
            reveal={reveal}
        >
            {children}
        </FadeInUp>
    );
}
