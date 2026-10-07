
-- Tighten realtime topic policy: require strict prefix with colon delimiter
DROP POLICY IF EXISTS "Users can only access their own realtime topics" ON realtime.messages;
CREATE POLICY "Users can only access their own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = (auth.uid())::text
  OR realtime.topic() LIKE ((auth.uid())::text || ':%')
);

-- Revoke EXECUTE on trigger-only SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
