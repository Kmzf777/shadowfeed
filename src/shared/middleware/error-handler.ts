import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({ err: err.message, stack: err.stack }, '[ERROR] Unhandled error');

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
