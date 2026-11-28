import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import sharp from 'sharp';
import { figureSpecs } from '../../src/specs';
import { sharpFromFile } from './image';

export const referenceVerificationStatuses = ['pending', 'pass', 'accepted-difference', 'fail'] as const;
export type ReferenceVerificationStatus = typeof referenceVerificationStatuses[number];

export type ReferenceVerificationEntry = {
  slug: string;
  status: ReferenceVerificationStatus;
  reference?: {
    path: string;
    sha256: string;
    width: number;
    height: number;
  };
  svg?: {
    path: string;
    sha256: string;
  };
  metrics?: {
    pixelDiffMean: number;
    edgeDiffMean: number;
  };
  reviewer?: string;
  reviewedAt?: string;
  artifacts?: {
    comparison: string;
    crops: string[];
    report: string;
  };
  acceptedDifferences?: string[];
};

export type ReferenceVerificationManifest = {
  schemaVersion: 1;
  figures: ReferenceVerificationEntry[];
};

export function createReferenceVerificationManifest(): ReferenceVerificationManifest {
  return {
    schemaVersion: 1,
    figures: figureSpecs.map((entry) => ({ slug: entry.slug, status: 'pending' })),
  };
}

export async function loadReferenceVerificationManifest(path: string): Promise<ReferenceVerificationManifest> {
  let manifest: ReferenceVerificationManifest;
  try {
    manifest = JSON.parse(await readFile(path, 'utf8')) as ReferenceVerificationManifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    manifest = createReferenceVerificationManifest();
  }

  const bySlug = new Map(manifest.figures.map((figure) => [figure.slug, figure]));
  for (const figure of createReferenceVerificationManifest().figures) {
    if (!bySlug.has(figure.slug)) {
      bySlug.set(figure.slug, figure);
      manifest.figures.push(figure);
    }
  }
  return manifest;
}

export async function writeReferenceVerificationManifest(
  path: string,
  manifest: ReferenceVerificationManifest,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

export function sha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex');
}

type Raster = {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
};

async function halfSizeRgba(path: string, width: number, height: number): Promise<Raster> {
  const { data, info } = await (await sharpFromFile(path))
    .resize({ width: Math.round(width / 2), height: Math.round(height / 2), fit: 'fill' })
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function edgeMap(raster: Raster): Uint8Array {
  const luminance = new Uint8Array(raster.width * raster.height);
  for (let index = 0; index < luminance.length; index += 1) {
    const offset = index * raster.channels;
    luminance[index] = Math.round(
      raster.data[offset] * 0.2126
      + raster.data[offset + 1] * 0.7152
      + raster.data[offset + 2] * 0.0722,
    );
  }

  const edges = new Uint8Array(luminance.length);
  for (let y = 0; y < raster.height - 1; y += 1) {
    for (let x = 0; x < raster.width - 1; x += 1) {
      const index = y * raster.width + x;
      edges[index] = Math.min(
        255,
        Math.abs(luminance[index + 1] - luminance[index])
          + Math.abs(luminance[index + raster.width] - luminance[index]),
      );
    }
  }
  return edges;
}

export async function computeReferenceMetrics(
  referencePath: string,
  renderPath: string,
  width: number,
  height: number,
): Promise<{ pixelDiffMean: number; edgeDiffMean: number }> {
  const [reference, render] = await Promise.all([
    halfSizeRgba(referencePath, width, height),
    halfSizeRgba(renderPath, width, height),
  ]);

  let pixelDifference = 0;
  for (let index = 0; index < reference.width * reference.height; index += 1) {
    const offset = index * reference.channels;
    pixelDifference += Math.abs(reference.data[offset] - render.data[offset]);
    pixelDifference += Math.abs(reference.data[offset + 1] - render.data[offset + 1]);
    pixelDifference += Math.abs(reference.data[offset + 2] - render.data[offset + 2]);
  }

  const [referenceEdges, renderEdges] = [edgeMap(reference), edgeMap(render)];
  let edgeDifference = 0;
  for (let index = 0; index < referenceEdges.length; index += 1) {
    edgeDifference += Math.abs(referenceEdges[index] - renderEdges[index]);
  }

  const pixels = reference.width * reference.height;
  return {
    pixelDiffMean: Number((pixelDifference / (pixels * 3 * 255)).toFixed(6)),
    edgeDiffMean: Number((edgeDifference / (pixels * 255)).toFixed(6)),
  };
}

type CropRegion = {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export function referenceCropRegions(width: number, height: number): CropRegion[] {
  const regions: CropRegion[] = [];
  const overlap = 40;
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const left = Math.max(0, Math.floor(column * width / 2) - overlap);
      const top = Math.max(0, Math.floor(row * height / 3) - overlap);
      const right = Math.min(width, Math.floor((column + 1) * width / 2) + overlap);
      const bottom = Math.min(height, Math.floor((row + 1) * height / 3) + overlap);
      regions.push({
        name: `${['top', 'middle', 'bottom'][row]}-${column === 0 ? 'left' : 'right'}`,
        left,
        top,
        width: right - left,
        height: bottom - top,
      });
    }
  }
  return regions;
}

export async function writeReferenceCrops(
  referencePath: string,
  renderPath: string,
  outDir: string,
  slug: string,
  width: number,
  height: number,
): Promise<string[]> {
  const paths: string[] = [];
  for (const region of referenceCropRegions(width, height)) {
    const geometry = {
      left: region.left,
      top: region.top,
      width: region.width,
      height: region.height,
    };
    const [reference, render] = await Promise.all([
      (await sharpFromFile(referencePath)).extract(geometry).png().toBuffer(),
      (await sharpFromFile(renderPath)).extract(geometry).png().toBuffer(),
    ]);
    const path = `${outDir}/${slug}-crop-${region.name}.png`;
    await sharp({
      create: {
        width: region.width * 2 + 32,
        height: region.height,
        channels: 4,
        background: '#f3f6fa',
      },
    }).composite([
      { input: reference, left: 0, top: 0 },
      { input: render, left: region.width + 32, top: 0 },
    ]).png().toFile(path);
    paths.push(path);
  }
  return paths;
}

export function referenceMetricDriftWarnings(
  baseline: ReferenceVerificationEntry['metrics'] | undefined,
  current: NonNullable<ReferenceVerificationEntry['metrics']>,
): string[] {
  if (!baseline) return [];
  const warnings: string[] = [];
  const threshold = 0.01;
  if (current.pixelDiffMean > baseline.pixelDiffMean + threshold) {
    warnings.push(`metric-drift: pixelDiffMean increased from ${baseline.pixelDiffMean} to ${current.pixelDiffMean}`);
  }
  if (current.edgeDiffMean > baseline.edgeDiffMean + threshold) {
    warnings.push(`metric-drift: edgeDiffMean increased from ${baseline.edgeDiffMean} to ${current.edgeDiffMean}`);
  }
  return warnings;
}

export function referenceVerificationReport(input: {
  name: string;
  entry: ReferenceVerificationEntry;
  hardGates: Array<{ label: string; pass: boolean }>;
  warnings: string[];
  driftWarnings?: string[];
}): string {
  const { entry } = input;
  const reviewed = entry.status === 'pass' || entry.status === 'accepted-difference';
  const mark = (pass: boolean) => pass ? 'x' : ' ';
  const lines = [
    `# Reference Verification: ${input.name}`,
    '',
    `- Slug: \`${entry.slug}\``,
    `- Status: \`${entry.status}\``,
    `- Reviewer: ${entry.reviewer ?? 'pending'}`,
    `- Reviewed at: ${entry.reviewedAt ?? 'pending'}`,
    `- Reference SHA-256: \`${entry.reference?.sha256 ?? 'pending'}\``,
    `- SVG SHA-256: \`${entry.svg?.sha256 ?? 'pending'}\``,
    `- pixelDiffMean: ${entry.metrics?.pixelDiffMean ?? 'pending'}`,
    `- edgeDiffMean: ${entry.metrics?.edgeDiffMean ?? 'pending'}`,
    '',
    '## Hard gates',
    '',
    ...input.hardGates.map((gate) => `- [${mark(gate.pass)}] ${gate.label}`),
    '',
    '## Structured visual review',
    '',
    `- [${mark(reviewed)}] 50% full-figure comparison reviewed`,
    `- [${mark(reviewed)}] 100% crop review covers text, connectors, and insets`,
    `- [${mark(reviewed)}] Structure and visual hierarchy match the reference`,
    `- [${mark(reviewed)}] Text, connections, and callouts are free of clipping and collision`,
    '',
    '## Accepted differences',
    '',
    ...(entry.acceptedDifferences?.length
      ? entry.acceptedDifferences.map((difference) => `- ${difference}`)
      : ['- None recorded']),
    '',
    '## Diagnostics warnings',
    '',
    ...(input.warnings.length ? input.warnings.map((warning) => `- ${warning}`) : ['- None']),
    '',
    '## Metric drift warnings',
    '',
    ...(input.driftWarnings?.length ? input.driftWarnings.map((warning) => `- ${warning}`) : ['- None']),
    '',
    '## Artifacts',
    '',
    `- 50% comparison: \`${entry.artifacts?.comparison ?? 'pending'}\``,
    `- 100% crops: ${entry.artifacts?.crops.length ?? 0}`,
    `- Report: \`${entry.artifacts?.report ?? 'pending'}\``,
    '',
    'This report records agent evidence and is not a human GitHub approval.',
    '',
  ];
  return lines.join('\n');
}
