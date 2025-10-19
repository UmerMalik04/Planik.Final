-- Add missing columns to workout_plans table
ALTER TABLE public.workout_plans 
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS rest_timer integer DEFAULT 90;

-- Add missing column to exercises table
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS has_warmup boolean DEFAULT false;

-- Create workout_sessions table
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  date timestamp with time zone NOT NULL DEFAULT now(),
  duration integer,
  total_volume numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout sessions"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions"
  ON public.workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create completed_exercises table
CREATE TABLE IF NOT EXISTS public.completed_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  sets integer NOT NULL,
  reps integer NOT NULL,
  weight numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.completed_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completed exercises"
  ON public.completed_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed exercises"
  ON public.completed_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completed exercises"
  ON public.completed_exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed exercises"
  ON public.completed_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Create personal_records table
CREATE TABLE IF NOT EXISTS public.personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  weight numeric NOT NULL,
  reps integer NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, exercise_name)
);

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personal records"
  ON public.personal_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal records"
  ON public.personal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal records"
  ON public.personal_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal records"
  ON public.personal_records FOR DELETE
  USING (auth.uid() = user_id);