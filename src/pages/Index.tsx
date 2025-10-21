import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiometricService } from '@/services/BiometricService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Fingerprint } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const isBiometricEnabled = await BiometricService.isBiometricEnabled();
    const hasRefreshToken = await BiometricService.getStoredRefreshToken();
    
    if (isBiometricEnabled && hasRefreshToken) {
      setShowBiometricPrompt(true);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const result = await BiometricService.biometricLogin();
      
      if (result.success && result.refreshToken) {
        // Use the refresh token to get a new session
        const { data, error } = await supabase.auth.setSession({
          refresh_token: result.refreshToken,
          access_token: '', // Supabase will use refresh token to get new access token
        });

        if (error) {
          toast({
            title: "Login Failed",
            description: "Session expired. Please login with email/password.",
            variant: "destructive",
          });
          await BiometricService.clearStoredRefreshToken();
          navigate('/auth');
        } else {
          toast({
            title: "Welcome back!",
            description: "Biometric login successful.",
          });
          navigate('/home');
        }
      } else {
        toast({
          title: "Authentication Failed",
          description: result.error || "Biometric authentication failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      toast({
        title: "Error",
        description: "Failed to login with biometric. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">Welcome to Planik</h1>
        <p className="text-xl text-muted-foreground">Your fitness journey starts here!</p>
        
        {showBiometricPrompt && (
          <div className="mt-8">
            <Button
              onClick={handleBiometricLogin}
              disabled={loading}
              size="lg"
              className="gap-2"
            >
              <Fingerprint className="h-5 w-5" />
              {loading ? 'Authenticating...' : 'Login with Biometric'}
            </Button>
          </div>
        )}
        
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => navigate('/auth')}
          >
            Login with Email
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
