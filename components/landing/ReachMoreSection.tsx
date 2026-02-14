'use client';

import Section from '@/components/ui/section';
import Container from '@/components/ui/container';

const features = [
    {
        title: 'Get discovered when you are ready',
        description:
            'Your consultation can appear to patients looking for expert hair restoration in Istanbul.',
    },
    {
        title: 'Get supported every step of the way',
        description:
            'Show up in the care journey with a dedicated medical assistant from consultation to recovery.',
    },
];

export default function ReachMoreSection() {
    return (
        <Section className="py-16 sm:py-24">
            <Container>
                <div className="mb-12 max-w-2xl">
                    <h2 className="im-heading-2 mb-4 text-left text-im-text-primary">
                        Reach more people in more ways
                    </h2>
                    <p className="im-text-body im-text-muted text-left">
                        We put services like yours in front of patients who are planning and traveling.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="rounded-xl border border-border bg-card p-6"
                        >
                            <h3 className="im-heading-4 mb-3 text-im-text-primary">
                                {feature.title}
                            </h3>
                            <p className="im-text-body im-text-muted">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
