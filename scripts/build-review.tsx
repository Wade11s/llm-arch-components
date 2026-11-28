import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { parseArgs } from 'node:util';
import { Resvg } from '@resvg/resvg-js';
import { figureSpecs } from '../src/specs';
import { sharpFromFile } from './lib/image';

type ReviewFigure = {
  slug: string;
  title: string;
  reference: string;
  width: number;
  height: number;
};

const goldenFigures: ReviewFigure[] = [
  { slug: 'deepseek-v3', title: 'DeepSeek-V3 (671B)', reference: 'images/deepseek-v3.webp', width: 2786, height: 2725 },
  { slug: 'gemma-3-27b', title: 'Gemma 3 (27B)', reference: 'images/gemma-3-27b.webp', width: 2593, height: 2686 },
  { slug: 'gpt-oss-120b', title: 'gpt-oss (120B)', reference: 'images/gpt-oss-120b.webp', width: 2904, height: 2699 },
];

const figures: ReviewFigure[] = [
  ...goldenFigures,
  ...figureSpecs.map((entry) => ({
    slug: `${entry.slug}-spec`,
    title: `${entry.name} · Spec-driven`,
    reference: `images/${entry.slug}.webp`,
    width: entry.width,
    height: entry.height,
  })),
];

const { values } = parseArgs({
  options: {
    figure: { type: 'string' },
    'out-dir': { type: 'string' },
    'svg-dir': { type: 'string' },
  },
  strict: true,
});

function selectFigures(requested: string | undefined): ReviewFigure[] {
  if (!requested) return figures;
  const exact = figures.find((figure) => figure.slug === requested);
  if (exact) return [exact];
  const specFigure = figures.find((figure) => figure.slug === `${requested}-spec`);
  if (specFigure) return [specFigure];
  throw new Error(`Unknown review figure "${requested}"`);
}

const selectedFigures = selectFigures(values.figure);
const outDir = values['out-dir'] ?? 'artifacts/review';
const svgDir = values['svg-dir'] ?? 'artifacts/svg';

function renderPng(svg: string, width: number): Buffer {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: 'white',
    font: { loadSystemFonts: true, sansSerifFamily: 'Arial' },
  }).render().asPng();
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

await mkdir(outDir, { recursive: true });
const rows: string[] = [];

for (const figure of selectedFigures) {
  const svgPath = `${svgDir}/${figure.slug}.svg`;
  const svg = await readFile(svgPath, 'utf8');
  const reference = await (await sharpFromFile(figure.reference)).png().toBuffer();
  const width = Math.round(figure.width / 2);
  const height = Math.round(figure.height / 2);
  const generatedPng = renderPng(svg, width);
  await writeFile(`${outDir}/${figure.slug}-render.png`, generatedPng);

  const comparisonSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width * 2 + 72}" height="${height + 96}" viewBox="0 0 ${width * 2 + 72} ${height + 96}">
  <rect width="100%" height="100%" fill="#f3f6fa"/>
  <text x="0" y="30" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#172033">${escapeXml(figure.title)} · 50% review</text>
  <text x="0" y="72" font-family="Arial, sans-serif" font-size="15" fill="#58708d">Reference</text>
  <text x="${width + 48}" y="72" font-family="Arial, sans-serif" font-size="15" fill="#58708d">React + SVG</text>
  <image x="0" y="84" width="${width}" height="${height}" href="data:image/png;base64,${reference.toString('base64')}"/>
  <image x="${width + 48}" y="84" width="${width}" height="${height}" href="data:image/png;base64,${generatedPng.toString('base64')}"/>
</svg>
`;
  await writeFile(`${outDir}/${figure.slug}-comparison.svg`, comparisonSvg);
  const comparisonPng = renderPng(comparisonSvg, width * 2 + 72);
  await writeFile(`${outDir}/${figure.slug}-comparison.png`, comparisonPng);
  const standaloneLink = relative(outDir, svgPath).replaceAll('\\', '/');
  rows.push(`<tr><td>${figure.title}</td><td>${width} × ${height}</td><td><a href="${figure.slug}-comparison.svg">comparison SVG</a></td><td><a href="${figure.slug}-comparison.png">comparison PNG</a></td><td><a href="${standaloneLink}">standalone SVG</a></td></tr>`);
}

const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Issue #2 review</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#172033}table{border-collapse:collapse}td,th{border:1px solid #d9e1ec;padding:10px 14px}th{text-align:left}</style></head>
<body><h1>Issue #2 review artifacts</h1><p>Each comparison shows the reference image and the hand-authored React + SVG output at 50% width.</p><table><thead><tr><th>Figure</th><th>Size</th><th>Review</th><th>Raster</th><th>Export</th></tr></thead><tbody>${rows.join('')}</tbody></table></body></html>
`;
await writeFile(`${outDir}/index.html`, html);
console.log(`Review artifacts written to ${outDir}/`);
