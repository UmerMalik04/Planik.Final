-- Add missing UPDATE and DELETE policies for water_intake
CREATE POLICY "Users can update their own water intake"
ON public.water_intake
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water intake"
ON public.water_intake
FOR DELETE
USING (auth.uid() = user_id);

-- Add missing UPDATE policy for food_items
CREATE POLICY "Users can update their own food items"
ON public.food_items
FOR UPDATE
USING (auth.uid() = user_id);

-- Add missing DELETE policy for user_goals
CREATE POLICY "Users can delete their own goals"
ON public.user_goals
FOR DELETE
USING (auth.uid() = user_id);

-- Add missing DELETE policy for user_settings
CREATE POLICY "Users can delete their own settings"
ON public.user_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Add missing DELETE policy for user_preferences
CREATE POLICY "Users can delete their own preferences"
ON public.user_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Add missing DELETE policy for user_profiles
CREATE POLICY "Users can delete their own profile"
ON public.user_profiles
FOR DELETE
USING (auth.uid() = id);