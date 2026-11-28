import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { sharpFromFile } from './lib/image';

const usage = `Usage: bun scripts/crop-image.tsx \\
  --source <image> --left <px> --top <px> --width <px> --height <px> \\
  --out <file> [--resize-width <px>] [--resize-height <px>]`;

function integerOption(value: string | undefined, name: string): number {
  if (value === undefined) throw new Error(`Missing required --${name}\n${usage}`);
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`--${name} must be an integer, got "${value}"`);
  return parsed;
}

function optionalIntegerOption(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = integerOption(value, name);
  if (parsed <= 0) throw new Error(`--${name} must be positive`);
  return parsed;
}

const { values } = parseArgs({
  options: {
    source: { type: 'string' },
    left: { type: 'string' },
    top: { type: 'string' },
    width: { type: 'string' },
    height: { type: 'string' },
    out: { type: 'string' },
    'resize-width': { type: 'string' },
    'resize-height': { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
});

if (values.help) {
  console.log(usage);
  process.exit(0);
}

const source = values.source;
const out = values.out;
if (!source) throw new Error(`Missing required --source\n${usage}`);
if (!out) throw new Error(`Missing required --out\n${usage}`);

const left = integerOption(values.left, 'left');
const top = integerOption(values.top, 'top');
const width = integerOption(values.width, 'width');
const height = integerOption(values.height, 'height');
if (left < 0 || top < 0) throw new Error('--left and --top must be non-negative');
if (width <= 0 || height <= 0) throw new Error('--width and --height must be positive');

const resizeWidth = optionalIntegerOption(values['resize-width'], 'resize-width');
const resizeHeight = optionalIntegerOption(values['resize-height'], 'resize-height');

const image = await sharpFromFile(source);
const metadata = await image.metadata();
if (!metadata.width || !metadata.height) throw new Error(`Could not read image dimensions: ${source}`);
if (left + width > metadata.width || top + height > metadata.height) {
  throw new Error(`Crop ${width}x${height} at ${left},${top} exceeds ${metadata.width}x${metadata.height} source`);
}

let pipeline = image.extract({ left, top, width, height });
if (resizeWidth !== undefined || resizeHeight !== undefined) {
  pipeline = pipeline.resize({ width: resizeWidth, height: resizeHeight });
}

await mkdir(dirname(out), { recursive: true });
await pipeline.png().toFile(out);
console.log(out);
