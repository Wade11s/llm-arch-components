import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'bun:test';
import { sharpFromFile } from '../scripts/lib/image';

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
    const child = Bun.spawn([
      process.execPath,
      'scripts/crop-image.tsx',
      '--source', reference,
      '--left', '1350',
      '--top', '450',
      '--width', '900',
      '--height', '2000',
      '--resize-width', '700',
      '--out', output,
    ], { stdout: 'pipe', stderr: 'pipe' });
    const [exitCode, stderr] = await Promise.all([
      child.exited,
      new Response(child.stderr).text(),
    ]);

    if (exitCode !== 0) throw new Error(stderr);

    const png = await readFile(output);
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    const metadata = await (await sharpFromFile(output)).metadata();
    expect(metadata.width).toBe(700);
    expect(metadata.height).toBe(1556);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 5_000);
