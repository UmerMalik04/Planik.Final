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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { SEO } from '@/components/SEO';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Globe, 
  Scale, 
  Palette, 
  Calendar,
  Lock,
  Timer,
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
  Send,
  Heart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GoalsSettings from '@/components/GoalsSettings';

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


/**
 * Settings page ("/settings").
 * Central hub for theme, language, units, notifications, fitness goals,
 * password reset, feedback / support, data export and account deletion.
 */
export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme, themeColor, setThemeColor, availableColors } = useTheme();
  const { settings, updateSetting, getText } = useSettings();
  const [feedback, setFeedback] = useState('');
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [healthKitPrivacyDialogOpen, setHealthKitPrivacyDialogOpen] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get current user's email
    const getCurrentUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        setResetPasswordEmail(user.email);
      }
    };
    getCurrentUserEmail();
  }, []);






  /** Validate the email and trigger our request-password-reset edge function. */
  const handleChangePassword = async () => {
    if (!resetPasswordEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetPasswordEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingPasswordReset(true);
    
    try {
      console.log('Sending password reset email to:', resetPasswordEmail);
      
      // Call the password reset edge function
      const { data, error } = await supabase.functions.invoke('request-password-reset', {
        body: { email: resetPasswordEmail }
      });

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }
      
      setResetPasswordEmail('');
      
      toast({
        title: "✓ Password Reset Email Sent",
        description: `A password reset link has been sent to ${resetPasswordEmail}. Please check your email.`,
      });
      
      console.log('Password reset email sent successfully');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('Resetting loading state');
      setIsSendingPasswordReset(false);
    }
  };

  /** Send general feedback to the team via the send-feedback edge function. */
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

  /** Send a support request via the same edge function but from the support dialog. */
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

  /** Placeholder for data export — currently just shows a toast. */
  const handleExportData = (format: 'csv' | 'pdf') => {
    toast({
      title: "Export Started",
      description: `Your data is being exported as ${format.toUpperCase()}...`,
    });
  };

  /**
   * Permanently delete the user's account and all personal data.
   *
   * Calls the delete-account edge function, which:
   *  1. Verifies the caller's JWT.
   *  2. Deletes all rows owned by the user from every public table.
   *  3. Deletes the auth user via Supabase Admin API.
   *
   * Apple Guideline 5.1.1(v) requires in-app account deletion that
   * actually removes the user — this satisfies that requirement.
   */
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');

      if (error) {
        throw new Error(error.message || 'Failed to delete account');
      }

      // Clear any cached local auth state
      await supabase.auth.signOut({ scope: 'global' });
      localStorage.clear();

      toast({
        title: 'Account Deleted',
        description: 'Your account and all data have been permanently deleted.',
        variant: 'destructive',
      });

      navigate('/auth');
    } catch (err: any) {
      toast({
        title: 'Deletion Failed',
        description: err.message || 'Unable to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAccount(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <SEO
        title="Settings — Planik"
        description="Customize Planik: theme, units, language, rest timer defaults, notifications, biometrics, and account preferences."
      />
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




        {/* Workout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Workout Settings
            </CardTitle>
            <CardDescription>Configure rest timer and workout preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rest Timer Enabled */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Rest Timer</Label>
                <p className="text-sm text-muted-foreground">
                  Show rest timer between sets
                </p>
              </div>
              <Switch
                checked={settings.restTimerEnabled}
                onCheckedChange={(value) => updateSetting('restTimerEnabled', value)}
              />
            </div>

            {settings.restTimerEnabled && (
              <>
                <Separator />

                {/* Default Rest Time */}
                <div className="space-y-3">
                  <Label>Default Rest Time (seconds)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min="30"
                      max="300"
                      step="15"
                      value={settings.defaultRestTime}
                      onChange={(e) => updateSetting('defaultRestTime', Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">
                      {Math.floor(settings.defaultRestTime / 60)}:{(settings.defaultRestTime % 60).toString().padStart(2, '0')} minutes
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Default rest duration between sets (30-300 seconds)
                  </p>
                </div>

                <Separator />

                {/* Auto-start Timer */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-start Timer</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically start rest timer after completing a set
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoStartTimer}
                    onCheckedChange={(value) => updateSetting('autoStartTimer', value)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Goals Settings */}
        <GoalsSettings />

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
              <p className="text-xs text-muted-foreground">
                A password reset link will be sent to your email address.
              </p>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={resetPasswordEmail}
                  onChange={(e) => setResetPasswordEmail(e.target.value)}
                  readOnly={!!userEmail}
                  className={userEmail ? "bg-muted cursor-not-allowed" : ""}
                />
                <Button 
                  onClick={handleChangePassword} 
                  disabled={isSendingPasswordReset || !resetPasswordEmail}
                  className="w-full transition-all active:scale-95 hover:shadow-lg disabled:opacity-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isSendingPasswordReset ? "Sending Reset Link..." : "Send Password Reset Link"}
                </Button>
              </div>
            </div>

            <Separator />
            
            <Button 
              variant="destructive" 
              className="w-full justify-start transition-all active:scale-95 hover:shadow-lg"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {getText('delete_account_data')}
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
                onClick={() => setHealthKitPrivacyDialogOpen(true)}
              >
                <Heart className="h-4 w-4 mr-2 text-red-500" />
                HealthKit Privacy Policy
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:bg-accent"
                onClick={() => navigate('/healthkit-settings')}
              >
                <Heart className="h-4 w-4 mr-2 text-red-500" />
                HealthKit Settings
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:bg-accent"
                onClick={() => navigate('/help')}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Tutorials
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:bg-accent"
                onClick={() => setSupportDialogOpen(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
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

      {/* HealthKit Privacy Policy Dialog */}
      <Dialog open={healthKitPrivacyDialogOpen} onOpenChange={setHealthKitPrivacyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              HealthKit Privacy Policy
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 font-medium">
                Your health data privacy is our top priority. This policy explains how Planik uses Apple HealthKit.
              </p>
            </div>

            <section>
              <h3 className="font-semibold mb-2">1. Health Data We Access</h3>
              <p className="text-muted-foreground mb-2">
                Planik only accesses the following health data from Apple HealthKit:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li><strong>Step Count</strong> - Your daily step count data (Read-only access)</li>
              </ul>
              <p className="text-muted-foreground mt-2 text-xs">
                We do not access any other health data such as heart rate, sleep, weight, or medical records.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. How We Use Your Health Data</h3>
              <p className="text-muted-foreground">
                Your step count data is used solely for the following purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-2">
                <li>Displaying your daily step count within the app</li>
                <li>Tracking your step history and progress over time</li>
                <li>Helping you achieve your fitness goals</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Data Storage & Security</h3>
              <p className="text-muted-foreground">
                Your health data is:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-2">
                <li>Stored securely on your device and in your personal account</li>
                <li>Encrypted using industry-standard protocols</li>
                <li>Never shared with third parties</li>
                <li>Never used for advertising or marketing purposes</li>
                <li>Never sold to any entity</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Your Control Over Health Data</h3>
              <p className="text-muted-foreground">
                You have complete control over your health data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-2">
                <li>You can revoke HealthKit access at any time in iOS Settings</li>
                <li>You can delete your health data from the app at any time</li>
                <li>Revoking access will stop the app from reading new data</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Data Sharing</h3>
              <p className="text-muted-foreground">
                We <strong>never</strong> share your HealthKit data with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-2">
                <li>Third-party advertisers</li>
                <li>Data brokers</li>
                <li>Social media platforms</li>
                <li>Any external services not essential to app functionality</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">6. Compliance</h3>
              <p className="text-muted-foreground">
                Planik complies with Apple's HealthKit guidelines and requirements, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-2">
                <li>Only requesting access to data necessary for app functionality</li>
                <li>Providing clear disclosure of data usage</li>
                <li>Respecting user privacy and data control</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">7. Contact Us</h3>
              <p className="text-muted-foreground">
                For questions about how we handle your health data, please contact us at privacy@planik.com
              </p>
            </section>

            <div className="bg-muted rounded-lg p-4 mt-4">
              <p className="text-xs text-muted-foreground">
                Last updated: January 2026. This policy may be updated periodically. We will notify you of any significant changes.
              </p>
            </div>
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

      {/* Delete Account Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data
              (workouts, diet logs, step history, and settings). This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={isDeletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}