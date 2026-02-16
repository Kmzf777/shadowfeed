import { randomInt } from 'crypto';

/** Delay longo entre ações principais (navegar entre contas, etc) */
export function humanDelay(minMs: number = 3000, maxMs: number = 8000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, randomInt(minMs, maxMs)));
}

/** Delay curto entre micro-ações (clicar next, scroll, etc) */
export function shortDelay(minMs: number = 500, maxMs: number = 1500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, randomInt(minMs, maxMs)));
}

/** Delay entre contas para rate limiting */
export function cooldownDelay(): Promise<void> {
  return humanDelay(15000, 30000);
}
