CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Unschedule existing job if it exists (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'keep-alive-daily') THEN
    PERFORM cron.unschedule('keep-alive-daily');
  END IF;
END $$;

-- Schedule keep-alive to run daily at 03:00 UTC
SELECT cron.schedule(
  'keep-alive-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://ismbryaopmkffztxbpoi.supabase.co/functions/v1/keep-alive',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbWJyeWFvcG1rZmZ6dHhicG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTE1MjAsImV4cCI6MjA2ODk2NzUyMH0.3onCSsv9PrB2833KzRIe55k8VHdvPZy1YEKVPKEXf2E"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);