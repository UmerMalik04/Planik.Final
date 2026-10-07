import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { exercisesData } from '@/data/exercises_full';
import { SEO } from '@/components/SEO';

/**
 * ExerciseDetail page ("/exercises/:exerciseName").
 * Read-only view of a single exercise from the library: instructions,
 * targeted muscles, and the user's last-used info if any.
 */
export default function ExerciseDetail() {
  const navigate = useNavigate();
  const { exerciseName } = useParams();
  const { getText } = useSettings();

  // Find the exercise by name - match the slug generation from Exercises.tsx
  const exercise = exercisesData.find(ex => {
    const exerciseSlug = ex.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return exerciseSlug === exerciseName?.toLowerCase();
  });

  if (!exercise) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <SEO
          title="Exercise Not Found — Planik"
          description="The requested exercise could not be found in Planik's exercise library."
        />
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/exercises')}
            className="hover:bg-accent"
            aria-label="Back to exercises"
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

  /** Format an ISO date as a friendly relative label (e.g. "2 days ago"). */
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

  // Article JSON-LD: exercise name as headline, instructions joined as articleBody.
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: exercise.name,
    articleBody: exercise.instructions.join(" "),
    about: exercise.muscle_groups,
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <SEO
        title={`${exercise.name} — Exercise Guide | Planik`}
        description={`How to perform ${exercise.name}. Step-by-step instructions and target muscles: ${exercise.muscle_groups.join(", ")}.`}
        ogType="article"
        jsonLd={articleJsonLd}
      />
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/exercises')}
          className="hover:bg-accent"
          aria-label="Back to exercises"
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

    </div>
  );
}