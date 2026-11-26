import type { FontSpec, TextMetrics, TextSpan } from './types';

/** Deterministic text metrics for SSR and visual tests; no browser measurement. */
export const systemTextMetrics: TextMetrics = {
  measure(span: TextSpan, font: FontSpec): number {
    let width = 0;
    for (const character of span.text) {
      if (character === ' ') width += 0.28;
      else if (/[iljI.,'`:;!|]/.test(character)) width += 0.28;
      else if (/[mwMW@]/.test(character)) width += 0.82;
      else if (/[A-Z]/.test(character)) width += 0.66;
      else width += 0.53;
    }
    const weightFactor = font.weight >= 700 || span.emphasis === 'bold' ? 1.04 : 1;
    return width * font.size * weightFactor;
  },
  lineHeight(font: FontSpec): number {
    return Math.round(font.size * 1.25);
  },
};
