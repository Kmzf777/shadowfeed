import cron from 'node-cron';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { runPipeline } from './pipeline.service.js';
import { dripFreeTokens } from '../credits/credits.service.js';

let scheduledTask: cron.ScheduledTask | null = null;
let dripTask: cron.ScheduledTask | null = null;

export function startScheduler(): void {
  const schedule = env.CRON_RECON_SCHEDULE;

  if (!cron.validate(schedule)) {
    logger.error({ schedule }, '[SCHEDULER] Invalid cron expression');
    return;
  }

  scheduledTask = cron.schedule(schedule, async () => {
    logger.info('[SCHEDULER] Scheduled pipeline execution started');
    try {
      const result = await runPipeline();
      logger.info(
        { success: result.success, duration: result.duration_ms },
        '[SCHEDULER] Scheduled pipeline complete'
      );
    } catch (err) {
      logger.error(
        { error: (err as Error).message },
        '[SCHEDULER] Scheduled pipeline failed'
      );
    }
  });

  // Free token drip — runs daily at 6 AM UTC
  dripTask = cron.schedule('0 6 * * *', async () => {
    logger.info('[SCHEDULER] Free token drip started');
    try {
      const dripped = await dripFreeTokens();
      logger.info({ dripped }, '[SCHEDULER] Free token drip complete');
    } catch (err) {
      logger.error(
        { error: (err as Error).message },
        '[SCHEDULER] Free token drip failed'
      );
    }
  });

  logger.info({ schedule }, '[SCHEDULER] Pipeline scheduler active');
}

export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
  if (dripTask) {
    dripTask.stop();
    dripTask = null;
  }
  logger.info('[SCHEDULER] Scheduler stopped');
}
