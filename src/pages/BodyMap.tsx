import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { InteractiveBodyMap } from '@/components/InteractiveBodyMap';
import { SEO } from '@/components/SEO';

/**
 * BodyMap page ("/body-map").
 * Interactive anatomical diagram. Tapping a muscle group navigates to a
 * filtered view of exercises that target it.
 */
export default function BodyMap() {
  const navigate = useNavigate();
  const { getText } = useSettings();

  return (
    <div className="min-h-screen p-6 space-y-6">
      <SEO
        title="Body Map — Planik"
        description="Tap any muscle group on the interactive body map to find exercises that target it. Visualize coverage and balance your training."
      />
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="hover:bg-accent"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getText('body_map_tab')}</h1>
          <p className="text-muted-foreground">Track your muscle development and workout intensity</p>
        </div>
      </div>

      {/* Interactive Body Map Component */}
      <InteractiveBodyMap />
    </div>
  );
}