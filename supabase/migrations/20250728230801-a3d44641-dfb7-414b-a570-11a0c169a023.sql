-- Create a custom auth hook for password reset emails
-- This will use our Resend edge function instead of Supabase's SMTP

-- First, let's add a webhook configuration to use our custom email function
-- We need to create a custom email template handler

CREATE OR REPLACE FUNCTION auth.send_password_reset_email()
RETURNS trigger AS $$
DECLARE
  user_email text;
  reset_token text;
  reset_url text;
BEGIN
  -- Get the user email and reset token from the event
  user_email := NEW.email;
  reset_token := NEW.confirmation_token;
  
  -- Build the reset URL
  reset_url := 'https://ismbryaopmkffztxbpoi.supabase.co/auth/v1/verify?token=' || reset_token || '&type=recovery&redirect_to=' || 'https://planik.org.uk/auth';
  
  -- Call our Resend email function
  PERFORM net.http_post(
    url := 'https://ismbryaopmkffztxbpoi.supabase.co/functions/v1/send-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbWJyeWFvcG1rZmZ6dHhicG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTE1MjAsImV4cCI6MjA2ODk2NzUyMH0.3onCSsv9PrB2833KzRIe55k8VHdvPZy1YEKVPKEXf2E"}'::jsonb,
    body := json_build_object(
      'to', user_email,
      'subject', 'Reset your Planik password',
      'html', '<h1>Reset your password</h1><p>Click the link below to reset your password:</p><p><a href="' || reset_url || '">Reset Password</a></p><p>If you didn''t request this, please ignore this email.</p>'
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
