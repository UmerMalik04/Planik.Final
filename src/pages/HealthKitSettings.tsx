import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Heart, 
  Activity, 
  Footprints, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  Info,
  Smartphone
} from 'lucide-react';
import { HealthService } from '@/services/HealthService';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

// Check if running in React Native WebView
const isReactNativeWebView = (): boolean => {
  return !!(window as any).ReactNativeWebView;
};

// Check if running on iOS
const isIOSPlatform = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

/**
 * HealthKitSettings page ("/healthkit-settings").
 * iOS-only screen for granting / revoking Apple HealthKit permissions and
 * manually triggering a sync of step data.
 */
export default function HealthKitSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [todaySteps, setTodaySteps] = useState<number>(0);
  const [isLoadingSteps, setIsLoadingSteps] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  // Detect native environment: either Capacitor OR React Native WebView on iOS
  const isNative = Capacitor.isNativePlatform() || (isReactNativeWebView() && isIOSPlatform());
  const isIOS = Capacitor.getPlatform() === 'ios' || isIOSPlatform();
  const isAndroid = !isIOS;
  const healthServiceName = isIOS ? 'HealthKit' : 'Health Connect';

  useEffect(() => {
    checkPermissionStatus();
    syncStepsFromHealthStore();
  }, []);

  /** Probe whether HealthKit access has already been granted on this device. */
  const checkPermissionStatus = async () => {
    if (!isNative) {
      setPermissionGranted(false);
      return;
    }
    
    try {
      const steps = await HealthService.getStepsToday();
      setPermissionGranted(steps >= 0);
    } catch {
      setPermissionGranted(false);
    }
  };

  /** Pull the latest step data from HealthKit into our database. */
  const syncStepsFromHealthStore = async () => {
    setIsLoadingSteps(true);
    try {
      // Force a fresh query from the native health store (HealthKit / Health Connect)
      // quickSyncToday hits the native plugin directly AND saves to DB
      if (isNative) {
        const steps = await HealthService.quickSyncToday();
        setTodaySteps(steps);
      } else {
        // On web, get from database (last synced value)
        const today = new Date().toISOString().split('T')[0];
        const steps = await HealthService.getStepsFromDatabase(today);
        setTodaySteps(steps);
      }
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to sync steps:', error);
      toast({
        title: "Sync Failed",
        description: "Could not fetch latest step data. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSteps(false);
    }
  };

  /** Show the OS HealthKit permission prompt and update local state with the result. */
  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    try {
      const granted = await HealthService.requestPermissions();
      setPermissionGranted(granted);
      
      if (granted) {
        toast({
          title: "Permissions Granted",
          description: "HealthKit access has been enabled successfully.",
        });
        await syncStepsFromHealthStore();
      } else {
        toast({
          title: "Permission Required",
          description: "Please enable HealthKit access in your device Settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      toast({
        title: "Error",
        description: "Failed to request HealthKit permissions.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const dataAccessItems = [
    {
      icon: Footprints,
      title: "Step Count",
      description: "Daily step count from your device",
      access: "Read only",
      enabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 dark:bg-red-950/50 rounded-xl">
            <Heart className="h-7 w-7 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{healthServiceName} Settings</h1>
            <p className="text-muted-foreground">Manage health data access</p>
          </div>
        </div>

        {/* Platform Notice */}
        {!isNative && (
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertTitle>Native App Required</AlertTitle>
            <AlertDescription>
              {healthServiceName} integration is only available when using the native {isIOS ? 'iOS' : 'Android'} app. 
              Step data shown on web is synced from your previous app usage.
            </AlertDescription>
          </Alert>
        )}

        {/* Permission Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permission Status
            </CardTitle>
            <CardDescription>
              Current {healthServiceName} authorization status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {permissionGranted === true ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : permissionGranted === false ? (
                  <XCircle className="h-6 w-6 text-red-500" />
                ) : (
                  <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
                )}
                <div>
                  <p className="font-medium">
                    {permissionGranted === true 
                      ? "Access Granted" 
                      : permissionGranted === false 
                        ? "Access Not Granted"
                        : "Checking..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {permissionGranted === true 
                      ? "The app can read your health data"
                      : "Enable access to track your steps"}
                  </p>
                </div>
              </div>
              <Badge variant={permissionGranted ? "default" : "secondary"}>
                {permissionGranted ? "Active" : "Inactive"}
              </Badge>
            </div>

            {isNative && !permissionGranted && (
              <Button 
                onClick={handleRequestPermissions} 
                disabled={isRequesting}
                className="w-full"
              >
                {isRequesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Enable {healthServiceName} Access
                  </>
                )}
              </Button>
            )}

            {isNative && (
              <p className="text-xs text-muted-foreground">
                {isIOS 
                  ? 'You can also manage HealthKit permissions in your iPhone Settings → Privacy & Security → Health → Planik'
                  : 'You can also manage Health Connect permissions in Settings → Apps → Health Connect → App permissions'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Data Access Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Data Access
            </CardTitle>
            <CardDescription>
              Health data this app can access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataAccessItems.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{item.access}</Badge>
                </div>
                {index < dataAccessItems.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}

            {/* Current Steps Preview */}
            {permissionGranted && (
              <>
                <Separator />
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Steps</p>
                    <p className="text-2xl font-bold">
                      {isLoadingSteps ? "..." : todaySteps.toLocaleString()}
                    </p>
                    {lastSyncTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last synced: {lastSyncTime}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={syncStepsFromHealthStore}
                    disabled={isLoadingSteps}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingSteps ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Privacy Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Privacy & Data Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
              <Shield className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-blue-700 dark:text-blue-300">Your Privacy Matters</AlertTitle>
              <AlertDescription className="text-blue-600 dark:text-blue-400 text-sm">
                Your health data is handled with the highest security standards.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Step data is only used to display your activity progress within this app</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Your health data is never shared with third parties</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Data is stored securely and encrypted</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>You can revoke access at any time from your device Settings</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Manage */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Permissions</CardTitle>
            <CardDescription>
              How to enable or disable {healthServiceName} access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <p className="font-medium">To change {healthServiceName} permissions:</p>
              {isIOS ? (
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open the <strong>Settings</strong> app on your iPhone</li>
                  <li>Scroll down and tap <strong>Privacy & Security</strong></li>
                  <li>Tap <strong>Health</strong></li>
                  <li>Find and tap <strong>Planik</strong></li>
                  <li>Toggle the data types you want to share</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open the <strong>Settings</strong> app on your device</li>
                  <li>Tap <strong>Apps</strong></li>
                  <li>Find and tap <strong>Health Connect</strong></li>
                  <li>Tap <strong>App permissions</strong></li>
                  <li>Find <strong>Planik</strong> and manage access</li>
                </ol>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
