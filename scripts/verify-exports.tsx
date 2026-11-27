import { readFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import { renderFigure as renderSpecFigure } from '../src/core/renderFigure';
import { figureSpecs } from '../src/specs';
import { figureExports, renderFigure as renderGoldenFigure } from './export-figures';

type VerifyCase = {
  slug: string;
  render: () => string;
  requiredElements: string[];
};

const goldenCases: VerifyCase[] = figureExports.map(({ slug }) => ({
  slug,
  render: () => renderGoldenFigure(slug),
  requiredElements: slug === 'gemma-3-27b'
    ? ['backbone', 'repeated-block', 'ffn-inset']
    : ['backbone', 'repeated-block', 'ffn-inset', 'moe-inset'],
}));

const specCases: VerifyCase[] = figureSpecs.map((entry) => ({
  slug: `${entry.slug}-spec`,
  render: () => renderSpecFigure(entry.spec, { idPrefix: `${entry.slug}-spec-export` }).svg,
  requiredElements: entry.slug === 'qwen3-8-flash-next-125b-a6b'
    ? ['mask-grid', 'attention-block', 'gr-read-node', 'gr-write-node']
    : entry.slug === 'glm-5-4'
      ? ['middle-layer-count', 'loop-layer-card', 'moe-expert']
      : entry.slug === 'qwen3-next-80b-a3b' || entry.slug === 'kimi-linear-48b-a3b'
        ? ['repeat-block', 'mixing-attention-inset', 'mixing-delta-inset', 'mixing-conv']
        : entry.slug === 'lfm2-5-8b-a1b'
          ? ['repeat-block', 'moe-inset', 'gqa-head-grid', 'layer-group-box']
          : ['repeat-block', 'ffn-inset'],
}));

const results: Array<Record<string, unknown>> = [];

for (const testCase of [...goldenCases, ...specCases]) {
  const { slug } = testCase;
  const path = `artifacts/svg/${slug}.svg`;
  const svg = await readFile(path, 'utf8');
  if (!svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    throw new Error(`${slug}: missing XML declaration`);
  }
  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    throw new Error(`${slug}: missing SVG namespace`);
  }
  if (!svg.includes('<svg') || !svg.includes('viewBox=')) {
    throw new Error(`${slug}: missing SVG root/viewBox`);
  }
  if (/<image\b|data:image\/|<foreignObject\b/i.test(svg)) {
    throw new Error(`${slug}: figure must contain vector/text content only`);
  }
  if (/\b(?:href|src)=["'](?:https?:|\/)/i.test(svg)) {
    throw new Error(`${slug}: external resource reference found`);
  }
  if (/url\(["']?https?:/i.test(svg)) {
    throw new Error(`${slug}: external CSS resource found`);
  }
  for (const element of testCase.requiredElements) {
    if (!svg.includes(`data-element="${element}"`)) {
      throw new Error(`${slug}: missing data-element ${element}`);
    }
  }
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${slug}: duplicate SVG IDs`);
  }
  const textCount = (svg.match(/<text\b/g) ?? []).length;
  if (textCount < 20) {
    throw new Error(`${slug}: expected real SVG labels, found only ${textCount} text nodes`);
  }
  const first = testCase.render();
  const second = testCase.render();
  if (first !== second || svg !== first) {
    throw new Error(`${slug}: SVG output is not deterministic or does not match export`);
  }
  const rendered = new Resvg(svg, {
    fitTo: { mode: 'width', value: 800 },
    background: 'white',
    font: { loadSystemFonts: true, sansSerifFamily: 'Arial' },
  }).render();
  if (rendered.width !== 800 || rendered.height <= 0) {
    throw new Error(`${slug}: raster validation failed`);
  }
  results.push({
    slug,
    bytes: Buffer.byteLength(svg),
    textNodes: textCount,
    ids: ids.length,
    raster: `${rendered.width}x${rendered.height}`,
    deterministic: true,
    selfContained: true,
  });
}

console.log(JSON.stringify(results, null, 2));
