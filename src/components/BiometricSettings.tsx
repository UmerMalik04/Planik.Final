import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BiometricService } from '@/services/BiometricService';
import { useToast } from '@/hooks/use-toast';
import { Fingerprint, Eye, Shield } from 'lucide-react';

export default function BiometricSettings() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string>('fingerprint');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const availability = await BiometricService.isAvailable();
      setBiometricAvailable(availability.isAvailable);
      setBiometryType(availability.biometryType || 'fingerprint');

      const enabled = await BiometricService.isBiometricEnabled();
      setBiometricEnabled(enabled);
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    setLoading(true);
    
    try {
      if (enabled) {
        // Enable biometric - prompt for setup
        const setupSuccess = await BiometricService.promptForBiometricSetup();
        
        if (setupSuccess) {
          await BiometricService.setBiometricEnabled(true);
          setBiometricEnabled(true);
          toast({
            title: "Biometric Login Enabled",
            description: `${biometryType === 'face' ? 'Face ID' : 'Fingerprint'} login has been enabled. Your credentials will be saved after your next successful login.`,
          });
        } else {
          setBiometricEnabled(false);
          toast({
            title: "Setup Cancelled",
            description: "Biometric login setup was cancelled.",
            variant: "destructive",
          });
        }
      } else {
        // Disable biometric - clear stored credentials
        await BiometricService.setBiometricEnabled(false);
        await BiometricService.clearStoredCredentials();
        setBiometricEnabled(false);
        toast({
          title: "Biometric Login Disabled",
          description: "Your stored credentials have been removed for security.",
        });
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      toast({
        title: "Error",
        description: "Failed to update biometric settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testBiometric = async () => {
    setLoading(true);
    
    try {
      const result = await BiometricService.biometricLogin();
      
      if (result.success) {
        toast({
          title: "Test Successful",
          description: "Biometric authentication is working correctly!",
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Biometric test failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "An error occurred while testing biometric authentication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBiometricIcon = () => {
    switch (biometryType) {
      case 'face':
        return <Eye className="h-5 w-5" />;
      case 'fingerprint':
        return <Fingerprint className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getBiometricLabel = () => {
    switch (biometryType) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometric';
    }
  };

  if (!biometricAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Biometric Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Biometric authentication is not available on this device.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getBiometricIcon()}
          {getBiometricLabel()} Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor="biometric-toggle" className="text-base font-medium">
              Enable {getBiometricLabel()} Login
            </Label>
            <p className="text-sm text-muted-foreground">
              Use your {biometryType === 'face' ? 'face' : 'fingerprint'} to quickly sign in to your account
            </p>
          </div>
          <Switch
            id="biometric-toggle"
            checked={biometricEnabled}
            onCheckedChange={handleToggleBiometric}
            disabled={loading}
          />
        </div>

        {biometricEnabled && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={testBiometric}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : `Test ${getBiometricLabel()} Authentication`}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Test your biometric authentication to ensure it's working properly
            </p>
          </div>
        )}

        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Security Note:</p>
              <p>
                Your login credentials are securely stored on your device. 
                Disabling this feature will remove all stored credentials.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}