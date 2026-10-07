import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, User, Calendar, Users, Chrome, Phone } from 'lucide-react';
import { BiometricService } from '@/services/BiometricService';
import { GoogleAuthService } from '@/services/GoogleAuthService';
import { AppleAuthService } from '@/services/AppleAuthService';

/**
 * Auth page ("/auth").
 * Handles email/phone login, signup, OAuth (Google/Apple), guest sign-in,
 * forgot password, and the password-reset flow that lands here from the
 * recovery email link.
 */
/**
 * Return a safe post-auth redirect target. Reads ?next=… from the current URL
 * and only accepts a same-origin relative path (must start with "/" and NOT
 * with "//"). Used so the MCP OAuth consent screen at /.lovable/oauth/consent
 * can bring the user back after signing in.
 */
function safeNextPath(fallback = "/"): string {
  try {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  } catch {
    /* ignore */
  }
  return fallback;
}

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [email, setEmail] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    phone: '',
    password: ''
  });

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    gender: '',
    dateOfBirth: ''
  });

  // Verification code state
  const [verificationCode, setVerificationCode] = useState('');

  // Check URL parameters for password reset (handles both hash and query params)
  useEffect(() => {
    const handleRecoveryUrl = async () => {
      // Check query params first
      const urlParams = new URLSearchParams(window.location.search);
      let type = urlParams.get('type');
      let token = urlParams.get('token');
      let emailParam = urlParams.get('email');
      
      // Also check hash params (Supabase uses hash for recovery links)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const hashType = hashParams.get('type');
      
      // If we have access_token in hash with recovery type, we have a valid recovery session
      if (accessToken && (hashType === 'recovery' || type === 'recovery')) {
        try {
          // Set the session from the tokens in the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            toast({
              title: "Invalid Reset Link",
              description: "This password reset link is invalid or has expired. Please request a new one.",
              variant: "destructive",
            });
          } else if (data.session) {
            setShowPasswordReset(true);
            toast({
              title: "Link Verified",
              description: "You can now set your new password.",
            });
            // Clear the hash from URL
            window.history.replaceState({}, document.title, '/auth?type=recovery');
          }
        } catch (err) {
          toast({
            title: "Error",
            description: "Failed to verify reset link. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }
      
      // Handle query param token (fallback)
      if (type === 'recovery') {
        if (token) {
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'recovery',
            });
            
            if (error) {
              toast({
                title: "Invalid Reset Link",
                description: "This password reset link is invalid or has expired. Please request a new one.",
                variant: "destructive",
              });
            } else {
              setShowPasswordReset(true);
              toast({
                title: "Link Verified",
                description: "You can now set your new password.",
              });
            }
          } catch (err) {
            toast({
              title: "Error",
              description: "Failed to verify reset link. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          // Check if user is already authenticated (clicked link while logged in)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setShowPasswordReset(true);
          }
        }
        
        if (emailParam) {
          setEmail(decodeURIComponent(emailParam));
        }
      }
    };
    
    handleRecoveryUrl();
  }, [toast]);

  /** Submit handler for the "set new password" form shown after recovery link verification. */
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
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

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated. You can now log in with your new password.",
      });

      // Reset form and redirect to login
      setShowPasswordReset(false);
      setNewPassword('');
      setConfirmNewPassword('');
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, '/auth');
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** Email/phone + password login. Cleans up any stale session first to avoid limbo states. */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up any existing auth state first
      const cleanupAuthState = () => {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      };

      cleanupAuthState();

      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const loginCredential = loginMethod === 'email' ? loginForm.email : loginForm.phone;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginCredential,
        password: loginForm.password,
      });

      if (error) {
        toast({
          title: "Login Failed", 
          description: error.message === 'Invalid login credentials' 
            ? 'Incorrect email or password. Please check your credentials and try again.'
            : error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user && data.session) {
        // Save refresh token if biometric is enabled
        const biometricEnabled = await BiometricService.isBiometricEnabled();
        if (biometricEnabled && data.session.refresh_token) {
          await BiometricService.saveRefreshToken(data.session.refresh_token);
        }

        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        });

        // Force page reload for clean state
        window.location.href = safeNextPath();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  /** Send the user a branded password-reset email via our edge function. */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call our custom edge function to send branded email
      const { data, error } = await supabase.functions.invoke('request-password-reset', {
        body: { email: forgotPasswordEmail }
      });

      if (error) throw error;
      
      toast({
        title: "Password Reset Email Sent!",
        description: `A password reset link has been sent to ${forgotPasswordEmail}. Please check your email and click the link.`,
      });
      
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** Validate the signup form, create the account, and forward the user into the app. */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!signupForm.name || !signupForm.gender || !signupForm.dateOfBirth) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: signupForm.name,
            gender: signupForm.gender,
            date_of_birth: signupForm.dateOfBirth,
          }
        }
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('rate limit') || error.code === 'over_email_send_rate_limit') {
          toast({
            title: "Too Many Attempts",
            description: "Please wait a few minutes before trying to sign up again.",
            variant: "destructive",
          });
        } else if (error.message.includes('Error sending confirmation email') || error.code === 'unexpected_failure') {
          toast({
            title: "Email Service Issue", 
            description: "There's an issue with the email confirmation service. You can try disabling email confirmation in Supabase settings for testing.",
            variant: "destructive",
          });
        } else if (error.message.includes('User already registered')) {
          toast({
            title: "Account Already Exists",
            description: "An account with this email already exists. Try logging in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Account Created!",
        description: "Welcome to Planik! You can now start your fitness journey.",
      });

      // For the mock system, redirect immediately since no email verification is needed
      navigate(safeNextPath());

    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during signup.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** Kick off Google OAuth (native plugin on mobile, redirect on web). */
  const handleGoogleLogin = async () => {
    setLoading(true);
    
    try {
      const result = await GoogleAuthService.signIn();
      
      if (!result.success) {
        if (result.error?.includes('Invalid provider') || 
            result.error?.includes('provider is not enabled') || 
            result.error?.includes('Unsupported provider')) {
          toast({
            title: "Google OAuth Not Configured",  
            description: "Please set up Google OAuth in your Supabase project. Go to Authentication > Providers > Google and add your Client ID and Secret.",
            variant: "destructive",
          });
        } else if (result.error === 'Sign-in was cancelled') {
          // User cancelled, no toast needed
        } else {
          toast({
            title: "Google Login Failed",  
            description: result.error || "An unexpected error occurred.",
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }

      // For native, we get the session directly, redirect to home
      if (GoogleAuthService.isNativePlatform()) {
        window.location.href = safeNextPath();
      }
      // For web, OAuth will redirect automatically
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message || "An unexpected error occurred. Please ensure Google OAuth is configured in your Supabase project.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  /**
   * Kick off Sign in with Apple.
   *
   * On native iOS we use the Capacitor plugin for the native Apple sign-in
   * sheet (required by Apple Review Guideline 4.8 when Google Sign-In is
   * offered). On web we fall back to Supabase OAuth redirect.
   */
  const handleAppleLogin = async () => {
    setLoading(true);

    try {
      const result = await AppleAuthService.signIn();

      if (!result.success) {
        if (result.error?.includes('configured') || result.error?.includes('provider')) {
          toast({
            title: 'Apple Sign-In Not Configured',
            description: 'Please set up Apple OAuth in your Supabase project: Authentication > Providers > Apple.',
            variant: 'destructive',
          });
        } else if (result.error === 'Sign-in was cancelled') {
          // User cancelled — silent, no toast
        } else {
          toast({
            title: 'Apple Sign-In Failed',
            description: result.error || 'An unexpected error occurred.',
            variant: 'destructive',
          });
        }
        setLoading(false);
        return;
      }

      // For web OAuth fallback, the redirect happens automatically
      // For native, AppleAuthService already navigates on success
    } catch (error: any) {
      toast({
        title: 'Apple Sign-In Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  /** Sign in anonymously so the user can try the app without creating an account. */
  const handleGuestLogin = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        // Check for specific error cases
        if (error.message.includes('Anonymous sign-ins are disabled') || 
            error.message.includes('anonymous_provider_disabled') ||
            error.code === 'anonymous_provider_disabled') {
          toast({
            title: "Guest Login Not Enabled",
            description: "Please enable 'Anonymous Sign-ins' in your Supabase dashboard: Authentication → Providers → Anonymous.",
            variant: "destructive",
          });
        } else if (error.message.includes('Anonymous sign-ins not allowed') ||
                   error.message.includes('not allowed')) {
          toast({
            title: "Guest Login Not Available",
            description: "Anonymous sign-ins are not enabled. Go to Supabase → Authentication → Providers → Enable Anonymous sign-ins.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Guest Login Failed",
            description: error.message || "Unable to sign in as guest. Please try again or create an account.",
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        toast({
          title: "Welcome, Guest!",
          description: "You're now exploring as a guest. Create an account anytime to save your progress.",
        });
        window.location.href = safeNextPath();
      } else {
        toast({
          title: "Guest Login Failed",
          description: "No user was created. Please check if Anonymous sign-ins are enabled in Supabase.",
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Guest login error:', error);
      toast({
        title: "Guest Login Failed",
        description: error?.message || "An unexpected error occurred. Please enable Anonymous sign-ins in Supabase or try creating an account.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <Card className="w-full max-w-md overflow-hidden box-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground">
            {showPasswordReset ? 'Reset Your Password' : 'Welcome to Planik'}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            {showPasswordReset ? 'Enter your new password below' : 'Your fitness journey starts here'}
          </p>
        </CardHeader>
        <CardContent>
          {showPasswordReset ? (
            /* Password Reset Form */
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating Password...' : 'Update Password'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordReset(false);
                  window.history.replaceState({}, document.title, '/auth');
                }}
                className="w-full"
              >
                Back to Login
              </Button>
            </form>
          ) : (
            /* Regular Auth Forms */
            <>
              {/* Social Login Buttons */}
              <div className="flex flex-col gap-3 mb-4">
                {/* Official Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex items-center justify-center w-full h-12 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700 font-medium text-sm">Sign in with Google</span>
                </button>

                {/* Official Apple Sign-In Button */}
                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={loading}
                  className="flex items-center justify-center w-full h-12 px-4 bg-black border border-black rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span className="text-white font-medium text-sm">Sign in with Apple</span>
                </button>
              </div>

              {/* Guest/Anonymous Login */}
              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGuestLogin}
                  className="w-full h-12 text-muted-foreground hover:text-foreground font-medium transition-all duration-200 border-dashed"
                  disabled={loading}
                >
                  <User className="mr-3 h-5 w-5" />
                  {loading ? 'Connecting...' : 'Continue as Guest'}
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
              
              <Tabs defaultValue="login" className="space-y-4 mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  {!showForgotPassword ? (
                    <>
                      <div className="space-y-2">
                        <Label>Login Method</Label>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant={loginMethod === 'email' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLoginMethod('email')}
                            className="flex-1"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </Button>
                          <Button
                            type="button"
                            variant={loginMethod === 'phone' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLoginMethod('phone')}
                            className="flex-1"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Phone
                          </Button>
                        </div>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-4">
                        {loginMethod === 'email' ? (
                          <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="login-email"
                                type="email"
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                                placeholder="Enter your email"
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="login-phone">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="login-phone"
                                type="tel"
                                value={loginForm.phone}
                                onChange={(e) => setLoginForm({...loginForm, phone: e.target.value})}
                                placeholder="Enter your phone number"
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-password"
                              type="password"
                              value={loginForm.password}
                              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                              placeholder="Enter your password"
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Logging in...' : 'Login'}
                        </Button>
                      </form>

                      {/* Forgot Password Link */}
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          Forgot your password?
                        </Button>
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">Reset Password</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter your email address and we'll send you a link to reset your password.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="forgot-email"
                            type="email"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowForgotPassword(false)}
                          className="w-full"
                        >
                          Back to Login
                        </Button>
                      </div>
                    </form>
                  )}
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          value={signupForm.name}
                          onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                          placeholder="Enter your full name"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-[1fr_1fr] gap-2 w-full">
                      <div className="space-y-2 min-w-0 flex-1">
                        <Label htmlFor="signup-gender">Gender</Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                          <Select
                            value={signupForm.gender}
                            onValueChange={(value) => setSignupForm({...signupForm, gender: value})}
                            required
                          >
                            <SelectTrigger className="pl-10 w-full">
                              <SelectValue placeholder="Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2 min-w-0 flex-1">
                        <Label htmlFor="signup-dob">Date of Birth</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                          <Input
                            id="signup-dob"
                            type="date"
                            value={signupForm.dateOfBirth}
                            onChange={(e) => setSignupForm({...signupForm, dateOfBirth: e.target.value})}
                            className="pl-10 w-full [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                          placeholder="Enter your email"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                          placeholder="Create a password"
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          value={signupForm.confirmPassword}
                          onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})}
                          placeholder="Confirm your password"
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}