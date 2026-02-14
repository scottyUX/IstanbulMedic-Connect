'use client';

import Image from 'next/image';
import Container from '@/components/ui/container';
import Section from '@/components/ui/section';
import { FadeInUp, FadeIn } from '@/components/ui/motionPrimitives';
import PageButton from '@/components/ui/PageButton';
import PageSubtitle from '@/components/ui/PageSubtitle';
import { preventOrphans } from '@/lib/preventOrphans';
import { CONSULTATION_LINK } from '@/lib/constants';

const HeroCopy = ({ title, subtitle }: { title: string; subtitle: string }) => {
    return (
        <>
            <FadeInUp
                as="h1"
                className={`
          font-bold
          text-4xl leading-[50px]
          sm:text-5xl sm:leading-[66px]
          md:text-[34px] md:leading-[44px]
          lg:text-[34px] lg:leading-[44px]
          xl:text-[48px] xl:leading-[60px]
          mb-[16px]
          max-w-2xl
        `}
                reveal={false}
            >
                {preventOrphans(title)}
            </FadeInUp>

            <PageSubtitle
                className="mb-[32px] sm:mb-[40px] md:mb-[28px] lg:mb-[28px] lg:max-w-[640px] max-w-[720px] mx-auto md:mx-0 text-white lg:text-[20px] xl:text-[24px]"
                reveal={false}
            >
                {subtitle}
            </PageSubtitle>
        </>
    );
};

const HeroImage = () => {
    return (
        <div className="order-1 md:order-2 flex justify-center md:justify-end items-center">
            <div
                className={`
            relative
            w-full
            h-[300px]                 /* mobile */
            sm:h-[380px]              /* small tablet */
            md:w-[360px] md:h-[360px] /* ipad/tablet target size (smaller than desktop) */
            lg:w-[360px] lg:h-[360px] /* keep lg same as iPad */
            xl:w-[590px] xl:h-[590px] /* desktop and up */
            max-w-full
            overflow-hidden
            flex
            items-center
            justify-center
            md:transform md:translate-x-4 /* small nudge on tablet to align visually with text */
          `}
            >
                <Image
                    src="/hero/landing_hero_new.png"
                    alt="Happy patient after expert hair restoration"
                    width={590}
                    height={590}
                    priority
                    className="object-contain object-center w-auto h-full"
                />
            </div>
        </div>
    );
};

const HeroButtons = ({ primaryLabel }: { primaryLabel: string }) => {
    return (
        <FadeIn
            className="flex flex-col items-center gap-[16px] sm:flex-row sm:items-center sm:justify-start md:pb-8 mt-12"
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        >
            <PageButton
                variant="primary"
                href={CONSULTATION_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:max-w-max"
            >
                {primaryLabel}
            </PageButton>
        </FadeIn>
    );
};

export default function HeroBanner() {
    const title = "Begin Your Transformation Today, Reserve Your Private Consultation.";
    const subtitle = "Experience hair restoration exclusively performed by medical doctors in Istanbul’s finest hospital network, with your own medical assistant supporting you every step of the way, from consultation to recovery.";
    const ctaLabel = "Book Your Complimentary Consultation";

    return (
        <Section noPadding className="overflow-hidden bg-[#A05377] text-white pb-10 sm:pb-0">
            <div className="relative isolate overflow-hidden">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_20%_20%,rgba(255,255,255,0.22),transparent)]"
                />
                <Container
                    className={`
            relative z-10
            grid
            grid-cols-1
            gap-2
            sm:gap-8
            pt-6
            md:grid-cols-[minmax(0,1fr)_360px]
            lg:grid-cols-[minmax(0,1fr)_360px]  
            xl:grid-cols-[minmax(0,1fr)_590px]
            lg:min-h-[420px]
            xl:min-h-[595px]
            lg:items-center
            md:items-center
          `}
                >
                    <HeroImage />
                    <div className="order-2 md:order-1 lg:order-1 max-w-xl lg:max-w-4xl mx-auto md:mx-0 text-center md:text-left flex items-center xl:mt-14">
                        <div className="mt-0 pl-0 md:pl-6 lg:pl-6 xl:pl-8">
                            <HeroCopy title={title} subtitle={subtitle} />
                            <HeroButtons primaryLabel={ctaLabel} />
                        </div>
                    </div>
                </Container>
            </div>
        </Section>
    );
}
