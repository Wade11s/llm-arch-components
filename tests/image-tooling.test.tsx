import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'bun:test';
import sharp from 'sharp';
import { sharpFromFile } from '../scripts/lib/image';
import { runScript } from './helpers/runScript';

const reference = 'images/tencent-hy4-770b-a49b.webp';

test('sharpFromFile reads reference images through a Buffer input', async () => {
  const image = await sharpFromFile(reference);
  const metadata = await image.metadata();

  expect(metadata.width).toBe(3834);
  expect(metadata.height).toBe(2949);
}, 2_000);

test('image:crop creates a PNG crop without an ad-hoc Sharp script', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'llm-arch-crop-'));
  const output = join(directory, 'tencent-crop.png');

  try {
    await runScript('scripts/crop-image.tsx', [
      '--source', reference,
      '--left', '1350',
      '--top', '450',
      '--width', '900',
      '--height', '2000',
      '--resize-width', '700',
      '--out', output,
    ]);

    const png = await readFile(output);
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    const metadata = await (await sharpFromFile(output)).metadata();
    expect(metadata.width).toBe(700);
    expect(metadata.height).toBe(1556);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 5_000);

test('image:crop preserves all cropped pixels when both resize dimensions are set', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'llm-arch-crop-'));
  const source = join(directory, 'source.png');
  const output = join(directory, 'resized.png');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect width="10" height="50" fill="red"/><rect x="10" width="80" height="50" fill="green"/><rect x="90" width="10" height="50" fill="blue"/></svg>`);

  try {
    await sharp(svg).png().toFile(source);
    await runScript('scripts/crop-image.tsx', [
      '--source', source,
      '--left', '0',
      '--top', '0',
      '--width', '100',
      '--height', '50',
      '--resize-width', '50',
      '--resize-height', '50',
      '--out', output,
    ]);

    const { data, info } = await (await sharpFromFile(output)).raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => data[(y * info.width + x) * info.channels];
    expect(info.width).toBe(50);
    expect(info.height).toBe(50);
    expect(pixel(0, 25)).toBeGreaterThan(200);
    expect(pixel(49, 25)).toBeLessThan(50);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 5_000);
