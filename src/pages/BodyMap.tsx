import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export default function BodyMap() {
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
          <h1 className="text-2xl font-bold text-foreground">{getText('body_map_tab')}</h1>
          <p className="text-muted-foreground">Visualize your muscle development</p>
        </div>
      </div>

      {/* Content */}
      <Card className="border-2 border-[hsl(var(--widget-border))]">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <User className="h-6 w-6" />
            {getText('body_map_tab')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">
            Body map feature coming soon! This will include:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Interactive muscle group visualization</li>
            <li>• Progress tracking by body part</li>
            <li>• Workout intensity heatmaps</li>
            <li>• Muscle imbalance detection</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}