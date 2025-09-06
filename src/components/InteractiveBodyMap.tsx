import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { Activity, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import { useSettings } from '@/contexts/SettingsContext';

// Import the body map images
const bodyMaps = {
  'male-front': '/lovable-uploads/0731170e-4d41-4a25-b381-49191ff2c5c5.png',
  'male-back': '/lovable-uploads/4b27650a-3252-4401-83f7-14699ced6400.png',
  'female-front': '/lovable-uploads/c73da54d-0b40-456b-bef3-c852df323dcf.png',
  'female-back': '/lovable-uploads/2ba581e5-8af8-4079-90a5-b3752b8d2395.png',
};

// Precise rectangular hitbox areas matching the reference image exactly
const muscleHitboxes: Record<string, Record<string, { x: number; y: number; width: number; height: number }>> = {
  'male-front': {
    shoulders: { x: 80, y: 55, width: 45, height: 55 }, // Left shoulder
    'right-shoulders': { x: 175, y: 55, width: 45, height: 55 }, // Right shoulder
    chest: { x: 110, y: 80, width: 80, height: 65 }, // Chest area
    biceps: { x: 70, y: 95, width: 40, height: 60 }, // Left bicep
    'right-biceps': { x: 190, y: 95, width: 40, height: 60 }, // Right bicep
    triceps: { x: 60, y: 110, width: 35, height: 50 }, // Left tricep (back view)
    'right-triceps': { x: 205, y: 110, width: 35, height: 50 }, // Right tricep (back view)
    forearms: { x: 75, y: 155, width: 40, height: 50 }, // Left forearm
    'right-forearms': { x: 185, y: 155, width: 40, height: 50 }, // Right forearm
    abs: { x: 115, y: 145, width: 70, height: 65 }, // Core/Abs
    legs: { x: 110, y: 210, width: 80, height: 140 }, // Combined legs (quads/hamstrings/calves)
  },
  'male-back': {
    shoulders: { x: 80, y: 55, width: 45, height: 55 }, // Left shoulder
    'right-shoulders': { x: 175, y: 55, width: 45, height: 55 }, // Right shoulder
    back: { x: 105, y: 70, width: 90, height: 85 }, // Upper back
    triceps: { x: 70, y: 95, width: 45, height: 60 }, // Left tricep
    'right-triceps': { x: 185, y: 95, width: 45, height: 60 }, // Right tricep
    forearms: { x: 75, y: 155, width: 40, height: 50 }, // Left forearm
    'right-forearms': { x: 185, y: 155, width: 40, height: 50 }, // Right forearm
    glutes: { x: 115, y: 155, width: 70, height: 55 }, // Glutes
    legs: { x: 110, y: 210, width: 80, height: 140 }, // Combined legs (hamstrings/calves)
  },
  'female-front': {
    shoulders: { x: 80, y: 55, width: 45, height: 55 }, // Left shoulder
    'right-shoulders': { x: 175, y: 55, width: 45, height: 55 }, // Right shoulder
    chest: { x: 115, y: 75, width: 70, height: 65 }, // Chest area
    biceps: { x: 70, y: 90, width: 40, height: 55 }, // Left bicep
    'right-biceps': { x: 190, y: 90, width: 40, height: 55 }, // Right bicep
    triceps: { x: 60, y: 105, width: 35, height: 45 }, // Left tricep (back view)
    'right-triceps': { x: 205, y: 105, width: 35, height: 45 }, // Right tricep (back view)
    forearms: { x: 70, y: 145, width: 40, height: 50 }, // Left forearm
    'right-forearms': { x: 190, y: 145, width: 40, height: 50 }, // Right forearm
    abs: { x: 125, y: 135, width: 50, height: 60 }, // Core/Abs
    legs: { x: 110, y: 190, width: 80, height: 155 }, // Combined legs
  },
  'female-back': {
    shoulders: { x: 80, y: 55, width: 45, height: 55 }, // Left shoulder
    'right-shoulders': { x: 175, y: 55, width: 45, height: 55 }, // Right shoulder
    back: { x: 105, y: 70, width: 90, height: 85 }, // Upper back
    triceps: { x: 70, y: 95, width: 45, height: 55 }, // Left tricep
    'right-triceps': { x: 185, y: 95, width: 45, height: 55 }, // Right tricep
    forearms: { x: 70, y: 150, width: 40, height: 50 }, // Left forearm
    'right-forearms': { x: 190, y: 150, width: 40, height: 50 }, // Right forearm
    glutes: { x: 115, y: 135, width: 70, height: 60 }, // Glutes
    legs: { x: 110, y: 195, width: 80, height: 150 }, // Combined legs
  }
};

// Map muscle groups to display names
const getMuscleGroupName = (muscle: string): string => {
  const cleanMuscle = muscle.replace('right-', '');
  const nameMap: Record<string, string> = {
    shoulders: 'Shoulders',
    chest: 'Chest', 
    back: 'Back',
    biceps: 'Biceps',
    triceps: 'Triceps',
    forearms: 'Forearms',
    abs: 'Abs/Core',
    legs: 'Legs',
    glutes: 'Glutes'
  };
  return nameMap[cleanMuscle] || cleanMuscle.charAt(0).toUpperCase() + cleanMuscle.slice(1);
};

// Muscle groups for tracking
const muscleGroups = ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'back', 'legs', 'glutes'];

const fitnessLevels = [
  { name: 'Beginner', color: '#ef4444', range: '0-20%' },
  { name: 'Novice', color: '#f97316', range: '20-40%' },
  { name: 'Intermediate', color: '#eab308', range: '40-60%' },
  { name: 'Advanced', color: '#3b82f6', range: '60-80%' },
  { name: 'Elite', color: '#8b5cf6', range: '80-95%' },
  { name: 'World Class', color: '#ec4899', range: '95-100%' }
];

// Individual muscle tier colors
const muscleTiers = [
  { name: 'Rookie', color: '#22c55e', range: '0-15%' },
  { name: 'Amateur', color: '#0ea5e9', range: '15-30%' },
  { name: 'Competitor', color: '#f97316', range: '30-50%' },
  { name: 'Pro', color: '#1e40af', range: '50-70%' },
  { name: 'Champion', color: '#dc2626', range: '70-90%' },
  { name: 'Legend', color: '#fbbf24', range: '90-100%' }
];

interface MuscleGroupOverlayProps {
  muscleGroup: string;
  onClose: () => void;
}

function MuscleGroupOverlay({ muscleGroup, onClose }: MuscleGroupOverlayProps) {
  const { getExerciseHistory, workoutSessions } = useWorkoutStore();
  const { formatWeight } = useSettings();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Get muscle-specific exercises based on muscle group
  const getExercisesForMuscle = (muscle: string) => {
    const exerciseMap = {
      chest: [
        { name: 'Push-ups', sets: 3, reps: 12, weight: 0 },
        { name: 'Bench Press', sets: 4, reps: 8, weight: 61 },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 27 },
        { name: 'Chest Flyes', sets: 3, reps: 12, weight: 11 }
      ],
      shoulders: [
        { name: 'Shoulder Press', sets: 3, reps: 10, weight: 18 },
        { name: 'Lateral Raises', sets: 3, reps: 12, weight: 7 },
        { name: 'Front Raises', sets: 3, reps: 12, weight: 7 },
        { name: 'Rear Delt Flyes', sets: 3, reps: 12, weight: 5 }
      ],
      biceps: [
        { name: 'Bicep Curls', sets: 3, reps: 12, weight: 11 },
        { name: 'Hammer Curls', sets: 3, reps: 10, weight: 11 },
        { name: 'Chin-ups', sets: 3, reps: 8, weight: 0 },
        { name: 'Preacher Curls', sets: 3, reps: 10, weight: 9 }
      ],
      triceps: [
        { name: 'Tricep Dips', sets: 3, reps: 10, weight: 0 },
        { name: 'Close-Grip Bench Press', sets: 3, reps: 8, weight: 52 },
        { name: 'Overhead Extension', sets: 3, reps: 12, weight: 14 },
        { name: 'Diamond Push-ups', sets: 3, reps: 10, weight: 0 }
      ],
      forearms: [
        { name: 'Wrist Curls', sets: 3, reps: 15, weight: 7 },
        { name: 'Reverse Wrist Curls', sets: 3, reps: 15, weight: 5 },
        { name: 'Farmer\'s Walk', sets: 3, reps: 30, weight: 18 },
        { name: 'Hammer Curls', sets: 3, reps: 12, weight: 11 }
      ],
      abs: [
        { name: 'Crunches', sets: 3, reps: 20, weight: 0 },
        { name: 'Planks', sets: 3, reps: 60, weight: 0 },
        { name: 'Russian Twists', sets: 3, reps: 20, weight: 5 },
        { name: 'Mountain Climbers', sets: 3, reps: 30, weight: 0 }
      ],
      back: [
        { name: 'Pull-ups', sets: 3, reps: 8, weight: 0 },
        { name: 'Barbell Rows', sets: 4, reps: 8, weight: 43 },
        { name: 'Lat Pulldowns', sets: 3, reps: 10, weight: 36 },
        { name: 'Deadlifts', sets: 4, reps: 6, weight: 84 }
      ],
      legs: [
        { name: 'Squats', sets: 4, reps: 8, weight: 70 },
        { name: 'Leg Press', sets: 3, reps: 12, weight: 91 },
        { name: 'Lunges', sets: 3, reps: 12, weight: 14 },
        { name: 'Leg Extensions', sets: 3, reps: 12, weight: 27 },
        { name: 'Romanian Deadlifts', sets: 3, reps: 10, weight: 52 },
        { name: 'Leg Curls', sets: 3, reps: 12, weight: 23 },
        { name: 'Calf Raises', sets: 4, reps: 15, weight: 20 }
      ],
      glutes: [
        { name: 'Hip Thrusts', sets: 3, reps: 12, weight: 61 },
        { name: 'Bulgarian Split Squats', sets: 3, reps: 10, weight: 11 },
        { name: 'Glute Bridges', sets: 3, reps: 15, weight: 20 },
        { name: 'Clamshells', sets: 3, reps: 15, weight: 0 }
      ]
    };
    
    return exerciseMap[muscle as keyof typeof exerciseMap] || [];
  };

  const exercises = getExercisesForMuscle(muscleGroup);

  const getMuscleProgress = (muscle: string) => {
    const recentSessions = workoutSessions.slice(-10);
    const trainingCount = recentSessions.reduce((count, session) => {
      return count + (session.exercises.some(ex => 
        ex.name.toLowerCase().includes(muscle.toLowerCase())
      ) ? 1 : 0);
    }, 0);
    return Math.min((trainingCount / 10) * 100, 100);
  };

  const getMuscleLevel = (progress: number) => {
    if (progress >= 90) return muscleTiers[5]; // Legend
    if (progress >= 70) return muscleTiers[4]; // Champion
    if (progress >= 50) return muscleTiers[3]; // Pro
    if (progress >= 30) return muscleTiers[2]; // Competitor
    if (progress >= 15) return muscleTiers[1]; // Amateur
    if (progress > 0) return muscleTiers[0]; // Rookie
    return { name: 'Untrained', color: '#6b7280', range: '0%' };
  };

  const currentLevel = getMuscleLevel(getMuscleProgress(muscleGroup));
  const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';

  const scrollPrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 capitalize">
            {getMuscleGroupName(muscleGroup)}
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-yellow-500" />}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Current Level</span>
            </div>
            <div 
              className="px-3 py-1 rounded-full text-white text-xs font-medium"
              style={{ backgroundColor: currentLevel.color }}
            >
              {currentLevel.name}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Recent Performance</span>
            <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}>
              {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Target Exercises:</h4>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-6 w-6" onClick={scrollPrev}>
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="icon" className="h-6 w-6" onClick={scrollNext}>
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {exercises.map((exercise, index) => (
                  <div key={index} className="flex-[0_0_100%] min-w-0 pr-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{exercise.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.weight > 0 && ` @ ${formatWeight(exercise.weight)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Last trained: 2 days ago
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InteractiveBodyMap() {
  const { workoutSessions } = useWorkoutStore();
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  const getMuscleProgress = (muscleGroup: string) => {
    // Get actual workout data from recent sessions
    const recentSessions = workoutSessions.slice(-30); // Last 30 sessions
    let totalSets = 0;
    let totalWorkouts = 0;
    
    recentSessions.forEach(session => {
      let hasTargetMuscle = false;
      session.exercises.forEach(exercise => {
        // Simple mapping of exercise names to muscle groups
        if (exercise.name.toLowerCase().includes(muscleGroup.toLowerCase()) ||
            (muscleGroup === 'chest' && (exercise.name.toLowerCase().includes('bench') || exercise.name.toLowerCase().includes('press'))) ||
            (muscleGroup === 'back' && (exercise.name.toLowerCase().includes('pull') || exercise.name.toLowerCase().includes('row'))) ||
            (muscleGroup === 'legs' && (exercise.name.toLowerCase().includes('squat') || exercise.name.toLowerCase().includes('leg')))) {
          hasTargetMuscle = true;
          totalSets += exercise.sets;
        }
      });
      if (hasTargetMuscle) totalWorkouts++;
    });
    
    // Progress based on frequency and volume
    const frequency = (totalWorkouts / recentSessions.length) * 100;
    const volume = Math.min(totalSets, 100);
    
    return Math.min((frequency + volume) / 2, 100);
  };

  const getFitnessLevel = (progress: number) => {
    if (progress >= 95) return fitnessLevels[5]; // World Class
    if (progress >= 80) return fitnessLevels[4]; // Elite
    if (progress >= 60) return fitnessLevels[3]; // Advanced
    if (progress >= 40) return fitnessLevels[2]; // Intermediate
    if (progress >= 20) return fitnessLevels[1]; // Novice
    if (progress > 0) return fitnessLevels[0]; // Beginner
    return { name: 'Untrained', color: '#6b7280', range: '0%' };
  };

  const currentBodyMap = `${selectedGender}-front`;

  // Helper function to get muscle group at position using rectangular hitboxes
  const getMuscleAtPosition = (x: number, y: number, bodyMap: string): string | null => {
    const hitboxes = muscleHitboxes[bodyMap];
    if (!hitboxes) return null;
    
    // Check each hitbox area
    for (const [muscle, hitbox] of Object.entries(hitboxes)) {
      if (x >= hitbox.x && x <= hitbox.x + hitbox.width &&
          y >= hitbox.y && y <= hitbox.y + hitbox.height) {
        return muscle;
      }
    }
    return null;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 300;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    
    // Get the muscle group at this position using hitboxes
    const muscleGroup = getMuscleAtPosition(x, y, currentBodyMap);
    if (muscleGroup) {
      setClickPosition({ x, y });
      setSelectedMuscle(muscleGroup);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Body Map Analysis</h2>
            <Select value={selectedGender} onValueChange={(value: 'male' | 'female') => setSelectedGender(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div 
                className="relative max-w-sm mx-auto cursor-crosshair"
                onClick={handleClick}
              >
                <img
                  src={bodyMaps[currentBodyMap]}
                  alt={`${selectedGender} body front`}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                
                {clickPosition && selectedMuscle && (
                  <div
                    className="absolute w-4 h-4 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg z-10"
                    style={{
                      left: `${(clickPosition.x / 300) * 100}%`,
                      top: `${(clickPosition.y / 400) * 100}%`,
                    }}
                  />
                )}
                
                {clickPosition && selectedMuscle && (
                  <div
                    className="absolute bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium transform -translate-x-1/2 -translate-y-full z-20"
                    style={{
                      left: `${(clickPosition.x / 300) * 100}%`,
                      top: `${(clickPosition.y / 400) * 100}%`,
                      marginTop: '-8px',
                    }}
                  >
                    {getMuscleGroupName(selectedMuscle)}
                  </div>
                )}
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                Click on any muscle group to see detailed information
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Muscle Group Progress</h3>
              <div className="grid grid-cols-1 gap-3">
                {muscleGroups.map((muscle) => {
                  const progress = getMuscleProgress(muscle);
                  const level = getFitnessLevel(progress);
                  
                  return (
                    <div
                      key={muscle}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setSelectedMuscle(muscle)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: level.color }}
                        />
                        <span className="font-medium capitalize">{getMuscleGroupName(muscle)}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{level.name}</div>
                        <div className="text-xs text-muted-foreground">{Math.round(progress)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedMuscle && (
        <MuscleGroupOverlay
          muscleGroup={selectedMuscle}
          onClose={() => {
            setSelectedMuscle(null);
            setClickPosition(null);
          }}
        />
      )}
    </div>
  );
}