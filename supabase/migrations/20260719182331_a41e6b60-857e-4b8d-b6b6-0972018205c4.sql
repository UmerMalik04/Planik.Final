CREATE OR REPLACE FUNCTION public.sync_user_profile_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  provider_name text;
  provider_avatar text;
BEGIN
  provider_name := coalesce(
    nullif(NEW.raw_user_meta_data->>'name', ''),
    nullif(NEW.raw_user_meta_data->>'full_name', ''),
    nullif(NEW.raw_user_meta_data->>'display_name', ''),
    nullif(NEW.raw_user_meta_data->>'user_name', '')
  );

  provider_avatar := coalesce(
    nullif(NEW.raw_user_meta_data->>'avatar_url', ''),
    nullif(NEW.raw_user_meta_data->>'picture', ''),
    nullif(NEW.raw_user_meta_data->>'imageUrl', '')
  );

  INSERT INTO public.user_profiles (user_id, display_name, avatar_url)
  VALUES (NEW.id, provider_name, provider_avatar)
  ON CONFLICT (user_id) DO UPDATE
  SET
    display_name = coalesce(nullif(public.user_profiles.display_name, ''), EXCLUDED.display_name),
    avatar_url = coalesce(nullif(public.user_profiles.avatar_url, ''), EXCLUDED.avatar_url),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_user_profile_from_auth_trigger ON auth.users;
CREATE TRIGGER sync_user_profile_from_auth_trigger
AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile_from_auth();

INSERT INTO public.user_profiles (user_id, display_name, avatar_url)
SELECT
  users.id,
  coalesce(
    nullif(users.raw_user_meta_data->>'name', ''),
    nullif(users.raw_user_meta_data->>'full_name', ''),
    nullif(users.raw_user_meta_data->>'display_name', ''),
    nullif(users.raw_user_meta_data->>'user_name', '')
  ),
  coalesce(
    nullif(users.raw_user_meta_data->>'avatar_url', ''),
    nullif(users.raw_user_meta_data->>'picture', ''),
    nullif(users.raw_user_meta_data->>'imageUrl', '')
  )
FROM auth.users AS users
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_profiles AS profiles
  WHERE profiles.user_id = users.id
)
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.user_profiles AS profiles
SET
  display_name = coalesce(
    nullif(profiles.display_name, ''),
    nullif(users.raw_user_meta_data->>'name', ''),
    nullif(users.raw_user_meta_data->>'full_name', ''),
    nullif(users.raw_user_meta_data->>'display_name', ''),
    nullif(users.raw_user_meta_data->>'user_name', '')
  ),
  avatar_url = coalesce(
    nullif(profiles.avatar_url, ''),
    nullif(users.raw_user_meta_data->>'avatar_url', ''),
    nullif(users.raw_user_meta_data->>'picture', ''),
    nullif(users.raw_user_meta_data->>'imageUrl', '')
  ),
  updated_at = now()
FROM auth.users AS users
WHERE profiles.user_id = users.id
  AND (
    nullif(profiles.display_name, '') IS NULL
    OR nullif(profiles.avatar_url, '') IS NULL
  );