import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { exercisesData } from '@/data/exercises_full';

export default function ExerciseDetail() {
  const navigate = useNavigate();
  const { exerciseName } = useParams();
  const { getText } = useSettings();

  // Find the exercise by name
  const exercise = exercisesData.find(ex => 
    ex.name.toLowerCase().replace(/\s+/g, '-') === exerciseName?.toLowerCase()
  );

  if (!exercise) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/exercises')}
            className="hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Exercise Not Found</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">The requested exercise could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatLastUsed = (dateString: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`;
    return `${Math.ceil(diffDays / 30)}mo ago`;
  };

  const renderMedia = () => {
    const mediaUrl = exercise.video_or_animation;
    
    if (mediaUrl.endsWith('.json')) {
      // Lottie animation - placeholder for now
      return (
        <div className="flex justify-center mb-6">
          <div className="h-[300px] w-[300px] bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Lottie Animation</p>
          </div>
        </div>
      );
    } else if (mediaUrl.endsWith('.mp4')) {
      // Video
      return (
        <div className="flex justify-center mb-6">
          <video
            autoPlay
            loop
            muted
            className="h-[300px] w-[300px] object-cover rounded-lg bg-muted"
          >
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      // GIF or image fallback
      return (
        <div className="flex justify-center mb-6">
          <img
            src={mediaUrl}
            alt={exercise.name}
            className="h-[300px] w-[300px] object-cover rounded-lg bg-muted"
          />
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/exercises')}
          className="hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{exercise.name}</h1>
          <p className="text-sm text-muted-foreground">
            Last used: {formatLastUsed(exercise.last_used)}
          </p>
        </div>
      </div>

      {/* Exercise Demo */}
      <Card className="border-2 border-[hsl(var(--widget-border))]">
        <CardContent className="p-6">
          {renderMedia()}
        </CardContent>
      </Card>

      {/* Muscle Groups */}
      <Card className="border-2 border-[hsl(var(--widget-border))]">
        <CardHeader>
          <CardTitle className="text-lg">Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {exercise.muscle_groups.map((muscle, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {muscle}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-2 border-[hsl(var(--widget-border))]">
        <CardHeader>
          <CardTitle className="text-lg">Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {exercise.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-foreground">{instruction}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Add to Workout Button */}
      <div className="fixed bottom-6 left-6 right-6 z-10">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add to Workout
        </Button>
      </div>
    </div>
  );
}