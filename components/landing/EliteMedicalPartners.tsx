'use client';

import { Award, Shield, Star } from 'lucide-react';
import Section from '@/components/ui/section';
import Container from '@/components/ui/container';
import PageTitle from '@/components/ui/PageTitle';
import PageSubtitle from '@/components/ui/PageSubtitle';

export default function EliteMedicalPartners() {
    return (
        <Section className="bg-[#17375B] text-white py-20">
            <Container>
                <div className="text-center max-w-4xl mx-auto">
                    <PageTitle className="text-white mb-6">Elite Medical Partners</PageTitle>
                    <PageSubtitle className="text-gray-200 mb-12">
                        We strictly vet every facility. Only JCI-accredited, internationally recognized clinics make our list. Quality is not negotiable when it comes to your health.
                    </PageSubtitle>

                    <div className="flex flex-wrap justify-center gap-12 opacity-80">
                        {/* Placeholders for logos */}
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
                </div>
            </Container>
        </Section>
    );
}
