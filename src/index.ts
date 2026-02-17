import express from 'express'; // Restart trigger 2
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestLogger } from './shared/middleware/request-logger.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import { startScheduler } from './modules/pipeline/scheduler.js';
import { runPipeline } from './modules/pipeline/pipeline.service.js';
import routes from './routes/index.js';

const app = express();

// Middlewares
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});
// Skip JSON parsing for Stripe webhook (needs raw body for signature verification)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/credits/webhook') {
    return next();
  }
  express.json()(req, res, next);
});
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use(routes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV },
    `[SHADOWFEED] Server operational on port ${env.PORT}`
  );

  // Start cron scheduler
  if (env.NODE_ENV !== 'test') {
    startScheduler();
  }

  // Auto-run pipeline on startup if enabled
  if (env.AUTO_PIPELINE) {
    logger.info('[SHADOWFEED] AUTO_PIPELINE enabled — starting full pipeline...');
    runPipeline()
      .then((result) => {
        logger.info(
          {
            success: result.success,
            recon: result.recon.total_collected,
            slides: result.forge?.slides ?? 0,
            pngs: result.render?.paths?.length ?? 0,
            duration: `${(result.duration_ms / 1000).toFixed(1)}s`,
          },
          '[SHADOWFEED] Auto pipeline finished'
        );
      })
      .catch((err) => {
        logger.error({ error: (err as Error).message }, '[SHADOWFEED] Auto pipeline failed');
      });
  }
});

export default app;
