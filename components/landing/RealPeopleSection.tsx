'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Section from '@/components/ui/section';
import Container from '@/components/ui/container';
import PageTitle from '@/components/ui/PageTitle';
import QuoteIcon from '@/components/icons/QuoteIcon';
import { preventOrphans, preventOrphansHTML } from '@/lib/preventOrphans';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from '@/components/ui/carousel';

type TransformationSlide = {
    afterImage: string;
    beforeImage: string;
    quote: {
        title: string;
        body: string;
        author: string;
    };
};

const AUTO_CHANGE_DELAY = 6000;

// Hardcoded data from translations.home.json
const transformationsTitle = "Real People, Real Transformation";
const labels = { after: "After", before: "Before" };
const ariaPrefix = "Go to slide";
const slides: TransformationSlide[] = [
    {
        afterImage: "/results/21b_after.jpg",
        beforeImage: "/results/21b_before.jpg",
        quote: {
            title: "Professionalism We Truly Appreciated",
            body: "Hi Yasemin,\n\nWe have reached safely to Jordan.\n\nThank you very much for your kindness, understanding, patience, and the tremendous effort you gave us in dealing and communicating between us and the hospital staff.\n\nYour professionalism and respect meant a lot to us.",
            author: "Emad B."
        }
    },
    {
        afterImage: "/results/new1_after.jpg",
        beforeImage: "/results/new1_before.jpg",
        quote: {
            title: "Grateful for Your Expertise and Kindness",
            body: "Yasemin and hospital doctors and staff,\n\nThank you for your wonderful medical expertise and kindness.\n\nThe courtesies everyone extended to my family and me are highly appreciated.\n\nMuch appreciation,",
            author: "Mikey"
        }
    },
    {
        afterImage: "/results/new2_after.jpg",
        beforeImage: "/results/new2_before.jpg",
        quote: {
            title: "Smooth Experience & Excellent Results",
            body: "Thanks to your assistance, everything went smoothly, and I'm very satisfied with the results so far.\n\nIt was a pleasure working with someone as kind, understanding, and dedicated as you.",
            author: "Kevin"
        }
    },
    {
        afterImage: "/results/new3_after.jpg",
        beforeImage: "/results/new3_before.jpg",
        quote: {
            title: "Professional, Kind, and Truly Supportive",
            body: "Yasemin,\n\nThank you very much for all the help you gave us during Peggy's stay at the hospital. We will always remember your professionalism and kindness.\n\nWe hope this photo book introduces you to Colorado and entices you to visit sometime.\n\nIf you do visit, please let us know. We would be pleased to be your host.",
            author: "Len and Peggy B."
        }
    },
    {
        afterImage: "/results/new4_after.jpg",
        beforeImage: "/results/new4_before.jpg",
        quote: {
            title: "Guidance That Made All the Difference",
            body: "From the very beginning, you were always there to answer my questions, explain every detail clearly, and make sure I felt confident and well-informed.\n\nI truly appreciate the care and attention you showed throughout this journey.",
            author: "Amit M."
        }
    },
    {
        afterImage: "/results/new5_after.jpg",
        beforeImage: "/results/new5_before.jpg",
        quote: {
            title: "Exceptional Care for Our Parents",
            body: "Hi Yasemin,\n\nWe would like to thank you for your efforts and for taking such good care of our parents. They returned to the Netherlands yesterday evening. Today, we visited our father in a Dutch hospital.\n\nWe included a small package of a typical Dutch treat for you: \"Drop\" (licorice). Hope you like it.\n\nSend our regards to all friends at IstanbulMedic.\nKind regards,",
            author: "Natalie and Anouk de W."
        }
    }
];

export default function RealPeopleSection() {
    const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
    const autoplayRef = useRef<number | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const totalSlides = slides.length;

    const stopAutoplay = useCallback(() => {
        if (autoplayRef.current !== null) {
            window.clearInterval(autoplayRef.current);
            autoplayRef.current = null;
        }
    }, []);

    const startAutoplay = useCallback(() => {
        if (!carouselApi || totalSlides <= 1) return;
        stopAutoplay();
        autoplayRef.current = window.setInterval(() => {
            carouselApi.scrollNext();
        }, AUTO_CHANGE_DELAY);
    }, [carouselApi, stopAutoplay, totalSlides]);

    useEffect(() => {
        if (!carouselApi) return;
        const handleSelect = () => setActiveIndex(carouselApi.selectedScrollSnap());
        handleSelect();
        carouselApi.on('select', handleSelect);
        carouselApi.on('reInit', handleSelect);
        return () => {
            carouselApi.off('select', handleSelect);
            carouselApi.off('reInit', handleSelect);
        };
    }, [carouselApi]);

    useEffect(() => {
        startAutoplay();
        return stopAutoplay;
    }, [startAutoplay, stopAutoplay]);

    useEffect(() => {
        if (!carouselApi) return;
        carouselApi.scrollTo(0);
        setActiveIndex(0);
        startAutoplay();
    }, [carouselApi, startAutoplay, totalSlides]);

    const goTo = (index: number) => {
        if (!carouselApi) return;
        carouselApi.scrollTo(index);
        startAutoplay();
    };

    const header = useMemo(
        () => (
            <header className="mb-6 text-center">
                <PageTitle as="h2">{preventOrphansHTML(transformationsTitle)}</PageTitle>
            </header>
        ),
        []
    );

    return (
        <Section>
            <Container className="bg-[#ECF8F8] py-10">
                {header}

                <div className="touch-pan-y">
                    <div className="relative overflow-hidden rounded-[28px]">
                        <Carousel
                            setApi={setCarouselApi}
                            opts={{ loop: true }}
                            aria-label="Transformations carousel"
                            className="touch-pan-y"
                            onMouseEnter={stopAutoplay}
                            onMouseLeave={startAutoplay}
                            onTouchStart={stopAutoplay}
                            onTouchEnd={startAutoplay}
                            onTouchCancel={startAutoplay}
                        >
                            <CarouselContent className="rounded-[28px] bg-white">
                                {slides.map((slide, slideIndex) => (
                                    <CarouselItem key={slideIndex} className="basis-full bg-white">
                                        <div className="box-border px-4 py-8 sm:px-6 lg:px-12">
                                            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
                                                <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:flex-row sm:justify-center sm:gap-8 lg:w-[60%] lg:min-w-[420px] lg:justify-start lg:gap-8 xl:w-auto xl:min-w-0 xl:justify-center xl:gap-8">
                                                    {(['before', 'after'] as const).map((type) => {
                                                        const isAfter = type === 'after';
                                                        const src = isAfter ? slide.afterImage : slide.beforeImage;
                                                        const label = isAfter ? labels.after : labels.before;
                                                        return (
                                                            <div
                                                                key={type}
                                                                className="flex flex-1 flex-col items-center"
                                                                style={{ minWidth: 0 }}
                                                            >
                                                                <div className="pointer-events-none relative aspect-[3/4] w-full overflow-hidden rounded-[16px] bg-white sm:aspect-[4/5] lg:h-[420px] lg:max-w-[320px] xl:h-[520px] xl:max-w-[489px]">
                                                                    <Image
                                                                        src={src}
                                                                        alt={`${label} transformation`}
                                                                        fill
                                                                        className="object-cover"
                                                                        priority={slideIndex === activeIndex}
                                                                        draggable={false}
                                                                    />
                                                                </div>
                                                                <p className="mt-4 text-base font-semibold text-[#0D1E32]">
                                                                    {label}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="pointer-events-auto flex w-full flex-col rounded-[16px] bg-[#F7FCFC] p-6 sm:p-8 min-h-[320px] sm:h-[360px] sm:max-h-[360px] md:h-[400px] md:max-h-[400px] lg:h-auto lg:w-[40%] lg:flex-none lg:min-h-[420px] lg:max-h-none lg:self-stretch xl:w-auto xl:max-w-[489px] xl:min-h-[520px]">
                                                    <div className="flex items-baseline gap-4">
                                                        <div className="flex-1">
                                                            <QuoteIcon />
                                                        </div>
                                                        <div>
                                                            <h3 className="mt-4 text-2xl font-semibold leading-tight text-[#0D1E32] sm:text-3xl">
                                                                {preventOrphans(slide.quote.title)}
                                                            </h3>
                                                            <div
                                                                className="quote-scroll mt-4 max-h-[180px] overflow-y-auto pr-1 text-base leading-relaxed text-[#0D1E32] italic lg:max-h-none lg:overflow-visible lg:pr-0"
                                                            >
                                                                {slide.quote.body
                                                                    .split('\n')
                                                                    .filter((p) => p.trim().length > 0)
                                                                    .map((paragraph, i) => (
                                                                        <p key={i} className="mb-3">
                                                                            {paragraph.trim()}
                                                                        </p>
                                                                    ))}
                                                            </div>
                                                            <div className="mt-6">
                                                                <p className="text-base font-semibold text-[#0D1E32]">
                                                                    {slide.quote.author}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </div>
                    <div className="mt-3 flex justify-center gap-3 md:mt-6">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`${ariaPrefix ?? 'Go to slide'} ${i + 1}`}
                                aria-current={i === activeIndex}
                                onClick={() => goTo(i)}
                                className={`h-3 w-3 rounded-full transition ${i === activeIndex ? 'bg-[#A05377]' : 'bg-[#D9D9D9]'}`}
                            />
                        ))}
                    </div>
                </div>
                <style jsx global>{`
          .quote-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .quote-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
            </Container>
        </Section>
    );
}
