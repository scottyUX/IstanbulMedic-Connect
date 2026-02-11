'use client';

import { Activity, ShieldCheck, UserCheck } from 'lucide-react';
import Section from '@/components/ui/section';
import Container from '@/components/ui/container';
import PageTitle from '@/components/ui/PageTitle';
import PageSubtitle from '@/components/ui/PageSubtitle';
import { FadeInUp } from '@/components/ui/motionPrimitives';

const features = [
    {
        icon: UserCheck,
        title: 'Personalized Matching',
        description:
            'Our algorithm matches your specific medical needs with the specialist best suited to deliver your desired result.',
    },
    {
        icon: ShieldCheck,
        title: 'Verified Safety',
        description:
            'We rigorously vet every clinic for international accreditation and safety standards before they join our network.',
    },
    {
        icon: Activity,
        title: 'Outcome Focused',
        description:
            'We prioritize your long-term results, ensuring you are connected with doctors who have a proven track record.',
    },
];

export default function PrecisionClinicMatching() {
    return (
        <Section className="bg-white py-16 sm:py-24">
            <Container>
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <PageTitle>Precision Clinic Matching</PageTitle>
                    <PageSubtitle className="mt-4">
                        We don&apos;t just list clinics; we curate them. Your health deserves more than a directory.
                    </PageSubtitle>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, i) => (
                        <FadeInUp
                            key={feature.title}
                            className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 hover:bg-[#ECF8F8] transition-colors duration-300"
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="w-16 h-16 rounded-full bg-[#17375B] flex items-center justify-center mb-6 text-white">
                                <feature.icon size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-[#0D1E32] mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-[#3E4758] leading-relaxed">
                                {feature.description}
                            </p>
                        </FadeInUp>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
