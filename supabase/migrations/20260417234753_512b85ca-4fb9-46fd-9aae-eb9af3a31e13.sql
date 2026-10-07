-- Enable RLS on realtime.messages and restrict channel subscriptions to user-scoped topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to subscribe/receive messages only on topics that include their auth uid
-- Convention: channel topic must contain the authenticated user's UID (e.g. "daily-steps:<uid>")
CREATE POLICY "Users can only access their own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
);
