-- Create water intake tracking table
CREATE TABLE public.water_intake (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_ml INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own water intake"
ON public.water_intake
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own water intake"
ON public.water_intake
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water intake"
ON public.water_intake
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own water intake"
ON public.water_intake
FOR UPDATE
USING (auth.uid() = user_id);

-- Add daily_water_target to user_goals
ALTER TABLE public.user_goals
ADD COLUMN daily_water_target INTEGER DEFAULT 2000;