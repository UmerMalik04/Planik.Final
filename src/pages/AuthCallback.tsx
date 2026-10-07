/**
 * AuthCallback page ("/auth/callback").
 * Redirect target after OAuth (e.g. Google). Reads the session Supabase
 * created from the URL and routes the user into the app or back to /auth.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    /** Resolve the post-OAuth session and redirect accordingly. */
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          toast({
            title: 'Authentication Error',
            description: error.message,
            variant: 'destructive',
          });
          navigate('/auth');
          return;
        }

        if (data.session) {
          toast({ title: 'Welcome!', description: 'You have been logged in successfully.' });
          navigate('/');
        } else {
          navigate('/auth');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
