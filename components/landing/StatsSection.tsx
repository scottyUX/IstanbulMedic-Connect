'use client';

import Section from '@/components/ui/section';
import Container from '@/components/ui/container';

const stats = [
    { value: '500+', label: 'patients transformed' },
    { value: '15+', label: 'JCI-accredited clinics' },
];

export default function StatsSection() {
    return (
        <Section className="py-16 sm:py-24">
            <Container>
                <div className="mb-12 max-w-2xl">
                    <h2 className="im-heading-2 mb-4 text-left text-im-text-primary">
                        Welcome a world of new possibilities
                    </h2>
                    <p className="im-text-body im-text-muted text-left">
                        Reach patients who trust world-class medical care in Istanbul.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                    {stats.map((stat) => (
                        <div key={stat.label}>
                            <p className="im-heading-display text-im-primary">{stat.value}</p>
                            <p className="im-text-body im-text-muted mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
