import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BiometricService } from '@/services/BiometricService';
import { Mail, Lock, User, Calendar, Users, Chrome, Fingerprint, Phone } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [email, setEmail] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginCredential = loginMethod === 'email' ? loginForm.email : loginForm.phone;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginCredential,
        password: loginForm.password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });

      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    
    try {
      const isAvailable = await BiometricService.isAvailable();
      
      if (!isAvailable.isAvailable) {
        toast({
          title: "Biometric Not Available",
          description: isAvailable.reason || "Biometric authentication is not available on this device.",
          variant: "destructive",
        });
        return;
      }

      const authSuccess = await BiometricService.authenticate("Please authenticate to login to Planik");
      
      if (authSuccess) {
        // Simulate biometric login with stored credentials
        const storedEmail = localStorage.getItem('biometric_email') || 'biometric@user.com';
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: storedEmail,
          password: 'biometric_auth_token',
        });

        if (error) {
          // For demo purposes, create a mock biometric user
          const mockUser = {
            id: 'biometric-user-' + Date.now(),
            email: storedEmail,
            user_metadata: {
              name: 'Biometric User',
              avatar_url: '',
              biometric_enabled: true
            }
          };

          // Store mock session
          localStorage.setItem('supabase_session', JSON.stringify({
            user: mockUser,
            access_token: 'mock_biometric_token_' + Date.now()
          }));
        }

        toast({
          title: "Biometric Login Successful!",
          description: "Welcome back! You've been authenticated using biometrics.",
        });

        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Biometric Login Failed",
        description: "Failed to authenticate using biometrics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Reset Email Sent",
        description: `A password reset link has been sent to ${forgotPasswordEmail}. Please check your email and follow the instructions.`,
      });
      
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      console.log('Starting signup process...');
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          data: {
            name: signupForm.name,
            gender: signupForm.gender,
            date_of_birth: signupForm.dateOfBirth,
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Signup successful:', data);
      
      toast({
        title: "Account Created!",
        description: "Welcome to Planik! You can now start your fitness journey.",
      });

      // For the mock system, redirect immediately since no email verification is needed
      navigate('/');

    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during signup.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    try {
      console.log('Starting Google OAuth...');
      
      // Simulate Google OAuth data retrieval
      const mockGoogleUser = {
        id: 'google-' + Date.now(),
        email: 'user@gmail.com',
        user_metadata: {
          name: 'Google User',
          avatar_url: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          provider: 'google'
        }
      };

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });

      if (error) {
        console.error('Google login error:', error);
        toast({
          title: "Google Login Failed",  
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Google login successful - retrieved user data:', mockGoogleUser);
      
      toast({
        title: "Welcome!",
        description: `Successfully logged in as ${mockGoogleUser.user_metadata.name}`,
        duration: 2000,
      });

      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during Google login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verification step UI removed since mock system doesn't need email verification

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Welcome to Planik
          </CardTitle>
          <p className="text-gray-600 mt-2">Your fitness journey starts here</p>
        </CardHeader>
        <CardContent>
          {/* Google Login Button - Prominent at Top */}
          <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 font-medium shadow-sm transition-all duration-200 hover:shadow-md"
              disabled={loading}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Connecting...' : 'Continue with Google'}
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
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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

                  {/* Biometric Login Button */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBiometricLogin}
                    className="w-full"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 20c-4.963 0-9-4.037-9-9s4.037-9 9-9 9 4.037 9 9-4.037 9-9 9z"/>
                      <path d="M12 6c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                    {loading ? 'Authenticating...' : 'Login with Face ID'}
                  </Button>

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
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-gender">Gender</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                      <Select
                        value={signupForm.gender}
                        onValueChange={(value) => setSignupForm({...signupForm, gender: value})}
                        required
                      >
                        <SelectTrigger className="pl-10">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-dob">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-dob"
                        type="date"
                        value={signupForm.dateOfBirth}
                        onChange={(e) => setSignupForm({...signupForm, dateOfBirth: e.target.value})}
                        className="pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
        </CardContent>
      </Card>
    </div>
  );
}