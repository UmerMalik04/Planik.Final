import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Search, X, Dumbbell, Footprints, AlignVerticalSpaceAround, CircleDot, Heart, Activity, Zap } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { exercisesData, type Exercise } from '@/data/exercises_full';


const muscleGroups = ['All', 'Legs', 'Back', 'Chest', 'Shoulders', 'Abs', 'Cardio', 'Triceps', 'Biceps'];

const muscleGroupIcons: Record<string, any> = {
  'All': Dumbbell,
  'Legs': Footprints,
  'Back': AlignVerticalSpaceAround,
  'Chest': CircleDot,
  'Shoulders': Dumbbell,
  'Abs': CircleDot,
  'Cardio': Heart,
  'Triceps': Zap,
  'Biceps': Zap,
};

export default function Exercises() {
  const navigate = useNavigate();
  const { getText } = useSettings();
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

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

  const filteredExercises = useMemo(() => {
    const filtered = exercisesData.filter(exercise => {
      const matchesMuscleGroup = selectedMuscleGroup === 'All' || 
        exercise.muscle_groups.some(group => 
          group.toLowerCase().includes(selectedMuscleGroup.toLowerCase())
        );
      
      const matchesSearch = searchQuery === '' || 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesMuscleGroup && matchesSearch;
    });

    // Sort: exercises starting with search query first, then others
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return filtered.sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(query);
        const bStarts = b.name.toLowerCase().startsWith(query);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
      });
    }
    
    return filtered;
  }, [selectedMuscleGroup, searchQuery]);

  const handleExerciseClick = (exercise: Exercise) => {
    const exerciseSlug = exercise.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    navigate(`/exercises/${exerciseSlug}`);
  };

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{getText('exercises_tab')}</h1>
          <p className="text-muted-foreground">Browse and manage your exercises</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSearch(!showSearch)}
          className="hover:bg-accent"
        >
          {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </Button>
      </div>

      {/* Search Input */}
      {showSearch && (
        <Card className="border-2 border-[hsl(var(--widget-border))]">
          <CardContent className="p-4">
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      {/* Filter Buttons */}
      <Card className="border-2 border-[hsl(var(--widget-border))]">
        <CardContent className="p-4">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2 min-w-max">
              {muscleGroups.map((group) => {
                const Icon = group === 'All' ? muscleGroupIcons[group] : null;
                return (
                  <Button
                    key={group}
                    variant={selectedMuscleGroup === group ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMuscleGroup(group)}
                    className="whitespace-nowrap flex-shrink-0 animate-fade-in hover-scale flex items-center gap-2"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {group}
                  </Button>
                );
              })}
            </div>
          </div>
          {/* Mobile swipe indicator */}
          <div className="flex justify-center mt-2 md:hidden">
            <div className="flex gap-1">
              {muscleGroups.map((_, index) => (
                <div 
                  key={index}
                  className={`h-1 w-1 rounded-full transition-colors ${
                    index === muscleGroups.findIndex(g => g === selectedMuscleGroup) 
                      ? 'bg-primary' 
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <div className="space-y-3">
        {filteredExercises.map((exercise, index) => (
          <Card 
            key={index}
            className="border-2 border-[hsl(var(--widget-border))] hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() => handleExerciseClick(exercise)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <img
                  src={exercise.thumbnail}
                  alt={exercise.name}
                  className="w-12 h-12 rounded-lg object-cover bg-muted"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exercise.muscle_groups.map((muscle, muscleIndex) => (
                      <Badge 
                        key={muscleIndex} 
                        variant="secondary"
                        className="text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">
                    {formatLastUsed(exercise.last_used)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredExercises.length === 0 && (
          <Card className="border-2 border-[hsl(var(--widget-border))]">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                No exercises found matching your criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}