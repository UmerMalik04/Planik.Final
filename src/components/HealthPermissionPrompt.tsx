import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Activity, Shield, Footprints, CheckCircle2 } from 'lucide-react';
import { HealthService } from '@/services/HealthService';
import { Capacitor } from '@capacitor/core';

interface HealthPermissionPromptProps {
  onComplete: () => void;
}

const isIOSPlatform = (): boolean => /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
const isAndroidPlatform = (): boolean => /android/.test(navigator.userAgent.toLowerCase());

export default function HealthPermissionPrompt({ onComplete }: HealthPermissionPromptProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const isNative = Capacitor.isNativePlatform() || !!(window as any).ReactNativeWebView;
  const platformName = isIOSPlatform() ? 'Apple HealthKit' : isAndroidPlatform() ? 'Health Connect' : 'Health Services';

  const handleAllow = async () => {
    setIsRequesting(true);
    try {
      await HealthService.requestPermissions();
    } catch (e) {
      console.error('Health permission request failed:', e);
    } finally {
      setIsRequesting(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
            <Heart className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Health Data Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-center text-muted-foreground leading-relaxed">
            Planik uses <strong>{platformName}</strong> to track your daily steps and activity progress.
          </p>

          {/* What we access */}
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Footprints className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Step Count</p>
                <p className="text-xs text-muted-foreground">Read-only access to your daily steps</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Activity History</p>
                <p className="text-xs text-muted-foreground">View your weekly and monthly progress</p>
              </div>
            </div>
          </div>

          {/* Privacy assurances */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Data is never shared with third parties</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">You can revoke access anytime in Settings</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Stored securely and encrypted</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleAllow}
              disabled={isRequesting}
              className="w-full gap-2"
              size="lg"
            >
              {isRequesting ? (
                'Requesting Access...'
              ) : (
                <>
                  <Heart className="h-4 w-4" />
                  Allow Health Access
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              Not Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
