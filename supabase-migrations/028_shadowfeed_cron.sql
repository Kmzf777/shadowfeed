-- Migration: 028_shadowfeed_cron
-- Supabase pg_cron setup for ShadowFeed automated publishing.
-- Runs every minute; calls the publish-check webhook which checks the queue
-- and triggers the Playwright publisher for due approved posts.
--
-- PREREQUISITES:
--   1. pg_cron extension enabled in Supabase (Database → Extensions → pg_cron)
--   2. pg_net extension enabled for HTTP calls (Database → Extensions → pg_net)
--   3. Set the webhook URL app setting with admin token in query param:
--
--        ALTER DATABASE postgres
--          SET "app.settings.shadowfeed_publish_webhook" =
--            'https://YOUR_APP_URL/api/forge-shadowfeed/publish-check?token=YOUR_ADMIN_TOKEN';
--
--      Replace YOUR_APP_URL and YOUR_ADMIN_TOKEN with actual values.
--      In development, point to your ngrok/tunnel URL.

-- Enable pg_net for outbound HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule publish-check to run every minute (AC6)
-- Unschedule first if exists (idempotent re-run)
SELECT cron.unschedule('shadowfeed-publish-check');

SELECT cron.schedule(
  'shadowfeed-publish-check',
  '* * * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.settings.shadowfeed_publish_webhook'),
      body    := '{}'::jsonb,
      headers := '{"Content-Type": "application/json"}'::jsonb
    )
  $$
);

-- Verify the job was registered
SELECT jobid, jobname, schedule, command
FROM cron.job
WHERE jobname = 'shadowfeed-publish-check';
