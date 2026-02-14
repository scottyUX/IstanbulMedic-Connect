'use client';

import Image from 'next/image';
import Section from '@/components/ui/section';
import Container from '@/components/ui/container';
import { FadeInUp } from '@/components/ui/motionPrimitives';
import { Button } from '@/components/ui/button';
import { preventOrphans } from '@/lib/preventOrphans';
import { CONSULTATION_LINK } from '@/lib/constants';

const DEFAULT_TITLE = 'Find the Right Clinic\nCompare with Confidence\nEngage on Your Terms';
const DEFAULT_SUBTITLE =
    'Finding the right clinic shouldn\'t mean navigating endless WhatsApp chats and scattered information. IstanbulMedic Connect brings clarity to the process — connecting you with trusted, verified clinics through one secure platform.\n\nFree to use. No hidden commitments.';
const DEFAULT_CTA_FIND = 'Find clinics';
const DEFAULT_CTA_PROFILE = 'Create a profile';
const DEFAULT_IMAGE_SRC = '/hero/landing_hero_new.png';
const DEFAULT_IMAGE_ALT = 'Happy patient after expert hair restoration';

export interface HeroBannerProps {
    title?: string;
    subtitle?: string;
    ctaFindLabel?: string;
    ctaProfileLabel?: string;
    imageSrc?: string;
    imageAlt?: string;
}

export default function HeroBanner({
    title = DEFAULT_TITLE,
    subtitle = DEFAULT_SUBTITLE,
    ctaFindLabel = DEFAULT_CTA_FIND,
    ctaProfileLabel = DEFAULT_CTA_PROFILE,
    imageSrc = DEFAULT_IMAGE_SRC,
    imageAlt = DEFAULT_IMAGE_ALT,
}: HeroBannerProps = {}) {
    return (
        <Section
            noPadding
            className="relative flex min-h-screen items-center overflow-hidden bg-im-tertiary py-12 sm:py-16"
        >
            <Container className="relative z-10 px-6 sm:px-10 lg:px-16">
                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
                    {/* Text block - left */}
                    <div className="max-w-xl lg:col-span-5">
                        <FadeInUp
                            as="h1"
                            className="im-heading-display mb-6 text-white"
                            style={{ fontFamily: 'var(--im-font-heading), "Merriweather", serif' }}
                            reveal={false}
                        >
                            {(title.split('\n').concat(['', '', '']).slice(0, 3)).map((line, i) => (
                                <span key={i} className="block min-h-[1.2em] whitespace-nowrap">
                                    {line ? preventOrphans(line) : '\u00A0'}
                                </span>
                            ))}
                        </FadeInUp>
                        <FadeInUp
                            as="div"
                            className="im-text-body-lg mb-8 leading-relaxed text-white/95 space-y-4"
                            reveal={false}
                        >
                            {subtitle.split('\n\n').map((paragraph, i) => (
                                <p key={i}>{paragraph}</p>
                            ))}
                        </FadeInUp>
                        <FadeInUp
                            as="div"
                            className="flex flex-wrap gap-4"
                            reveal={false}
                        >
                            <Button
                                href="/clinics"
                                size="xl"
                                className="min-h-14 border-2 border-white bg-transparent px-10 text-lg text-white hover:bg-white/15"
                            >
                                {ctaFindLabel}
                            </Button>
                            <Button
                                href={CONSULTATION_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="xl"
                                className="min-h-14 border-2 border-white bg-transparent px-10 text-lg text-white hover:bg-white/15"
                            >
                                {ctaProfileLabel}
                            </Button>
                        </FadeInUp>
                    </div>

                    {/* Hero image + overlay cards - right */}
                    <div className="relative flex min-h-[400px] justify-center lg:col-span-7 lg:min-h-[70vh]">
                        <div className="relative w-full max-w-2xl lg:max-w-4xl">
                            {/* Hero image - overlapping style, larger */}
                            <div className="relative h-[min(500px,60vh)] w-full overflow-visible sm:h-[min(550px,65vh)] lg:h-[min(700px,75vh)]">
                                <Image
                                    src={imageSrc}
                                    alt={imageAlt}
                                    fill
                                    priority
                                    className="object-contain object-center"
                                />
                            </div>

                            {/* Glassmorphic overlay cards - positioned lower to avoid overlapping text */}
                            <div className="absolute bottom-4 right-0 flex flex-col gap-3 sm:right-4 sm:bottom-8 lg:right-0 lg:bottom-12">
                                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                    <p className="im-text-body-xs mb-1 font-medium text-white/80">
                                        Hair loss pattern
                                    </p>
                                    <p className="im-text-body-sm font-medium text-white">
                                        Norwood 3-5
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                    <p className="im-text-body-xs mb-1 font-medium text-white/80">
                                        Appointment
                                    </p>
                                    <p className="im-text-body-sm font-medium text-white">
                                        Fri, May 22 • 10:00 AM
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                    <p className="im-text-body-xs mb-1 font-medium text-white/80">
                                        Flight
                                    </p>
                                    <p className="im-text-body-sm font-medium text-white/70">
                                        Sun, 17 Jan — Mon, 18 Jan
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
