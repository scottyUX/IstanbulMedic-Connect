'use client';

import { FadeInUp } from '@/components/ui/motionPrimitives';
import { LandingSection } from '@/components/landing/LandingSection';

const steps = [
    {
        number: '01',
        title: 'Virtual Consultation',
        description: 'Connect with our experts from home. Receive a personalized assessment and price quote.',
    },
    {
        number: '02',
        title: 'VIP Arrival',
        description: 'Land in Istanbul and be greeted by your personal assistant. Luxury transfer to your verified hotel.',
    },
    {
        number: '03',
        title: 'Expert Procedure',
        description: 'Undergo your transformation in a JCI-accredited facility using the latest validated techniques.',
    },
    {
        number: '04',
        title: 'Lifetime Support',
        description: 'Fly home with confidence. Our aftercare team monitors your progress for 12 months and beyond.',
    },
];

export default function JourneyToConfidence() {
    return (
        <LandingSection
            title="Your Journey to Confidence"
            subtitle="Visualize your path. Simple, transparent, and guided every step of the way."
            bgClassName="bg-white py-20 relative overflow-hidden"
            contentClassName="mb-16"
        >
            <div className="relative">
                <div className="hidden md:block absolute top-[24px] left-0 w-full h-0.5 bg-border -z-10" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <FadeInUp
                            key={step.number}
                            className="flex flex-col items-center text-center bg-white p-4"
                            transition={{ delay: index * 0.15 }}
                        >
                            <div className="w-12 h-12 rounded-full bg-im-secondary text-white flex items-center justify-center font-bold im-text-body-lg mb-6 shadow-lg z-10 relative">
                                {step.number}
                            </div>
                            <h3 className="text-xl font-bold text-[#0D1E32] mb-3">
                                {step.title}
                            </h3>
                            <p className="text-[#3E4758] text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </FadeInUp>
                    ))}
                </div>
            </div>
        </LandingSection>
    );
}
