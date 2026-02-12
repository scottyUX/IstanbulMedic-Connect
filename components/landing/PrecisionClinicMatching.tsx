'use client';

import { Activity, ShieldCheck, UserCheck } from 'lucide-react';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { LandingSection } from '@/components/landing/LandingSection';

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
        <LandingSection
            title="Precision Clinic Matching"
            subtitle="We don't just list clinics; we curate them. Your health deserves more than a directory."
            bgClassName="bg-white py-16 sm:py-24"
            contentClassName="mb-16"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, i) => (
                    <FeatureCard
                        key={feature.title}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                        delay={i * 0.1}
                    />
                ))}
            </div>
        </LandingSection>
    );
}
