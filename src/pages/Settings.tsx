import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
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
  Info,
  ArrowLeft
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


export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme, themeColor, setThemeColor, availableColors } = useTheme();
  const { settings, updateSetting } = useSettings();
  const [feedback, setFeedback] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Password Required",
        description: "Please enter both password fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Update password in localStorage
    const currentUser = JSON.parse(localStorage.getItem('current-user') || '{}');
    const savedUsers = JSON.parse(localStorage.getItem('mock-users') || '[]');
    const userIndex = savedUsers.findIndex((u: any) => u.email === currentUser.email);
    
    if (userIndex !== -1) {
      savedUsers[userIndex].password = newPassword;
      localStorage.setItem('mock-users', JSON.stringify(savedUsers));
    }
    
    setNewPassword('');
    setConfirmPassword('');
    
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
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
    const currentUser = JSON.parse(localStorage.getItem('current-user') || '{}');
    const savedUsers = JSON.parse(localStorage.getItem('mock-users') || '[]');
    const filteredUsers = savedUsers.filter((u: any) => u.email !== currentUser.email);
    
    localStorage.setItem('mock-users', JSON.stringify(filteredUsers));
    localStorage.removeItem('current-user');
    localStorage.removeItem('auth-session');
    
    toast({
      title: "Account Deleted",
      description: "Your account and all data have been permanently deleted.",
      variant: "destructive",
    });
    
    // Redirect to auth page after a short delay
    setTimeout(() => {
      navigate('/auth');
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

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
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>

            {/* Theme Color */}
            <div className="space-y-3">
              <Label>Theme Color</Label>
              <div className="flex gap-2 flex-wrap">
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      themeColor === color.value 
                        ? 'border-foreground scale-110' 
                        : 'border-muted hover:border-muted-foreground'
                    }`}
                    style={{ backgroundColor: `hsl(${color.value})` }}
                    onClick={() => setThemeColor(color.value)}
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
            {/* Change Password */}
            <div className="space-y-3">
              <Label>Change Password</Label>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button onClick={handleChangePassword} className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </div>

            <Separator />
            
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
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => toast({ title: "Sync Complete", description: "Your data has been synced successfully." })}
            >
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
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:bg-accent"
                onClick={() => {
                  const url = 'https://planik.com/terms';
                  window.open(url, '_blank');
                  toast({
                    title: "Opening Terms of Service",
                    description: "Redirecting to our terms page...",
                  });
                }}
              >
                <Shield className="h-4 w-4 mr-2" />
                Terms of Service
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:bg-accent"
                onClick={() => {
                  const url = 'https://planik.com/privacy';
                  window.open(url, '_blank');
                  toast({
                    title: "Opening Privacy Policy",
                    description: "Redirecting to our privacy page...",
                  });
                }}
              >
                <Shield className="h-4 w-4 mr-2" />
                Privacy Policy
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:bg-accent"
                onClick={() => {
                  const email = 'support@planik.com';
                  const subject = 'Support Request';
                  const body = 'Hello, I need help with...';
                  window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                  toast({
                    title: "Opening Email Client",
                    description: "Creating support email...",
                  });
                }}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:bg-accent"
                onClick={() => {
                  const email = 'bugs@planik.com';
                  const subject = 'Bug Report';
                  const body = 'Bug Description:\n\nSteps to Reproduce:\n1. \n2. \n3. \n\nExpected Result:\n\nActual Result:\n\nDevice/Browser Info:\n';
                  window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                  toast({
                    title: "Opening Email Client",
                    description: "Creating bug report email...",
                  });
                }}
              >
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