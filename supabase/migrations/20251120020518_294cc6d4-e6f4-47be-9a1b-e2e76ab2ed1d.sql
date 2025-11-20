-- Create step_history table to track daily steps per user
CREATE TABLE IF NOT EXISTS public.step_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  steps INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.step_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own step history"
  ON public.step_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own step history"
  ON public.step_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own step history"
  ON public.step_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own step history"
  ON public.step_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_step_history_user_date ON public.step_history(user_id, date DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_step_history_updated_at
  BEFORE UPDATE ON public.step_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();