'use client';

import { cn } from '@/lib/utils';
import Section from '@/components/ui/section';
import Container from '@/components/ui/container';

const categories = [
    'Personalized matching',
    'Verified safety',
    'Outcome focused',
    'Hair restoration',
    'VIP experience',
    'Lifetime support',
    'JCI-accredited',
    '24/7 concierge',
    'Medical translation',
];

export default function CategoryPillsSection() {
    return (
        <Section className="py-16 sm:py-24">
            <Container>
                <div className="mb-12 max-w-2xl">
                    <h2 className="im-heading-2 mb-4 text-left text-im-text-primary">
                        Offer what you do best with Istanbul Medic
                    </h2>
                    <p className="im-text-body im-text-muted text-left">
                        Istanbul Medic is for more than medical tourism. Now it's for patients who deserve excellence.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {categories.map((label) => (
                        <span
                            key={label}
                            className={cn(
                                'rounded-full border border-border bg-background px-5 py-2.5',
                                'im-text-body-sm im-text-emphasis text-im-text-primary',
                                'transition-colors hover:border-im-primary hover:bg-im-primary/5'
                            )}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
