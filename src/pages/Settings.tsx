import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Globe, 
  Scale, 
  Bell, 
  Palette, 
  Calendar,
  Lock,
  Fingerprint,
  Trash2,
  Cloud,
  Download,
  FileText,
  Shield,
  HelpCircle,
  Bug,
  Mail,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
];

const accentColors = [
  { name: 'Blue', value: 'hsl(221, 83%, 53%)' },
  { name: 'Green', value: 'hsl(142, 76%, 36%)' },
  { name: 'Purple', value: 'hsl(262, 83%, 58%)' },
  { name: 'Red', value: 'hsl(0, 84%, 60%)' },
  { name: 'Orange', value: 'hsl(25, 95%, 53%)' },
  { name: 'Pink', value: 'hsl(330, 81%, 60%)' },
];

export default function Settings() {
  const [settings, setSettings] = useState({
    darkMode: false,
    language: 'en',
    units: 'kg',
    notifications: true,
    accentColor: 'hsl(221, 83%, 53%)',
    dateFormat: 'MM/DD/YYYY',
    biometricLogin: false,
    autoSync: true,
  });
  const [feedback, setFeedback] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('app-settings', JSON.stringify(newSettings));
    
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved.",
    });
  };

  const handleFeedback = () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please enter your feedback before sending.",
        variant: "destructive",
      });
      return;
    }

    // Mock sending feedback
    const subject = encodeURIComponent('Planik App Feedback');
    const body = encodeURIComponent(feedback);
    window.open(`mailto:developers@planik.com?subject=${subject}&body=${body}`);
    
    setFeedback('');
    toast({
      title: "Feedback Sent",
      description: "Thank you for your feedback! We'll get back to you soon.",
    });
  };

  const handleExportData = (format: 'csv' | 'pdf') => {
    toast({
      title: "Export Started",
      description: `Your data is being exported as ${format.toUpperCase()}...`,
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account.",
      variant: "destructive",
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how the app looks and feels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(value) => updateSetting('darkMode', value)}
              />
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <Label>Accent Color</Label>
              <div className="flex gap-2 flex-wrap">
                {accentColors.map((color) => (
                  <button
                    key={color.name}
                    className={`w-8 h-8 rounded-full border-2 ${
                      settings.accentColor === color.value 
                        ? 'border-foreground' 
                        : 'border-muted'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => updateSetting('accentColor', color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language */}
            <div className="space-y-2">
              <Label>Language</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value) => updateSetting('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Units */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Weight Units
              </Label>
              <Select 
                value={settings.units} 
                onValueChange={(value) => updateSetting('units', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Format
              </Label>
              <Select 
                value={settings.dateFormat} 
                onValueChange={(value) => updateSetting('dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive workout reminders and updates
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(value) => updateSetting('notifications', value)}
              />
            </div>

            {/* Biometric Login */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4" />
                  Biometric Login
                </Label>
                <p className="text-sm text-muted-foreground">
                  Use Face ID or Fingerprint to sign in
                </p>
              </div>
              <Switch
                checked={settings.biometricLogin}
                onCheckedChange={(value) => updateSetting('biometricLogin', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            
            <Button 
              variant="destructive" 
              className="w-full justify-start"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account Data
            </Button>
          </CardContent>
        </Card>

        {/* Backup & Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Backup & Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto Sync */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync data with cloud
                </p>
              </div>
              <Switch
                checked={settings.autoSync}
                onCheckedChange={(value) => updateSetting('autoSync', value)}
              />
            </div>

            <Separator />

            {/* Manual Sync */}
            <Button variant="outline" className="w-full justify-start">
              <Cloud className="h-4 w-4 mr-2" />
              Manual Sync Now
            </Button>

            {/* Export Data */}
            <div className="space-y-2">
              <Label>Export Data</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleExportData('csv')}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportData('pdf')}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Feedback
            </CardTitle>
            <CardDescription>
              Help us improve the app by sharing your thoughts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Tell us what you think about the app, report bugs, or suggest new features..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
            <Button onClick={handleFeedback} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Send Feedback
            </Button>
          </CardContent>
        </Card>

        {/* App Info & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              App Info & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>App Version</span>
              <Badge variant="secondary">1.0.0</Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Terms of Service
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Privacy Policy
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Bug className="h-4 w-4 mr-2" />
                Report a Bug
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}