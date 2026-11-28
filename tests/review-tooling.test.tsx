import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'bun:test';
import { runScript } from './helpers/runScript';

const slug = 'tencent-hy4-770b-a49b';

test('review --figure generates only the selected figure artifacts', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'llm-arch-review-'));

  try {
    await runScript('scripts/export-spec-figures.tsx');
    await runScript('scripts/build-review.tsx', ['--figure', slug, '--out-dir', outDir]);

    const selectedComparison = join(outDir, `${slug}-spec-comparison.png`);
    const otherComparison = join(outDir, 'deepseek-v3-spec-comparison.png');
    expect(await Bun.file(selectedComparison).exists()).toBe(true);
    expect(await Bun.file(otherComparison).exists()).toBe(false);

    const index = await readFile(join(outDir, 'index.html'), 'utf8');
    expect(index).toContain(`${slug}-spec-comparison.png`);
    expect(index).not.toContain('deepseek-v3-spec-comparison.png');
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
}, 30_000);
