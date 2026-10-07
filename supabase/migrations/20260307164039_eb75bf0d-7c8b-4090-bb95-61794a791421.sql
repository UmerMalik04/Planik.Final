
-- Fix all RLS policies: drop RESTRICTIVE, recreate as PERMISSIVE
-- completed_exercises
DROP POLICY IF EXISTS "Users can create their own completed exercises" ON public.completed_exercises;
DROP POLICY IF EXISTS "Users can delete their own completed exercises" ON public.completed_exercises;
DROP POLICY IF EXISTS "Users can update their own completed exercises" ON public.completed_exercises;
DROP POLICY IF EXISTS "Users can view their own completed exercises" ON public.completed_exercises;

CREATE POLICY "Users can create their own completed exercises" ON public.completed_exercises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own completed exercises" ON public.completed_exercises FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own completed exercises" ON public.completed_exercises FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own completed exercises" ON public.completed_exercises FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- daily_steps
DROP POLICY IF EXISTS "Users can insert their own steps" ON public.daily_steps;
DROP POLICY IF EXISTS "Users can update their own steps" ON public.daily_steps;
DROP POLICY IF EXISTS "Users can view their own steps" ON public.daily_steps;

CREATE POLICY "Users can insert their own steps" ON public.daily_steps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own steps" ON public.daily_steps FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own steps" ON public.daily_steps FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own steps" ON public.daily_steps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- exercises
DROP POLICY IF EXISTS "Users can create their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can delete their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can update their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can view their own exercises" ON public.exercises;

CREATE POLICY "Users can create their own exercises" ON public.exercises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exercises" ON public.exercises FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own exercises" ON public.exercises FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own exercises" ON public.exercises FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- food_items
DROP POLICY IF EXISTS "Users can create their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can delete their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can update their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can view their own food items" ON public.food_items;

CREATE POLICY "Users can create their own food items" ON public.food_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own food items" ON public.food_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own food items" ON public.food_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own food items" ON public.food_items FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- personal_records
DROP POLICY IF EXISTS "Users can create their own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Users can delete their own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Users can update their own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Users can view their own personal records" ON public.personal_records;

CREATE POLICY "Users can create their own personal records" ON public.personal_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own personal records" ON public.personal_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own personal records" ON public.personal_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own personal records" ON public.personal_records FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_goals
DROP POLICY IF EXISTS "Users can create their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.user_goals;

CREATE POLICY "Users can create their own goals" ON public.user_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.user_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.user_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own goals" ON public.user_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_preferences
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_settings
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;

CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_stats
DROP POLICY IF EXISTS "Users can create their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_stats;

CREATE POLICY "Users can create their own stats" ON public.user_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON public.user_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own stats" ON public.user_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- water_intake
DROP POLICY IF EXISTS "Users can create their own water intake" ON public.water_intake;
DROP POLICY IF EXISTS "Users can delete their own water intake" ON public.water_intake;
DROP POLICY IF EXISTS "Users can update their own water intake" ON public.water_intake;
DROP POLICY IF EXISTS "Users can view their own water intake" ON public.water_intake;

CREATE POLICY "Users can create their own water intake" ON public.water_intake FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own water intake" ON public.water_intake FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own water intake" ON public.water_intake FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own water intake" ON public.water_intake FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- workout_plans
DROP POLICY IF EXISTS "Users can create their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can delete their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can update their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can view their own workout plans" ON public.workout_plans;

CREATE POLICY "Users can create their own workout plans" ON public.workout_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout plans" ON public.workout_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout plans" ON public.workout_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own workout plans" ON public.workout_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- workout_sessions
DROP POLICY IF EXISTS "Users can create their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can delete their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can update their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can view their own workout sessions" ON public.workout_sessions;

CREATE POLICY "Users can create their own workout sessions" ON public.workout_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout sessions" ON public.workout_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout sessions" ON public.workout_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own workout sessions" ON public.workout_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- workout_types
DROP POLICY IF EXISTS "Users can create their own workout types" ON public.workout_types;
DROP POLICY IF EXISTS "Users can delete their own workout types" ON public.workout_types;
DROP POLICY IF EXISTS "Users can update their own workout types" ON public.workout_types;
DROP POLICY IF EXISTS "Users can view their own workout types" ON public.workout_types;

CREATE POLICY "Users can create their own workout types" ON public.workout_types FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout types" ON public.workout_types FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout types" ON public.workout_types FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own workout types" ON public.workout_types FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Add foreign key constraint for completed_exercises -> workout_sessions
-- (Check if it already exists first - the constraint name from types suggests it does exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'completed_exercises_session_id_fkey'
    AND table_name = 'completed_exercises'
  ) THEN
    ALTER TABLE public.completed_exercises 
    ADD CONSTRAINT completed_exercises_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES public.workout_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for exercises -> workout_plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'exercises_plan_id_fkey'
    AND table_name = 'exercises'
  ) THEN
    ALTER TABLE public.exercises 
    ADD CONSTRAINT exercises_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES public.workout_plans(id) ON DELETE CASCADE;
  END IF;
END $$;
