import { readFile, rm } from 'node:fs/promises';
import { expect, test } from 'bun:test';

const slug = 'tencent-hy4-770b-a49b';
const selectedComparison = `artifacts/review/${slug}-spec-comparison.png`;
const otherComparison = 'artifacts/review/deepseek-v3-spec-comparison.png';

async function run(script: string, args: string[] = []): Promise<void> {
  const child = Bun.spawn([process.execPath, script, ...args], { stdout: 'pipe', stderr: 'pipe' });
  const [exitCode, stderr] = await Promise.all([
    child.exited,
    new Response(child.stderr).text(),
  ]);
  if (exitCode !== 0) throw new Error(stderr);
}

test('review --figure generates only the selected figure artifacts', async () => {
  await run('scripts/export-spec-figures.tsx');
  await rm(selectedComparison, { force: true });
  await rm(otherComparison, { force: true });

  await run('scripts/build-review.tsx', ['--figure', slug]);

  expect(await Bun.file(selectedComparison).exists()).toBe(true);
  expect(await Bun.file(otherComparison).exists()).toBe(false);

  const index = await readFile('artifacts/review/index.html', 'utf8');
  expect(index).toContain(`${slug}-spec-comparison.png`);
  expect(index).not.toContain('deepseek-v3-spec-comparison.png');
}, 15_000);
