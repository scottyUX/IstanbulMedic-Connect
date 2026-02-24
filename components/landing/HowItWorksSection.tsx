'use client';

import Image from 'next/image';
import Link from 'next/link';
import Section from '@/components/ui/section';
import Container from '@/components/ui/container';
import PageTitle from '@/components/ui/PageTitle';
import PageSubtitle from '@/components/ui/PageSubtitle';
import { CONSULTATION_LINK } from '@/lib/constants';

type Step = {
    number: number;
    title: string;
    description: string;
    imageSrc: string;
    imageAlt: string;
    ctaLabel?: string;
    ctaHref?: string;
};

const steps: Step[] = [
    {
        number: 1,
        title: 'Create Your Secure Profile',
        description:
            'Upload your photos and share your hair loss and medical details once — safely and privately. No more sending sensitive images to multiple clinics on WhatsApp.',
        imageSrc: '/steps/step1.png',
        imageAlt: 'Create your secure profile',
        ctaLabel: 'Create your profile',
        ctaHref: CONSULTATION_LINK,
    },
    {
        number: 2,
        title: 'Compare Clinics with Confidence',
        description:
            'Instead of searching across Google, YouTube, Instagram, and forums, we gather real patient experiences into one organized clinic profile — so you can see the full picture in one place. Clear profiles. Transparent information. Simple trust indicators.',
        imageSrc: '/steps/step2.png',
        imageAlt: 'Compare clinics with confidence',
        ctaLabel: 'Explore clinics',
        ctaHref: '/clinics',
    },
    {
        number: 3,
        title: 'Receive Personalized Offers',
        description:
            'Verified clinics review your case and submit structured treatment plans tailored to you — including graft estimates, techniques, pricing, and package details. Everything standardized. Everything comparable.',
        imageSrc: '/steps/step3.png',
        imageAlt: 'Receive personalized offers',
        ctaLabel: 'Get my free plan',
        ctaHref: CONSULTATION_LINK,
    },
    {
        number: 4,
        title: 'Engage on Your Terms',
        description:
            "Message clinics securely, ask questions, and move forward only when you're ready. No pressure. No obligation. Just informed decisions.",
        imageSrc: '/confidence/confidence1.png',
        imageAlt: 'Engage on your terms',
        ctaLabel: 'Book a consultation',
        ctaHref: CONSULTATION_LINK,
    },
];

export default function HowItWorksSection() {
    return (
        <Section className="bg-white py-20 sm:py-28">
            <Container className="pl-16 pr-6 sm:pl-28 sm:pr-8 lg:pl-40 lg:pr-12">
                <header className="mx-auto max-w-3xl text-center">
                    <PageTitle>
                        How it works
                    </PageTitle>
                    <PageSubtitle className="mt-5">
                        From your first photos to your final results, we guide
                        you every step. Share a few photos and your goals and
                        we handle everything else.
                    </PageSubtitle>
                </header>

                <div className="mt-16 flex flex-col gap-20 sm:gap-24">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2 lg:gap-4"
                        >
                            <div className="max-w-lg lg:order-1">
                                <span className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#9B4D7A] text-2xl font-bold text-white">
                                    {step.number}
                                </span>
                                <h3 className="im-heading-2 mb-4 text-im-text-primary">
                                    {step.title}
                                </h3>
                                <p className="im-text-body im-text-muted mb-6 leading-relaxed">
                                    {step.description}
                                </p>
                                {step.ctaLabel && step.ctaHref && (
                                    <Link
                                        href={step.ctaHref}
                                        {...(step.ctaHref.startsWith('http')
                                            ? {
                                                  target: '_blank',
                                                  rel: 'noopener noreferrer',
                                              }
                                            : {})}
                                        className="im-text-body font-semibold text-im-secondary hover:underline"
                                    >
                                        {step.ctaLabel} →
                                    </Link>
                                )}
                            </div>

                            <div className="relative aspect-[4/5] min-h-[280px] w-full max-w-md overflow-hidden rounded-2xl lg:order-2">
                                <Image
                                    src={step.imageSrc}
                                    alt={step.imageAlt}
                                    fill
                                    className="object-cover object-top"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
