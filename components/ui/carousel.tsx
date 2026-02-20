'use client';

import * as React from 'react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { EmblaOptionsType, EmblaPluginType } from 'embla-carousel';

import { cn } from '@/lib/utils';

export type CarouselApi = UseEmblaCarouselType[1];

type CarouselProps = React.HTMLAttributes<HTMLDivElement> & {
    opts?: EmblaOptionsType;
    plugins?: EmblaPluginType[];
    setApi?: (api: CarouselApi) => void;
};

export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(function Carousel(
    { className, children, opts, plugins, setApi, ...props },
    ref,
) {
    const [carouselRef, api] = useEmblaCarousel(opts, plugins);

    React.useEffect(() => {
        if (setApi && api) {
            setApi(api);
        }
    }, [api, setApi]);

    return (
        <div
            ref={ref}
            className={cn('relative', className)}
            role="region"
            aria-roledescription="carousel"
            {...props}
        >
            <div ref={carouselRef} className="overflow-hidden">
                {children}
            </div>
        </div>
    );
});

type CarouselContentProps = React.HTMLAttributes<HTMLDivElement>;

export const CarouselContent = React.forwardRef<HTMLDivElement, CarouselContentProps>(
    function CarouselContent({ className, ...props }, ref) {
        return (
            <div
                ref={ref}
                className={cn('flex -ml-4', className)}
                {...props}
            />
        );
    },
);

type CarouselItemProps = React.HTMLAttributes<HTMLDivElement>;

export const CarouselItem = React.forwardRef<HTMLDivElement, CarouselItemProps>(
    function CarouselItem({ className, ...props }, ref) {
        return (
            <div
                ref={ref}
                className={cn('min-w-0 shrink-0 grow-0 basis-full pl-4', className)}
                {...props}
            />
        );
    },
);
