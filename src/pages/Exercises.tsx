import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export default function Exercises() {
  const navigate = useNavigate();
  const { getText } = useSettings();

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getText('exercises_tab')}</h1>
          <p className="text-muted-foreground">Browse and manage your exercises</p>
        </div>
      </div>

      {/* Content */}
      <Card className="border-2 border-[hsl(var(--widget-border))]">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Dumbbell className="h-6 w-6" />
            {getText('exercises_tab')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">
            Exercises feature coming soon! This will include:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Exercise library with instructions</li>
            <li>• Muscle group targeting</li>
            <li>• Custom exercise creation</li>
            <li>• Exercise analytics</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}