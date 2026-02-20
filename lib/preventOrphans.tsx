/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export function preventOrphans(text: string) {
    const words = text.trim().split(' ');
    if (words.length <= 2) return text;

    const lastTwo = words.slice(-2).join(' ');
    const firstPart = words.slice(0, -2).join(' ');

    return (
        <>
            {firstPart} <span style={{ whiteSpace: 'nowrap' }}>{lastTwo}</span>
        </>
    );
}

export function preventOrphansHTML(html: string): string {
    if (!html || typeof html !== 'string') return html;

    // Split HTML into tags and text nodes so we can operate on the last text node
    const tokens = html.split(/(<[^>]+>)/g);
    for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i];
        if (!token || token.startsWith('<')) continue;

        const trimmed = token.replace(/\s+([^\s<]+)\s*$/u, '\u00A0$1');
        if (trimmed !== token) {
            tokens[i] = trimmed;
            return tokens.join('');
        }
    }

    return html;
}
