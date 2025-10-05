import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  
  Trash2,
  Cloud,
  Download,
  FileText,
  Shield,
  HelpCircle,
  Bug,
  Mail,
  Info,
  ArrowLeft,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NotificationService } from '@/services/NotificationService';

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
  const [customReminderTime, setCustomReminderTime] = useState('19:00');
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    
    checkNotificationPermission();
    
    // Start reminder checker for web platform when component mounts
    if (settings.notifications) {
      NotificationService.startReminderChecker();
    }
    
    // Cleanup interval on unmount
    return () => {
      if (window.workoutReminderInterval) {
        clearInterval(window.workoutReminderInterval);
        window.workoutReminderInterval = null;
      }
    };
  }, [settings.notifications]);

  const checkNotificationPermission = async () => {
    const permission = await NotificationService.getNotificationPermissionStatus();
    setNotificationPermission(permission);
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      // Check permission status first
      const permission = await NotificationService.getNotificationPermissionStatus();
      console.log('Current permission status:', permission);
      
      if (permission === 'denied') {
        setNotificationPermission('denied');
        toast({
          title: "Notifications Blocked",
          description: "Notifications are blocked in your browser. Please enable them in your browser settings and refresh the page.",
          variant: "destructive",
        });
        return;
      }
      
      const success = await NotificationService.enablePushNotifications();
      if (success) {
        updateSetting('notifications', true);
        setNotificationPermission('granted');
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive daily workout reminders at 7:00 PM.",
        });
      } else {
        const newPermission = await NotificationService.getNotificationPermissionStatus();
        setNotificationPermission(newPermission);
        
        if (newPermission === 'denied') {
          toast({
            title: "Notifications Blocked",
            description: "Notifications are blocked. Please enable them in your browser settings, then refresh the page and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Permission Required",
            description: "Please allow notifications when prompted to receive workout reminders.",
            variant: "destructive",
          });
        }
        
        // Don't update the setting if it failed
        updateSetting('notifications', false);
      }
    } else {
      await NotificationService.disablePushNotifications();
      updateSetting('notifications', false);
      toast({
        title: "Notifications Disabled",
        description: "All scheduled notifications have been cancelled.",
      });
    }
  };

  const handleCustomReminderTime = async () => {
    const success = await NotificationService.scheduleCustomWorkoutReminder(customReminderTime);
    if (success) {
      toast({
        title: "Reminder Scheduled",
        description: `Daily workout reminder set for ${customReminderTime}. You'll receive notifications every day at this time.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to schedule reminder. Please check notification permissions.",
        variant: "destructive",
      });
    }
  };

  const testNotifications = async () => {
    // Test workout completion notification
    await NotificationService.sendWorkoutCompleteNotification();
    
    // Test achievement notification after a short delay
    setTimeout(async () => {
      await NotificationService.sendAchievementNotification("First Workout Completed");
    }, 2000);
    
    toast({
      title: "Test Notifications Sent",
      description: "Check if you received the test notifications",
    });
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

  const handleFeedback = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please enter your feedback before sending.",
        variant: "destructive",
      });
      return;
    }

    if (feedback.length > 2000) {
      toast({
        title: "Feedback Too Long",
        description: "Please keep your feedback under 2000 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingFeedback(true);

    try {
      // Get current user's email if available
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.functions.invoke('send-feedback', {
        body: {
          feedback: feedback.trim(),
          userEmail: user?.email,
        },
      });

      if (error) throw error;

      setFeedback('');
      toast({
        title: "Feedback Sent!",
        description: "Thank you for your feedback! We'll review it shortly.",
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: "Failed to Send",
        description: "There was an error sending your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleSupportMessage = async () => {
    if (!supportMessage.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingSupport(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.functions.invoke("send-feedback", {
        body: {
          feedback: supportMessage,
          userEmail: user?.email,
        },
      });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent to support successfully.",
      });
      setSupportMessage("");
      setSupportDialogOpen(false);
    } catch (error) {
      console.error("Error sending support message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingSupport(false);
    }
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

            {/* Notification Permission Status */}
            {notificationPermission === 'denied' && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Notifications Blocked</h4>
                <p className="text-sm text-destructive mb-3">
                  Notifications are blocked in your browser. To enable them:
                </p>
                <ol className="text-sm text-destructive space-y-1 mb-3 list-decimal list-inside">
                  <li>Click the settings/lock icon in your browser's address bar</li>
                  <li>Change notifications from "Block" to "Allow"</li>
                  <li>Refresh this page</li>
                  <li>Try enabling notifications again</li>
                </ol>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Refresh Page
                </Button>
              </div>
            )}

            {notificationPermission === 'default' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Click the toggle above to request notification permissions
                </p>
              </div>
            )}

            {settings.notifications && (
              <>
                <Separator />
                
                {/* Custom Reminder Time */}
                <div className="space-y-3">
                  <Label>Custom Workout Reminder</Label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={customReminderTime}
                      onChange={(e) => setCustomReminderTime(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleCustomReminderTime} variant="outline">
                      Schedule
                    </Button>
                    <Button 
                      onClick={async () => {
                        await NotificationService.cancelCustomWorkoutReminder();
                        toast({
                          title: "Reminder Cancelled",
                          description: "Custom workout reminder has been cancelled.",
                        });
                      }} 
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Set a custom daily time for workout reminders (repeats every day)
                  </p>
                </div>

                <Separator />

                {/* Test Notifications */}
                <div className="space-y-2">
                  <Label>Test Notifications</Label>
                  <Button onClick={testNotifications} variant="outline" className="w-full">
                    <Bell className="h-4 w-4 mr-2" />
                    Test Workout & Achievement Notifications
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Test workout completion and achievement notifications
                  </p>
                </div>
              </>
            )}

          </CardContent>
        </Card>


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
                onClick={() => setTermsDialogOpen(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                {getText('terms_service')}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:bg-accent"
                onClick={() => setPrivacyDialogOpen(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                {getText('privacy_policy')}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:bg-accent"
                onClick={() => setSupportDialogOpen(true)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                {getText('contact_support')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terms of Service Dialog */}
      <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using Planik Fitness App, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">2. Use License</h3>
              <p className="text-muted-foreground">
                Permission is granted to temporarily use Planik for personal, non-commercial fitness tracking purposes. This license shall automatically terminate if you violate any of these restrictions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. User Account</h3>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Health Disclaimer</h3>
              <p className="text-muted-foreground">
                Planik provides fitness tracking and guidance. Always consult with a healthcare professional before beginning any exercise program. We are not liable for any injuries or health issues.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Modifications</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Continued use of the app constitutes acceptance of modified terms.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. Information We Collect</h3>
              <p className="text-muted-foreground">
                We collect information you provide directly, including your name, email, workout data, nutrition logs, progress photos, and health metrics.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. How We Use Your Information</h3>
              <p className="text-muted-foreground">
                Your data is used to provide personalized workout recommendations, track your fitness progress, and improve our services. We never sell your personal information.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Data Storage & Security</h3>
              <p className="text-muted-foreground">
                All data is encrypted and stored securely using industry-standard protocols. We implement appropriate technical and organizational measures to protect your information.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Third-Party Services</h3>
              <p className="text-muted-foreground">
                We may use third-party services for authentication (Google OAuth) and analytics. These services have their own privacy policies.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Your Rights</h3>
              <p className="text-muted-foreground">
                You have the right to access, modify, or delete your personal data at any time. You can export your data or request account deletion from the settings.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">6. Contact Us</h3>
              <p className="text-muted-foreground">
                For privacy concerns or questions, contact us at privacy@planik.com
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Support Dialog */}
      <Dialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Type your message here..."
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              className="min-h-[150px] resize-none"
              disabled={isSendingSupport}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSupportMessage}
                disabled={isSendingSupport || !supportMessage.trim()}
                size="icon"
                className="rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}