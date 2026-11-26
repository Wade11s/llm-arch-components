import { mkdir, writeFile } from 'node:fs/promises';
import { renderFigure } from '../src/core/renderFigure';
import { gemma3Spec } from '../src/specs/gemma3';
import { gptOss120bSpec } from '../src/specs/gptOss120b';
import { deepSeekV3Spec } from '../src/specs/deepSeekV3';
import { qwen38FlashNextSpec } from '../src/specs/qwen38FlashNext';
import { glm54Spec } from '../src/specs/glm54';

const exports = [
  { slug: 'gemma-3-27b-spec', spec: gemma3Spec },
  { slug: 'gpt-oss-120b-spec', spec: gptOss120bSpec },
  { slug: 'deepseek-v3-spec', spec: deepSeekV3Spec },
  { slug: 'qwen3-8-flash-next-125b-a6b-spec', spec: qwen38FlashNextSpec },
  { slug: 'glm-5-4-spec', spec: glm54Spec },
];

await mkdir('artifacts/svg', { recursive: true });
for (const entry of exports) {
  const result = renderFigure(entry.spec, { idPrefix: `${entry.slug}-export` });
  const path = `artifacts/svg/${entry.slug}.svg`;
  await writeFile(path, result.svg, 'utf8');
  console.log(`- ${path} (${result.scene.elements.length} scene elements)`);
}
