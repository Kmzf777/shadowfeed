import { mkdir, writeFile, rm, access } from 'fs/promises';
import { join } from 'path';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

/** Cria diretório de output para um post */
export async function createPostOutputDir(postId: string): Promise<string> {
  const dateDir = new Date().toISOString().split('T')[0];
  const outputDir = join(env.OUTPUT_DIR, dateDir, postId);
  await mkdir(outputDir, { recursive: true });
  logger.info({ outputDir }, '[FILE] Output directory created');
  return outputDir;
}

/** Salva arquivo no diretório de output */
export async function saveFile(
  dir: string,
  filename: string,
  data: Buffer | string
): Promise<string> {
  const filepath = join(dir, filename);
  await writeFile(filepath, data);
  return filepath;
}

/** Salva metadata.json no diretório de output */
export async function saveMetadata(
  dir: string,
  data: Record<string, unknown>
): Promise<string> {
  return saveFile(dir, 'metadata.json', JSON.stringify(data, null, 2));
}

/** Remove diretório de output de um post */
export async function cleanupPostOutput(postId: string, date?: string): Promise<void> {
  const dateDir = date || new Date().toISOString().split('T')[0];
  const outputDir = join(env.OUTPUT_DIR, dateDir, postId);

  try {
    await access(outputDir);
    await rm(outputDir, { recursive: true, force: true });
    logger.info({ outputDir }, '[FILE] Output directory removed');
  } catch {
    logger.warn({ outputDir }, '[FILE] Output directory not found for cleanup');
  }
}

/** Garante que o diretório base de output existe */
export async function ensureOutputDir(): Promise<void> {
  await mkdir(env.OUTPUT_DIR, { recursive: true });
}
