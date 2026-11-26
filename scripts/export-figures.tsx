import { mkdir, writeFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeepSeekV3 } from '../fixtures/golden/figures/DeepSeekV3';
import { Gemma3 } from '../fixtures/golden/figures/Gemma3';
import { GptOss120b } from '../fixtures/golden/figures/GptOss120b';
import type { FigureProps } from '../fixtures/golden/figures/types';

type FigureExport = {
  slug: string;
  Component: (props: FigureProps) => React.ReactNode;
};

export const figureExports: FigureExport[] = [
  { slug: 'deepseek-v3', Component: DeepSeekV3 },
  { slug: 'gemma-3-27b', Component: Gemma3 },
  { slug: 'gpt-oss-120b', Component: GptOss120b },
];

export function renderFigure(slug: string): string {
  const figure = figureExports.find((entry) => entry.slug === slug);
  if (!figure) throw new Error(`Unknown figure: ${slug}`);
  const markup = renderToStaticMarkup(<figure.Component idPrefix={`${slug}-export`} />, {
    identifierPrefix: `${slug}-export`,
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}\n`;
}

export async function exportFigures(outDir = 'artifacts/svg'): Promise<string[]> {
  await mkdir(outDir, { recursive: true });
  const paths: string[] = [];
  for (const { slug } of figureExports) {
    const path = `${outDir}/${slug}.svg`;
    await writeFile(path, renderFigure(slug), 'utf8');
    paths.push(path);
  }
  return paths;
}

if (import.meta.main) {
  const paths = await exportFigures();
  console.log(`Exported ${paths.length} standalone SVG files:`);
  for (const path of paths) console.log(`- ${path}`);
}
