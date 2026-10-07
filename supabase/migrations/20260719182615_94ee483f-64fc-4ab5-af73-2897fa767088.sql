REVOKE EXECUTE ON FUNCTION public.sync_user_profile_from_auth() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_profile_from_auth() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_user_profile_from_auth() FROM authenticated;