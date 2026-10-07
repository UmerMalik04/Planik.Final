
-- Fix workout_types RLS policies: restrict to authenticated role instead of public (which includes anonymous)
DROP POLICY IF EXISTS "Users can delete their own workout types" ON public.workout_types;
DROP POLICY IF EXISTS "Users can update their own workout types" ON public.workout_types;
DROP POLICY IF EXISTS "Users can view their own workout types" ON public.workout_types;
DROP POLICY IF EXISTS "Users can create their own workout types" ON public.workout_types;

CREATE POLICY "Users can view their own workout types"
ON public.workout_types FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout types"
ON public.workout_types FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout types"
ON public.workout_types FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout types"
ON public.workout_types FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
