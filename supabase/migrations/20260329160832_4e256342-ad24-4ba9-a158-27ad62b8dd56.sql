
-- Fix ALL remaining tables: restrict RLS to authenticated role (anonymous sign-ins still get auth.uid())

-- completed_exercises
DROP POLICY IF EXISTS "Users can create their own completed exercises" ON public.completed_exercises;
DROP POLICY IF EXISTS "Users can delete their own completed exercises" ON public.completed_exercises;
DROP POLICY IF EXISTS "Users can update their own completed exercises" ON public.completed_exercises;
DROP POLICY IF EXISTS "Users can view their own completed exercises" ON public.completed_exercises;

CREATE POLICY "Users can view their own completed exercises" ON public.completed_exercises FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own completed exercises" ON public.completed_exercises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own completed exercises" ON public.completed_exercises FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own completed exercises" ON public.completed_exercises FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- daily_steps
DROP POLICY IF EXISTS "Users can insert their own steps" ON public.daily_steps;
DROP POLICY IF EXISTS "Users can delete their own steps" ON public.daily_steps;
DROP POLICY IF EXISTS "Users can update their own steps" ON public.daily_steps;
DROP POLICY IF EXISTS "Users can view their own steps" ON public.daily_steps;

CREATE POLICY "Users can view their own steps" ON public.daily_steps FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own steps" ON public.daily_steps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own steps" ON public.daily_steps FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own steps" ON public.daily_steps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- exercises
DROP POLICY IF EXISTS "Users can create their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can delete their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can update their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can view their own exercises" ON public.exercises;

CREATE POLICY "Users can view their own exercises" ON public.exercises FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own exercises" ON public.exercises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exercises" ON public.exercises FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exercises" ON public.exercises FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- food_items
DROP POLICY IF EXISTS "Users can create their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can delete their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can update their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can view their own food items" ON public.food_items;

CREATE POLICY "Users can view their own food items" ON public.food_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own food items" ON public.food_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own food items" ON public.food_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own food items" ON public.food_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- personal_records
DROP POLICY IF EXISTS "Users can create their own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Users can delete their own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Users can update their own personal records" ON public.personal_records;
DROP POLICY IF EXISTS "Users can view their own personal records" ON public.personal_records;

CREATE POLICY "Users can view their own personal records" ON public.personal_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own personal records" ON public.personal_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own personal records" ON public.personal_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own personal records" ON public.personal_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_goals
DROP POLICY IF EXISTS "Users can create their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.user_goals;

CREATE POLICY "Users can view their own goals" ON public.user_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.user_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.user_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.user_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_preferences
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own preferences" ON public.user_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON public.user_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_settings
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;

CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON public.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_stats
DROP POLICY IF EXISTS "Users can create their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can delete their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_stats;

CREATE POLICY "Users can view their own stats" ON public.user_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own stats" ON public.user_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON public.user_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stats" ON public.user_stats FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- water_intake
DROP POLICY IF EXISTS "Users can create their own water intake" ON public.water_intake;
DROP POLICY IF EXISTS "Users can delete their own water intake" ON public.water_intake;
DROP POLICY IF EXISTS "Users can update their own water intake" ON public.water_intake;
DROP POLICY IF EXISTS "Users can view their own water intake" ON public.water_intake;

CREATE POLICY "Users can view their own water intake" ON public.water_intake FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own water intake" ON public.water_intake FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own water intake" ON public.water_intake FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own water intake" ON public.water_intake FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- workout_plans
DROP POLICY IF EXISTS "Users can create their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can delete their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can update their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can view their own workout plans" ON public.workout_plans;

CREATE POLICY "Users can view their own workout plans" ON public.workout_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workout plans" ON public.workout_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout plans" ON public.workout_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout plans" ON public.workout_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- workout_sessions
DROP POLICY IF EXISTS "Users can create their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can delete their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can update their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can view their own workout sessions" ON public.workout_sessions;

CREATE POLICY "Users can view their own workout sessions" ON public.workout_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workout sessions" ON public.workout_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout sessions" ON public.workout_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout sessions" ON public.workout_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
