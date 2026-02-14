'use client';

import Section from '@/components/ui/section';
import Container from '@/components/ui/container';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { CONSULTATION_LINK } from '@/lib/constants';

const faqItems = [
    {
        value: 'top-questions',
        trigger: 'Top questions',
        content: (
            <div className="space-y-6 im-text-body im-text-muted">
                <div>
                    <p className="im-text-emphasis text-im-text-primary">
                        Is Istanbul Medic right for me?
                    </p>
                    <p className="mt-2">
                        Istanbul Medic is for patients seeking high-quality medical procedures
                        performed by board-certified doctors in JCI-accredited facilities. We focus
                        on hair restoration and partner with Istanbul's finest hospital network.
                    </p>
                </div>
                <div>
                    <p className="im-text-emphasis text-im-text-primary">How do I get started?</p>
                    <p className="mt-2">
                        Book your complimentary consultation. Share your goals, receive a
                        personalized assessment and quote, then coordinate your travel and
                        procedure with our team.
                    </p>
                    <a
                        href={CONSULTATION_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-im-secondary hover:underline"
                    >
                        Get started
                    </a>
                    .
                </div>
                <div>
                    <p className="im-text-emphasis text-im-text-primary">What are the fees?</p>
                    <p className="mt-2">
                        The consultation is complimentary. Procedure pricing is transparent and
                        provided after your assessment. No hidden fees.
                    </p>
                </div>
            </div>
        ),
    },
    {
        value: 'journey',
        trigger: 'Your journey',
        content: (
            <div className="space-y-6 im-text-body im-text-muted">
                <p>
                    From your first inquiry to your full recovery, our dedicated care team is with
                    you. We handle logistics, translation, airport transfers, and aftercare so you
                    can focus on your transformation.
                </p>
                <p>
                    All procedures are performed by medical doctors in JCI-accredited facilities using
                    the latest validated techniques.
                </p>
            </div>
        ),
    },
    {
        value: 'safety',
        trigger: 'Safety & accreditation',
        content: (
            <div className="space-y-6 im-text-body im-text-muted">
                <p>
                    We only work with JCI-accredited clinics and internationally recognized
                    facilities. Every partner is vetted for quality, experience, and patient safety.
                </p>
                <p>
                    Our network includes TÜV-certified and ISO 9001 facilities. Quality is not
                    negotiable when it comes to your health.
                </p>
            </div>
        ),
    },
];

export default function FAQSection() {
    return (
        <Section className="py-16 sm:py-24">
            <Container>
                <h2 className="im-heading-2 mb-12 text-im-text-primary">
                    Your questions, answered
                </h2>
                <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((item) => (
                        <AccordionItem key={item.value} value={item.value}>
                            <AccordionTrigger className="im-text-body py-6">
                                {item.trigger}
                            </AccordionTrigger>
                            <AccordionContent>{item.content}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </Container>
        </Section>
    );
}
