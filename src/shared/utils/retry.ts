import { logger } from '../../config/logger.js';

interface RetryOptions {
  retries: number;
  delay: number;
  backoffMultiplier?: number;
  label?: string;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { retries, delay, backoffMultiplier = 2, label = 'retry' } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;

      if (attempt === retries) break;

      const waitTime = delay * Math.pow(backoffMultiplier, attempt);
      logger.warn(
        {
          label,
          attempt: attempt + 1,
          maxRetries: retries,
          waitMs: waitTime,
          error: lastError.message,
        },
        `[${label}] Attempt failed, retrying...`
      );

      await new Promise((r) => setTimeout(r, waitTime));
    }
  }

  throw lastError!;
}
