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
import { BiometricService } from '@/services/BiometricService';
import { NotificationService } from '@/services/NotificationService';
import BiometricSettings from '@/components/BiometricSettings';

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
  const { settings, updateSetting, getText } = useSettings();
  const [feedback, setFeedback] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const result = await BiometricService.isAvailable();
    setBiometricAvailable(result.isAvailable);
    
    // Check if biometric is already enabled
    const saved = localStorage.getItem('biometric-enabled');
    setBiometricEnabled(saved === 'true');
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await BiometricService.promptForBiometricSetup();
      if (success) {
        setBiometricEnabled(true);
        localStorage.setItem('biometric-enabled', 'true');
        updateSetting('biometricLogin', true);
        toast({
          title: "Biometric Login Enabled",
          description: "You can now use biometric authentication to login.",
        });
      }
    } else {
      setBiometricEnabled(false);
      localStorage.setItem('biometric-enabled', 'false');
      updateSetting('biometricLogin', false);
      toast({
        title: "Biometric Login Disabled",
        description: "Biometric authentication has been turned off.",
      });
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const permissionGranted = await NotificationService.requestPermissions();
      if (permissionGranted) {
        updateSetting('notifications', true);
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive workout and meal reminders.",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your device settings.",
          variant: "destructive",
        });
      }
    } else {
      updateSetting('notifications', false);
      toast({
        title: "Notifications Disabled",
        description: "You won't receive any app notifications.",
      });
    }
  };

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
          {getText('back_to_home')}
        </Button>

        {/* Header */}
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{getText('settings')}</h1>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {getText('appearance')}
            </CardTitle>
            <CardDescription>{getText('customize_app_looks')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {getText('dark_mode')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {getText('switch_light_dark')}
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>

            {/* Theme Color */}
            <div className="space-y-3">
              <Label>{getText('theme_color')}</Label>
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
              {getText('language_region')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language */}
            <div className="space-y-2">
              <Label>{getText('language')}</Label>
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
                {getText('weight_units')}
              </Label>
              <Select 
                value={settings.units} 
                onValueChange={(value) => updateSetting('units', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">{getText('kilograms')}</SelectItem>
                  <SelectItem value="lbs">{getText('pounds')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {getText('date_format')}
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
              {getText('notifications_privacy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{getText('push_notifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  {getText('receive_workout_reminders')}
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={handleNotificationToggle}
              />
            </div>

          </CardContent>
        </Card>

        {/* Biometric Authentication */}
        {biometricAvailable && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                {getText('biometric_login')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getText('face_id_fingerprint')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('use_biometric_quick_login')}
                  </p>
                </div>
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={handleBiometricToggle}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {getText('security')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Change Password */}
            <div className="space-y-3">
              <Label>{getText('change_password')}</Label>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={getText('new_password')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder={getText('confirm_new_password')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button onClick={handleChangePassword} className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  {getText('update_password')}
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
              {getText('delete_account_data')}
            </Button>
          </CardContent>
        </Card>

        {/* Backup & Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              {getText('backup_sync')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto Sync */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{getText('auto_sync')}</Label>
                <p className="text-sm text-muted-foreground">
                  {getText('automatically_sync_data')}
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
              {getText('manual_sync_now')}
            </Button>

            {/* Export Data */}
            <div className="space-y-2">
              <Label>{getText('export_data')}</Label>
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
              {getText('send_feedback')}
            </CardTitle>
            <CardDescription>
              {getText('help_improve_app')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={getText('feedback_placeholder')}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
            <Button onClick={handleFeedback} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              {getText('send_feedback')}
            </Button>
          </CardContent>
        </Card>

        {/* App Info & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {getText('app_info_support')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>{getText('app_version')}</span>
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
                {getText('terms_service')}
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
                {getText('privacy_policy')}
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
                {getText('contact_support')}
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
                {getText('report_bug')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}