import express from 'express';
import { createServer } from 'http';
import type { Server } from 'http';
import { join } from 'path';
import { logger } from '../../config/logger.js';

let serverInstance: Server | null = null;

export async function startSlideServer(port: number = 3001): Promise<void> {
  if (serverInstance) return; // Already running

  const app = express();
  const distPath = join(process.cwd(), 'renderer', 'dist');
  const publicPath = join(process.cwd(), 'renderer', 'public');

  // Serve user-uploaded images from renderer/public (e.g. /slides/1.png)
  app.use(express.static(publicPath));
  app.use(express.static(distPath));

  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });

  return new Promise((resolve, reject) => {
    // Use createServer with increased maxHeaderSize for large base64 data URLs
    serverInstance = createServer({ maxHeaderSize: 131072 }, app);
    serverInstance.listen(port, () => {
      logger.info({ port }, '[RENDER] Slide server started');
      resolve();
    });
    serverInstance.on('error', reject);
  });
}

export async function stopSlideServer(): Promise<void> {
  if (!serverInstance) return;

  return new Promise((resolve) => {
    serverInstance!.close(() => {
      serverInstance = null;
      logger.info('[RENDER] Slide server stopped');
      resolve();
    });
  });
}
