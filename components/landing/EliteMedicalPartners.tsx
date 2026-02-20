'use client';

import { Award, Shield, Star } from 'lucide-react';
import { LandingSection } from '@/components/landing/LandingSection';

export default function EliteMedicalPartners() {
    return (
        <LandingSection
            title="Elite Medical Partners"
            subtitle="We strictly vet every facility. Only JCI-accredited, internationally recognized clinics make our list. Quality is not negotiable when it comes to your health."
            bgClassName="bg-im-primary text-white py-20"
            contentClassName="max-w-4xl mb-0"
            titleClassName="text-white mb-6"
            subtitleClassName="text-white/85 mb-12"
        >
            <div className="flex flex-wrap justify-center gap-12 opacity-80">
                <div className="flex flex-col items-center gap-2">
                    <Award size={64} />
                    <span className="font-semibold tracking-wider">JCI ACCREDITED</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Shield size={64} />
                    <span className="font-semibold tracking-wider">TÜV CERTIFIED</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Star size={64} />
                    <span className="font-semibold tracking-wider">ISO 9001</span>
                </div>
            </div>
        </LandingSection>
    );
}
