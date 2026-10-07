import { Heart, Activity, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface HealthKitDisclosureProps {
  variant?: 'banner' | 'compact' | 'inline';
  className?: string;
}

const isIOSPlatform = (): boolean => /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

function getHealthServiceName(): string {
  return isIOSPlatform() ? 'Apple HealthKit' : 'Health Connect';
}

export function HealthKitDisclosure({ variant = 'banner', className = '' }: HealthKitDisclosureProps) {
  const serviceName = getHealthServiceName();

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
        <Heart className="w-3 h-3 text-red-500" />
        <span>Uses {serviceName} to read step count data</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 ${className}`}>
        <Heart className="w-4 h-4 text-red-500 flex-shrink-0" />
        <p className="text-xs text-red-700 dark:text-red-300">
          This feature uses {serviceName} to track your daily steps and activity progress.
        </p>
      </div>
    );
  }

  return (
    <Alert className={`border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 ${className}`}>
      <Heart className="h-4 w-4 text-red-500" />
      <AlertTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
        <span>{serviceName} Integration</span>
      </AlertTitle>
      <AlertDescription className="text-red-600 dark:text-red-400 text-sm space-y-2">
        <p>
          This app uses <strong>{serviceName}</strong> to read and display your step count data. 
          Your health data helps us track your daily activity and fitness progress.
        </p>
        <div className="flex items-start gap-2 mt-2">
          <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Data accessed:</strong> Step count data is read from {serviceName} to display your daily steps, 
            weekly progress, and monthly activity history.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Privacy:</strong> Your health data is stored securely and is never shared with third parties. 
            You can revoke access at any time in your device Settings.
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
}
