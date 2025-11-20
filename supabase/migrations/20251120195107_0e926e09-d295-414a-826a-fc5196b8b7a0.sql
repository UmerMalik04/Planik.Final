-- Add has_completed_onboarding column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);