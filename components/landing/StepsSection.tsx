'use client';

import Image from 'next/image';
import Section from '@/components/ui/section';
import Container from '@/components/ui/container';
import PageTitle from '@/components/ui/PageTitle';
import PageSubtitle from '@/components/ui/PageSubtitle';
import { FadeInUp, ScaleIn } from '@/components/ui/motionPrimitives';
import { Button } from '@/components/ui/button';

export interface StepItem {
    number: string;
    title: string;
    descriptionHtml: string;
    image: string;
    imageAlt: string;
    accentColor: string;
}

export interface StepsSectionProps {
    title: string;
    subtitle: string;
    steps: StepItem[];
    ctaLabel: string;
    ctaHref: string;
    columns?: 3 | 4;
    footer?: React.ReactNode;
}

export default function StepsSection({
    title,
    subtitle,
    steps,
    ctaLabel,
    ctaHref,
    columns = 3,
    footer,
}: StepsSectionProps) {
    const gridCols =
        columns === 4
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-3';

    return (
        <Section className="bg-white py-20 sm:py-28">
            <Container className="text-center">
                <header className="mx-auto max-w-3xl space-y-5">
                    <PageTitle>{title}</PageTitle>
                    <PageSubtitle>{subtitle}</PageSubtitle>
                </header>

                <div className="mt-10 sm:mt-12">
                    <div className={`grid gap-10 ${gridCols} sm:gap-6`}>
                        {steps.map((step, index) => (
                            <div key={index} className="space-y-6">
                                <div className="flex justify-center">
                                    <span
                                        className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white sm:h-16 sm:w-16 ${step.accentColor}`}
                                    >
                                        {step.number}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <FadeInUp
                                        as="h3"
                                        className="im-heading-3 text-im-text-primary"
                                    >
                                        {step.title}
                                    </FadeInUp>
                                    <FadeInUp transition={{ delay: 0.05 }}>
                                        <p
                                            className="mx-auto min-h-[72px] px-2 text-sm leading-[24px] text-im-text-secondary sm:px-4 sm:text-base"
                                            dangerouslySetInnerHTML={{
                                                __html: step.descriptionHtml,
                                            }}
                                        />
                                    </FadeInUp>
                                </div>

                                <ScaleIn className="relative mx-auto h-[280px] w-full max-w-[404px] overflow-hidden rounded-xl shadow-[0_20px_60px_rgba(15,39,72,0.12)]">
                                    <Image
                                        src={step.image}
                                        alt={step.imageAlt}
                                        fill
                                        className="object-cover"
                                        sizes="404px"
                                    />
                                </ScaleIn>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <Button
                        variant="navy-primary"
                        href={ctaHref}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {ctaLabel}
                    </Button>
                </div>

                {footer && (
                    <div className="mx-auto mt-20 max-w-2xl lg:mt-24">
                        {footer}
                    </div>
                )}
            </Container>
        </Section>
    );
}
