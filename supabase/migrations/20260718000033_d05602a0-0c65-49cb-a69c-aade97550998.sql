
-- 1. Rewrite public schema RLS policies to use (select auth.uid()) form
DO $$
DECLARE
  r RECORD;
  new_qual TEXT;
  new_check TEXT;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'completed_exercises','daily_steps','exercises','food_items',
        'personal_records','user_goals','user_preferences','user_profiles',
        'user_settings','user_stats','water_intake','workout_plans',
        'workout_sessions','workout_types'
      )
  LOOP
    new_qual := regexp_replace(COALESCE(r.qual, ''), 'auth\.uid\(\)', '(select auth.uid())', 'g');
    new_check := regexp_replace(COALESCE(r.with_check, ''), 'auth\.uid\(\)', '(select auth.uid())', 'g');

    IF r.qual IS NOT NULL AND r.with_check IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)',
        r.policyname, r.schemaname, r.tablename, new_qual, new_check);
    ELSIF r.qual IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)',
        r.policyname, r.schemaname, r.tablename, new_qual);
    ELSIF r.with_check IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        r.policyname, r.schemaname, r.tablename, new_check);
    END IF;
  END LOOP;
END $$;

-- 2. Rewrite realtime.messages policy
ALTER POLICY "Users can only access their own realtime topics" ON realtime.messages
USING (
  (realtime.topic() = ((select auth.uid()))::text)
  OR (realtime.topic() LIKE (((select auth.uid()))::text || ':%'))
);

-- 3. Covering indexes for unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_completed_exercises_user_id ON public.completed_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON public.exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON public.workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_plan_id ON public.workout_sessions(plan_id);
