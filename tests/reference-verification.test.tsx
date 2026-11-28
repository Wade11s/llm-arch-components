import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'bun:test';
import { figureSpecs } from '../src/specs';
import { runScript } from './helpers/runScript';

const slug = 'gemma-3-27b';

test('verify:reference generates comparison, crops, metrics, Markdown, and a pending manifest', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'llm-arch-reference-'));
  const outDir = join(directory, 'review');
  const manifest = join(directory, 'reference-verification.json');

  try {
    await runScript('scripts/verify-reference.tsx', [slug, '--out-dir', outDir, '--manifest', manifest]);

    const files = await readdir(outDir);
    expect(files).toContain(`${slug}-spec-comparison.png`);
    expect(files).toContain(`${slug}-reference-verification.md`);
    expect(files.filter((file) => file.includes('-crop-') && file.endsWith('.png')).length).toBeGreaterThanOrEqual(2);
    expect(files.some((file) => file.includes('-crop-attention.png'))).toBe(true);
    expect(files.some((file) => file.includes('-crop-ffn-inset.png'))).toBe(true);

    const parsed = JSON.parse(await readFile(manifest, 'utf8'));
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.figures).toHaveLength(figureSpecs.length);
    expect(parsed.figures.every((figure: { status: string }) => figure.status === 'pending')).toBe(true);

    const selected = parsed.figures.find((figure: { slug: string }) => figure.slug === slug);
    expect(selected.status).toBe('pending');
    expect(selected.reference.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(selected.svg.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(selected.metrics.pixelDiffMean).toBeGreaterThanOrEqual(0);
    expect(selected.metrics.pixelDiffMean).toBeLessThanOrEqual(1);
    expect(selected.metrics.edgeDiffMean).toBeGreaterThanOrEqual(0);
    expect(selected.metrics.edgeDiffMean).toBeLessThanOrEqual(1);

    const report = await readFile(join(outDir, `${slug}-reference-verification.md`), 'utf8');
    expect(report).toContain('pixelDiffMean');
    expect(report).toContain('edgeDiffMean');
    expect(report).toContain('pending');

    selected.baseline = {
      referenceSha256: selected.reference.sha256,
      svgSha256: selected.svg.sha256,
      metrics: { pixelDiffMean: 0, edgeDiffMean: 0 },
    };
    selected.metrics = { pixelDiffMean: 0, edgeDiffMean: 0 };
    await writeFile(manifest, JSON.stringify(parsed), 'utf8');
    await runScript('scripts/verify-reference.tsx', [slug, '--out-dir', outDir, '--manifest', manifest]);
    const driftReport = await readFile(join(outDir, `${slug}-reference-verification.md`), 'utf8');
    expect(driftReport).toContain('metric-drift');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 30_000);

test('verify:reference rejects an empty checklist when signing', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'llm-arch-reference-'));
  const checklist = join(directory, 'checklist.json');

  try {
    await writeFile(checklist, '{}', 'utf8');
    await expect(runScript('scripts/verify-reference.tsx', [
      slug,
      '--out-dir', join(directory, 'review'),
      '--manifest', join(directory, 'reference-verification.json'),
      '--status', 'accepted-difference',
      '--reviewer', 'test-agent',
      '--accepted-difference', 'test',
      '--checklist', checklist,
    ])).rejects.toThrow('must mark structure, text, connections, insets, visualHierarchy, crops');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 5_000);

test('verify:reference requires a reviewer before recording a pass', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'llm-arch-reference-'));

  try {
    await expect(runScript('scripts/verify-reference.tsx', [
      slug,
      '--out-dir', join(directory, 'review'),
      '--manifest', join(directory, 'reference-verification.json'),
      '--status', 'pass',
    ])).rejects.toThrow('--reviewer is required');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 5_000);
