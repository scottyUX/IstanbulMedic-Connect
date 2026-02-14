'use client';

import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import Section from '@/components/ui/section';
import Container from '@/components/ui/container';
import PageTitle from '@/components/ui/PageTitle';
import { FadeInUp } from '@/components/ui/motionPrimitives';

const benefits = [
    '24/7 dedicated support via WhatsApp',
    'Translation services for every appointment',
    'Airport transfers and logistics handling',
    'Post-operative care coordination',
];

export default function PersonalMedicalConcierge() {
    return (
        <Section className="bg-[var(--im-color-accent)]/15 py-16 sm:py-24">
            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <FadeInUp className="order-2 lg:order-1">
                        <div className="relative h-[400px] w-full rounded-3xl overflow-hidden shadow-xl">
                            {/* Placeholder until we have a real team image, using a solid color block with text for now if image missing, 
                   but let's try to use one of the result images as a fallback or just a colored dive */}
                            <div className="absolute inset-0 bg-im-primary flex items-center justify-center text-white/20 text-9xl font-bold">
                                TEAM
                            </div>
                            {/* 
               If we had a team image:
               <Image src="/team/concierge.jpg" alt="Medical Concierge Team" fill className="object-cover" /> 
               */}
                        </div>
                    </FadeInUp>

                    <div className="order-1 lg:order-2">
                        <PageTitle className="text-left mb-6">
                            Your Personal Medical Concierge
                        </PageTitle>
                        <FadeInUp>
                            <p className="text-lg text-[#3E4758] mb-8 leading-relaxed">
                                From your first inquiry to your full recovery, our dedicated verified care team is with you. We handle the logistics so you can focus on your transformation. You are never alone in a foreign country; you are with family.
                            </p>

                            <ul className="space-y-4">
                                {benefits.map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 im-text-body im-text-emphasis">
                                        <CheckCircle2 className="text-im-secondary shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </FadeInUp>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
