-- One-off seed: 14 days of demo step data for the active guest user, used to verify the calendar renders totals.
INSERT INTO public.daily_steps (user_id, date, steps)
SELECT
  '4f942994-12b4-47a4-9ee4-7e5830e6d556'::uuid,
  (CURRENT_DATE - (n || ' days')::interval)::date,
  (5000 + floor(random() * 8000))::int
FROM generate_series(0, 13) n
ON CONFLICT (user_id, date) DO UPDATE SET steps = EXCLUDED.steps;