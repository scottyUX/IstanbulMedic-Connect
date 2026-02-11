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
            className={cn(
                `
          font-normal
          text-[16px]
          tracking-[0.01em]
          text-[#3E4758]
          leading-[140%]
          sm:text-[20px]
          /* iPad breakpoint */
          md:text-[18px]
          /* optional: keep same on lg so it doesn’t jump too big */
          lg:text-[20px]
        `,
                className,
            )}
            {...(props as MotionProps)}
            reveal={reveal}
        >
            {children}
        </FadeInUp>
    );
}
