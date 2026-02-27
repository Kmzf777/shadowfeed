import express from 'express'; // Restart trigger 2
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestLogger } from './shared/middleware/request-logger.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import routes from './routes/index.js';

const app = express();

// Middlewares
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-sf-admin-token');
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


});

export default app;
