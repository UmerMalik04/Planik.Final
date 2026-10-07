import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Eye, Database, Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <SEO
        title="Privacy Policy — Planik"
        description="Planik privacy policy: how we collect, use, and protect your health and fitness data."
      />
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong>Account Information:</strong> When you create an account, we store your email address, name, and profile preferences securely via Supabase Auth.
            </p>
            <p>
              <strong>Health & Fitness Data:</strong> With your permission, we read step count data from Apple HealthKit (iOS) or Health Connect (Android). This data is used solely to display your activity progress within the app.
            </p>
            <p>
              <strong>Workout & Nutrition Data:</strong> Exercise logs, workout plans, diet entries, and progress photos you create are stored in our database under your user ID.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              How We Use Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              All data is used exclusively to power your personal fitness experience. We do not sell, rent, or share your personal information with third parties for marketing purposes.
            </p>
            <p>
              Health data from Apple HealthKit / Health Connect is read-only. We do not write data back to your health store unless you explicitly record a workout through the app.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Data Retention & Deletion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              You can request deletion of your account and all associated data at any time from the Settings screen. Upon deletion, your user account, workout history, diet logs, and step data are permanently removed from our database within 30 days.
            </p>
            <p>
              Anonymous/guest accounts and their data may be purged automatically after 90 days of inactivity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              If you have questions about this privacy policy or your data, you can reach us through the Support section in Settings.
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center pt-4">
          Last updated: June 30, 2026
        </p>
      </div>
    </div>
  );
}
