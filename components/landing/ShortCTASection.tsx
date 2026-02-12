'use client';

import Section from '@/components/ui/section';
import Container from '@/components/ui/container';

export default function ShortCTASection() {
    return (
        <Section className="py-16 sm:py-24">
            <Container>
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="im-heading-2 mb-4 text-im-text-primary">
                        Show up confidently. Transform completely.
                    </h2>
                    <p className="im-text-body im-text-muted">
                        Book your complimentary consultation and begin your journey with expert care.
                    </p>
                </div>
            </Container>
        </Section>
    );
}
