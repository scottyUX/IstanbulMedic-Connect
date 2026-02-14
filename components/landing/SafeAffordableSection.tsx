'use client';

import Image from 'next/image';
import Section from '@/components/ui/section';
import Container from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { CONSULTATION_LINK } from '@/lib/constants';

export default function SafeAffordableSection() {
    return (
        <Section className="py-12 sm:py-16">
            <Container>
                <div className="overflow-hidden rounded-2xl lg:flex">
                    <div className="relative aspect-[4/3] w-full min-h-[280px] lg:aspect-auto lg:min-h-[320px] lg:flex-1">
                        <Image
                            src="/confidence/confidence1.png"
                            alt="Your confidence journey starts here"
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                        />
                    </div>
                    <div className="flex flex-col justify-center bg-[#5B2C6F] px-8 py-12 sm:px-12 sm:py-16 lg:flex-1 lg:px-16 lg:py-20">
                        <h2 className="im-heading-1 mb-4 text-white sm:text-3xl lg:text-4xl">
                            Safe, affordable hair transplants abroad, handled for
                            you.
                        </h2>
                        <p className="im-text-body-lg mb-8 text-white/95 leading-relaxed">
                            We match you with trusted, doctor-vetted clinics and
                            handle everything so you can focus on getting your
                            hair back.
                        </p>
                        <Button
                            href={CONSULTATION_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-fit bg-white text-[#5B2C6F] hover:bg-white/90"
                        >
                            Get my free plan
                        </Button>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
