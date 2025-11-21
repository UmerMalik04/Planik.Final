-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL, -- 'strength', 'consistency', 'volume', 'cardio', 'nutrition'
  target_value integer NOT NULL,
  metric text NOT NULL, -- 'workouts_completed', 'days_streak', 'weight_lifted', 'exercises_completed', etc.
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_achievements table to track progress
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  current_progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements (public read)
CREATE POLICY "Anyone can view achievements"
  ON public.achievements
  FOR SELECT
  USING (true);

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievement progress"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievement progress"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievement progress"
  ON public.user_achievements
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievement progress"
  ON public.user_achievements
  FOR DELETE
  USING (auth.uid() = user_id);

-- Insert comprehensive achievement list
INSERT INTO public.achievements (title, description, icon, category, target_value, metric) VALUES
-- Consistency achievements
('First Step', 'Complete your first workout', 'Flame', 'consistency', 1, 'workouts_completed'),
('Consistency King', 'Work out 7 days in a row', 'Flame', 'consistency', 7, 'days_streak'),
('Weekly Warrior', 'Complete 3 workouts in a week', 'Flame', 'consistency', 3, 'weekly_workouts'),
('Two Weeks Strong', 'Work out for 14 days straight', 'Flame', 'consistency', 14, 'days_streak'),
('Month Master', 'Work out for 30 days straight', 'Trophy', 'consistency', 30, 'days_streak'),
('Unstoppable', 'Work out for 60 days straight', 'Trophy', 'consistency', 60, 'days_streak'),
('Legend Status', 'Work out for 100 days straight', 'Star', 'consistency', 100, 'days_streak'),

-- Volume achievements
('10 Workout Club', 'Complete 10 workouts', 'Dumbbell', 'volume', 10, 'workouts_completed'),
('25 Workout Club', 'Complete 25 workouts', 'Dumbbell', 'volume', 25, 'workouts_completed'),
('50 Workout Club', 'Complete 50 workouts', 'Dumbbell', 'volume', 50, 'workouts_completed'),
('100 Workout Club', 'Complete 100 workouts', 'Trophy', 'volume', 100, 'workouts_completed'),
('500 Sets Strong', 'Complete 500 total sets', 'Zap', 'volume', 500, 'total_sets'),
('1000 Sets Strong', 'Complete 1000 total sets', 'Zap', 'volume', 1000, 'total_sets'),
('10k Reps', 'Complete 10,000 total reps', 'Target', 'volume', 10000, 'total_reps'),

-- Strength achievements
('100kg Bench Club', 'Bench press 100kg or more', 'Weight', 'strength', 100, 'bench_press_weight'),
('150kg Bench Club', 'Bench press 150kg or more', 'Weight', 'strength', 150, 'bench_press_weight'),
('100kg Squat Club', 'Squat 100kg or more', 'Weight', 'strength', 100, 'squat_weight'),
('150kg Squat Club', 'Squat 150kg or more', 'Weight', 'strength', 150, 'squat_weight'),
('200kg Squat Club', 'Squat 200kg or more', 'Trophy', 'strength', 200, 'squat_weight'),
('150kg Deadlift Club', 'Deadlift 150kg or more', 'Weight', 'strength', 150, 'deadlift_weight'),
('200kg Deadlift Club', 'Deadlift 200kg or more', 'Trophy', 'strength', 200, 'deadlift_weight'),

-- Progressive overload achievements
('Perfect Overload', 'Increase weight in every workout for a week', 'Zap', 'strength', 7, 'progressive_overload_streak'),
('Double Strength', 'Double your starting weight on any exercise', 'Trophy', 'strength', 2, 'weight_multiplier'),
('PR Crusher', 'Beat 5 personal records', 'Star', 'strength', 5, 'prs_beaten'),
('PR Master', 'Beat 20 personal records', 'Trophy', 'strength', 20, 'prs_beaten'),

-- Time-based achievements
('Early Bird', 'Complete 5 morning workouts (before 9 AM)', 'Star', 'consistency', 5, 'morning_workouts'),
('Night Owl', 'Complete 5 evening workouts (after 7 PM)', 'Star', 'consistency', 5, 'evening_workouts'),
('Speed Demon', 'Complete a workout in under 30 minutes', 'Zap', 'volume', 30, 'workout_duration_minutes'),
('Marathon Session', 'Complete a 2-hour workout', 'Trophy', 'volume', 120, 'workout_duration_minutes'),

-- Exercise variety achievements
('Exercise Explorer', 'Try 10 different exercises', 'Target', 'volume', 10, 'unique_exercises'),
('Exercise Master', 'Try 25 different exercises', 'Trophy', 'volume', 25, 'unique_exercises'),
('Full Body Focus', 'Work all muscle groups in one week', 'Users', 'volume', 9, 'muscle_groups_week'),
('Specialized', 'Do the same exercise 50 times', 'Target', 'volume', 50, 'same_exercise_count'),

-- Muscle group achievements
('Chest Champion', 'Complete 20 chest exercises', 'Zap', 'volume', 20, 'chest_exercises'),
('Back Beast', 'Complete 20 back exercises', 'Zap', 'volume', 20, 'back_exercises'),
('Leg Legend', 'Complete 20 leg exercises', 'Zap', 'volume', 20, 'leg_exercises'),
('Arm Assassin', 'Complete 20 arm exercises', 'Zap', 'volume', 20, 'arm_exercises'),
('Core Commander', 'Complete 20 core exercises', 'Zap', 'volume', 20, 'core_exercises'),

-- Nutrition achievements (if diet tracking is used)
('Protein Pro', 'Hit protein goal 7 days in a row', 'Trophy', 'nutrition', 7, 'protein_streak'),
('Calorie Control', 'Hit calorie goal 7 days in a row', 'Target', 'nutrition', 7, 'calorie_streak'),
('Hydration Hero', 'Hit water goal 14 days in a row', 'Droplet', 'nutrition', 14, 'water_streak'),

-- Social/Planning achievements
('Plan Creator', 'Create your first workout plan', 'Target', 'planning', 1, 'plans_created'),
('Template Master', 'Create 5 workout plans', 'Trophy', 'planning', 5, 'plans_created')
ON CONFLICT DO NOTHING;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_user_achievements_timestamp
  BEFORE UPDATE ON public.user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_user_achievements_updated_at();