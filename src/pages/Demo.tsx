import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function Demo() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Authentication Demo
          </CardTitle>
          <p className="text-gray-600 mt-2">Planik Fitness App</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Setup Required:</strong> To use the authentication system, please configure your Supabase project:
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-lg mb-3">✨ Features Included:</h3>
              <ul className="space-y-2 text-sm">
                <li>✅ <strong>Email/Password Authentication</strong> - Secure login and signup</li>
                <li>✅ <strong>Google OAuth Login</strong> - One-click social authentication</li>
                <li>✅ <strong>Email Verification</strong> - OTP codes sent to user's email</li>
                <li>✅ <strong>User Profiles</strong> - Name, gender, date of birth collection</li>
                <li>✅ <strong>Protected Routes</strong> - Automatic authentication checks</li>
                <li>✅ <strong>User Management</strong> - Profile dropdown with logout</li>
                <li>✅ <strong>Responsive Design</strong> - Works on all devices</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-3 text-blue-800">🔧 Configuration Steps:</h3>
              <ol className="space-y-2 text-sm text-blue-700">
                <li>1. Update <code className="bg-blue-100 px-1 rounded">src/integrations/supabase/client.ts</code> with your Supabase URL and anon key</li>
                <li>2. Enable Email authentication in your Supabase dashboard</li>
                <li>3. Configure Google OAuth provider (optional)</li>
                <li>4. Set up email templates for verification</li>
                <li>5. Configure redirect URLs in Supabase Auth settings</li>
              </ol>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-lg mb-3 text-green-800">🚀 Ready to Use:</h3>
              <p className="text-sm text-green-700">
                Once configured, users can sign up with email verification, log in with email/password or Google, 
                and their profile data (name, gender, DOB) will be automatically stored in Supabase.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Visit <code>/auth</code> to see the authentication pages
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}