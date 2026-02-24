'use client';

import clsx from 'clsx';

type SectionProps = {
    children: React.ReactNode;
    className?: string;
    id?: string;
    /**
     * Removes the default responsive vertical padding that every section receives.
     * Useful for components like the hero that manage their own spacing.
     */
    noPadding?: boolean;
};

export default function Section({ children, className = '', id, noPadding = false }: SectionProps) {
    return (
        <section id={id} className={clsx(className)}>
            {children}
        </section>
    );
}
