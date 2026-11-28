import { readFile } from 'node:fs/promises';
import sharp, { type Sharp } from 'sharp';

/**
 * Sharp's path input can hang under Bun. Always pass a Buffer instead.
 */
export async function sharpFromFile(path: string): Promise<Sharp> {
  return sharp(await readFile(path));
}
