'use client';

import { motion } from 'framer-motion';
import type { MotionProps, MotionStyle } from 'framer-motion';
import type { PropsWithChildren } from 'react';

const ease = [0.22, 1, 0.36, 1];

const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease } },
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease } },
};

type MotionBoxProps = PropsWithChildren<
    MotionProps & {
        className?: string;
        id?: string;
        /**
         * reveal: when true (default) use IntersectionObserver to trigger animation when element enters viewport.
         * When false, animate immediately on mount (useful for hero/above-the-fold).
         */
        reveal?: boolean;
        /**
         * amountOverride: optional override for IntersectionObserver amount threshold (0..1)
         */
        amountOverride?: number;
        /**
         * once: if true (default), element will reveal once and won't hide again when scrolled out.
         */
        once?: boolean;
    }
>;

const DEFAULT_VIEWPORT_MARGIN = '0px 0px -10% 0px';

type ViewportConfig = NonNullable<MotionProps['viewport']>;

const MotionDiv = motion.div;

function buildViewportConfig(amountOverride?: number, once?: boolean): ViewportConfig {
    const config: ViewportConfig =
        typeof amountOverride === 'undefined' && typeof once === 'undefined'
            ? { amount: 0.25, margin: DEFAULT_VIEWPORT_MARGIN, once: true }
            : {
                amount: amountOverride ?? 0.25,
                margin: DEFAULT_VIEWPORT_MARGIN,
            };

    if (typeof once === 'boolean') {
        config.once = once;
    }

    return config;
}

function mergeStyles(base: MotionStyle, incoming?: MotionProps['style']): MotionStyle {
    return incoming ? { ...base, ...(incoming as MotionStyle) } : base;
}

export function FadeInUp({
    children,
    reveal = true,
    amountOverride,
    once = true,
    style,
    viewport: viewportProp,
    ...rest
}: MotionBoxProps) {
    const mergedStyle = mergeStyles(
        { willChange: 'transform, opacity', backfaceVisibility: 'hidden' },
        style,
    );

    if (!reveal) {
        return (
            <MotionDiv
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                style={mergedStyle}
                viewport={viewportProp}
                {...rest}
            >
                {children}
            </MotionDiv>
        );
    }

    const viewport =
        viewportProp === undefined ? buildViewportConfig(amountOverride, once) : viewportProp;

    return (
        <MotionDiv
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeInUp}
            style={mergedStyle}
            {...rest}
        >
            {children}
        </MotionDiv>
    );
}

export function FadeIn({
    children,
    reveal = true,
    amountOverride,
    once = true,
    style,
    viewport: viewportProp,
    ...rest
}: MotionBoxProps) {
    const mergedStyle = mergeStyles(
        { willChange: 'opacity', backfaceVisibility: 'hidden' },
        style,
    );

    if (!reveal) {
        return (
            <MotionDiv
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                style={mergedStyle}
                viewport={viewportProp}
                {...rest}
            >
                {children}
            </MotionDiv>
        );
    }

    const viewport =
        viewportProp === undefined ? buildViewportConfig(amountOverride, once) : viewportProp;

    return (
        <MotionDiv
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeIn}
            style={mergedStyle}
            {...rest}
        >
            {children}
        </MotionDiv>
    );
}

export function ScaleIn({
    children,
    reveal = true,
    amountOverride,
    once = true,
    style,
    viewport: viewportProp,
    ...rest
}: MotionBoxProps) {
    const mergedStyle = mergeStyles(
        { willChange: 'transform, opacity', backfaceVisibility: 'hidden' },
        style,
    );

    if (!reveal) {
        return (
            <MotionDiv
                initial="hidden"
                animate="visible"
                variants={scaleIn}
                style={mergedStyle}
                viewport={viewportProp}
                {...rest}
            >
                {children}
            </MotionDiv>
        );
    }

    const viewport =
        viewportProp === undefined ? buildViewportConfig(amountOverride, once) : viewportProp;

    return (
        <MotionDiv
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={scaleIn}
            style={mergedStyle}
            {...rest}
        >
            {children}
        </MotionDiv>
    );
}

/**
 * Optional group container (if you want to do a grouped staggered reveal).
 * Careful: group-level reveal can re-hide children if you set `viewport.once = false`.
 */
export const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

export function Reveal({
    children,
    viewport,
    style,
    ...rest
}: MotionBoxProps) {
    const mergedStyle = mergeStyles(
        { willChange: 'opacity, transform', backfaceVisibility: 'hidden' },
        style,
    );
    const viewportConfig =
        viewport === undefined ? buildViewportConfig(undefined, true) : viewport;

    return (
        <MotionDiv
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            variants={staggerContainer}
            style={mergedStyle}
            {...rest}
        >
            {children}
        </MotionDiv>
    );
}
