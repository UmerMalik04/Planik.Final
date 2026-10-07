-- Ensure RLS is enabled
ALTER TABLE public.completed_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_types ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own completed exercises" ON public.completed_exercises;
DROP POLICY IF EXISTS "Users can delete their own completed exercises" ON public.completed_exercises;
DROP POLICY IF EXISTS "Users can update their own completed exercises" ON public.completed_exercises;
DROP POLICY IF EXISTS "Users can view their own completed exercises" ON public.completed_exercises;

DROP POLICY IF EXISTS "Users can insert their own steps" ON public.daily_steps;
DROP POLICY IF EXISTS "Users can delete their own steps" ON public.daily_steps;
DROP POLICY IF EXISTS "Users can update their own steps" ON public.daily_steps;
DROP POLICY IF EXISTS "Users can view their own steps" ON public.daily_steps;

DROP POLICY IF EXISTS "Users can create their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can delete their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can update their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can view their own exercises" ON public.exercises;

DROP POLICY IF EXISTS "Users can create their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can delete their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can update their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can view their own food items" ON public.food_items;

DROP POLICY IF EXISTS "Users can create their own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Users can delete their own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Users can update their own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Users can view their own personal records" ON public.personal_records;

DROP POLICY IF EXISTS "Users can create their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.user_goals;

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;

DROP POLICY IF EXISTS "Users can create their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can delete their own stats" ON public.user_stats;

DROP POLICY IF EXISTS "Users can create their own water intake" ON public.water_intake;
DROP POLICY IF EXISTS "Users can delete their own water intake" ON public.water_intake;
DROP POLICY IF EXISTS "Users can update their own water intake" ON public.water_intake;
DROP POLICY IF EXISTS "Users can view their own water intake" ON public.water_intake;

DROP POLICY IF EXISTS "Users can create their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can delete their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can update their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can view their own workout plans" ON public.workout_plans;

DROP POLICY IF EXISTS "Users can create their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can delete their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can update their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can view their own workout sessions" ON public.workout_sessions;

DROP POLICY IF EXISTS "Users can create their own workout types" ON public.workout_types;
DROP POLICY IF EXISTS "Users can delete their own workout types" ON public.workout_types;
DROP POLICY IF EXISTS "Users can update their own workout types" ON public.workout_types;
DROP POLICY IF EXISTS "Users can view their own workout types" ON public.workout_types;

-- Recreate all policies as PERMISSIVE
CREATE POLICY "Users can create their own completed exercises" ON public.completed_exercises AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own completed exercises" ON public.completed_exercises AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own completed exercises" ON public.completed_exercises AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own completed exercises" ON public.completed_exercises AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own steps" ON public.daily_steps AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own steps" ON public.daily_steps AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own steps" ON public.daily_steps AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own steps" ON public.daily_steps AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercises" ON public.exercises AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exercises" ON public.exercises AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own exercises" ON public.exercises AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own exercises" ON public.exercises AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food items" ON public.food_items AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own food items" ON public.food_items AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own food items" ON public.food_items AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own food items" ON public.food_items AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own personal records" ON public.personal_records AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own personal records" ON public.personal_records AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own personal records" ON public.personal_records AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own personal records" ON public.personal_records AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" ON public.user_goals AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.user_goals AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.user_goals AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own goals" ON public.user_goals AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_preferences AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own preferences" ON public.user_preferences AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own preferences" ON public.user_preferences AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own profile" ON public.user_profiles AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON public.user_profiles AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own settings" ON public.user_settings AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON public.user_settings AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stats" ON public.user_stats AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON public.user_stats AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own stats" ON public.user_stats AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stats" ON public.user_stats AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own water intake" ON public.water_intake AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own water intake" ON public.water_intake AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own water intake" ON public.water_intake AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own water intake" ON public.water_intake AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout plans" ON public.workout_plans AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout plans" ON public.workout_plans AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout plans" ON public.workout_plans AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own workout plans" ON public.workout_plans AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout sessions" ON public.workout_sessions AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout sessions" ON public.workout_sessions AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout sessions" ON public.workout_sessions AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own workout sessions" ON public.workout_sessions AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout types" ON public.workout_types AS PERMISSIVE FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout types" ON public.workout_types AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout types" ON public.workout_types AS PERMISSIVE FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own workout types" ON public.workout_types AS PERMISSIVE FOR SELECT USING (auth.uid() = user_id);

-- Add missing foreign keys with ON DELETE CASCADE (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'completed_exercises_session_id_fkey'
  ) THEN
    ALTER TABLE public.completed_exercises
      ADD CONSTRAINT completed_exercises_session_id_fkey
      FOREIGN KEY (session_id)
      REFERENCES public.workout_sessions(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exercises_plan_id_fkey'
  ) THEN
    ALTER TABLE public.exercises
      ADD CONSTRAINT exercises_plan_id_fkey
      FOREIGN KEY (plan_id)
      REFERENCES public.workout_plans(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workout_sessions_plan_id_fkey'
  ) THEN
    ALTER TABLE public.workout_sessions
      ADD CONSTRAINT workout_sessions_plan_id_fkey
      FOREIGN KEY (plan_id)
      REFERENCES public.workout_plans(id)
      ON DELETE CASCADE;
  END IF;
END $$;