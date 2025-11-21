-- Fix database functions to have a fixed search_path for security

-- Drop and recreate update_user_achievements_updated_at with fixed search_path
DROP FUNCTION IF EXISTS public.update_user_achievements_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_user_achievements_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Recreate the trigger that was dropped
CREATE TRIGGER update_user_achievements_timestamp
  BEFORE UPDATE ON public.user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_achievements_updated_at();