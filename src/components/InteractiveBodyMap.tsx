import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { Activity, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';

// Muscle groups for tracking with proper names
const muscleGroups = [
  { key: 'calves', name: 'Calves' },
  { key: 'glutes', name: 'Glutes' },
  { key: 'back', name: 'Back' },
  { key: 'forearms', name: 'Forearms' },
  { key: 'chest', name: 'Chest' },
  { key: 'shoulders', name: 'Shoulders' },
  { key: 'arms', name: 'Arms' }, // Combined biceps/triceps
  { key: 'abs', name: 'Abs/Core' },
  { key: 'quads', name: 'Quadriceps' }
];

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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Get muscle-specific exercises based on muscle group
  const getExercisesForMuscle = (muscle: string) => {
    const exerciseMap = {
      chest: [
        { name: 'Push-ups', sets: 3, reps: 12, weight: 0 },
        { name: 'Bench Press', sets: 4, reps: 8, weight: 135 },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 60 },
        { name: 'Chest Flyes', sets: 3, reps: 12, weight: 25 }
      ],
      shoulders: [
        { name: 'Shoulder Press', sets: 3, reps: 10, weight: 40 },
        { name: 'Lateral Raises', sets: 3, reps: 12, weight: 15 },
        { name: 'Front Raises', sets: 3, reps: 12, weight: 15 },
        { name: 'Rear Delt Flyes', sets: 3, reps: 12, weight: 12 }
      ],
      arms: [
        { name: 'Bicep Curls', sets: 3, reps: 12, weight: 25 },
        { name: 'Tricep Dips', sets: 3, reps: 10, weight: 0 },
        { name: 'Hammer Curls', sets: 3, reps: 10, weight: 25 },
        { name: 'Close-Grip Bench Press', sets: 3, reps: 8, weight: 115 }
      ],
      forearms: [
        { name: 'Wrist Curls', sets: 3, reps: 15, weight: 15 },
        { name: 'Reverse Wrist Curls', sets: 3, reps: 15, weight: 10 },
        { name: 'Farmer\'s Walk', sets: 3, reps: 30, weight: 40 },
        { name: 'Hammer Curls', sets: 3, reps: 12, weight: 25 }
      ],
      abs: [
        { name: 'Crunches', sets: 3, reps: 20, weight: 0 },
        { name: 'Planks', sets: 3, reps: 60, weight: 0 },
        { name: 'Russian Twists', sets: 3, reps: 20, weight: 10 },
        { name: 'Mountain Climbers', sets: 3, reps: 30, weight: 0 }
      ],
      back: [
        { name: 'Pull-ups', sets: 3, reps: 8, weight: 0 },
        { name: 'Barbell Rows', sets: 4, reps: 8, weight: 95 },
        { name: 'Lat Pulldowns', sets: 3, reps: 10, weight: 80 },
        { name: 'Deadlifts', sets: 4, reps: 6, weight: 185 }
      ],
      quads: [
        { name: 'Squats', sets: 4, reps: 8, weight: 155 },
        { name: 'Leg Press', sets: 3, reps: 12, weight: 200 },
        { name: 'Lunges', sets: 3, reps: 12, weight: 30 },
        { name: 'Leg Extensions', sets: 3, reps: 12, weight: 60 }
      ],
      glutes: [
        { name: 'Hip Thrusts', sets: 3, reps: 12, weight: 135 },
        { name: 'Bulgarian Split Squats', sets: 3, reps: 10, weight: 25 },
        { name: 'Glute Bridges', sets: 3, reps: 15, weight: 45 },
        { name: 'Clamshells', sets: 3, reps: 15, weight: 0 }
      ],
      calves: [
        { name: 'Calf Raises', sets: 4, reps: 15, weight: 45 },
        { name: 'Seated Calf Raises', sets: 3, reps: 15, weight: 35 },
        { name: 'Jump Rope', sets: 3, reps: 60, weight: 0 },
        { name: 'Box Jumps', sets: 3, reps: 10, weight: 0 }
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

  // Image cropping coordinates for each muscle group from the reference image
  const getImageStyle = (muscleKey: string) => {
    // Special case for calves - use dedicated image
    if (muscleKey === 'calves') {
      return {
        backgroundImage: `url(/assets/calves.png)`,
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        width: '100%',
        height: '200px',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    // Special case for glutes - use dedicated image
    if (muscleKey === 'glutes') {
      return {
        backgroundImage: `url(/assets/glutes.png)`,
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        width: '100%',
        height: '200px',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    // Special case for back - use dedicated image
    if (muscleKey === 'back') {
      return {
        backgroundImage: `url(/assets/back.png)`,
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        width: '100%',
        height: '200px',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    // Special case for chest - use dedicated image
    if (muscleKey === 'chest') {
      return {
        backgroundImage: `url(/assets/chest-2.png)`,
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        width: '100%',
        height: '200px',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    // Special case for forearms - use dedicated image
    if (muscleKey === 'forearms') {
      return {
        backgroundImage: `url(/assets/forearms.png)`,
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        width: '100%',
        height: '200px',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    // Special case for shoulders - use dedicated image
    if (muscleKey === 'shoulders') {
      return {
        backgroundImage: `url(/assets/shoulders.png)`,
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        width: '100%',
        height: '200px',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    // Special case for arms (biceps/triceps) - use dedicated image
    if (muscleKey === 'arms') {
      return {
        backgroundImage: `url(/assets/biceps.png)`,
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        width: '100%',
        height: '200px',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    // Special case for abs - use dedicated image
    if (muscleKey === 'abs') {
      return {
        backgroundImage: `url(/assets/abs.png)`,
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        width: '100%',
        height: '200px',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    const crops = {
      quads: { x: 90, y: 50, width: 10, height: 50 }, // Bottom right
    };

    const crop = crops[muscleKey as keyof typeof crops] || { x: 0, y: 0, width: 10, height: 50 };
    
    return {
      backgroundImage: `url(/lovable-uploads/bb665430-4ad6-4640-b01c-96cdd7a186be.png)`,
      backgroundPosition: `-${crop.x}% -${crop.y}%`,
      backgroundSize: '1000% 200%',
      width: '100%',
      height: '200px',
      backgroundRepeat: 'no-repeat'
    };
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 capitalize">
            {muscleGroup.replace('right-', '')}
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-yellow-500" />}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Muscle Image */}
          <div 
            className="w-full h-48 bg-muted rounded-lg"
            style={getImageStyle(muscleGroup)}
          />
          
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
                          {exercise.weight > 0 && ` @ ${exercise.weight}lbs`}
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
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  
  const getMuscleProgress = (muscleGroup: string) => {
    // Get actual workout data from recent sessions
    const recentSessions = workoutSessions.slice(-30); // Last 30 sessions
    let totalSets = 0;
    let totalWorkouts = 0;
    
    recentSessions.forEach(session => {
      const muscleExercises = session.exercises.filter(ex => {
        const exerciseName = ex.name.toLowerCase();
        const muscle = muscleGroup.toLowerCase();
        
        // Map exercises to muscle groups more accurately
        const muscleMap = {
          chest: ['bench', 'press', 'fly', 'push', 'chest'],
          arms: ['curl', 'chin', 'bicep', 'tricep', 'dip', 'extension'],
          forearms: ['wrist', 'forearm', 'farmer', 'grip'],
          abs: ['crunch', 'plank', 'sit-up', 'ab', 'core', 'mountain'],
          back: ['pull', 'row', 'deadlift', 'lat'],
          quads: ['squat', 'lunge', 'leg press', 'quad'],
          glutes: ['hip thrust', 'glute', 'bridge', 'bulgarian'],
          calves: ['calf', 'raise', 'jump']
        };
        
        const keywords = muscleMap[muscle as keyof typeof muscleMap] || [muscle];
        return keywords.some(keyword => exerciseName.includes(keyword));
      });
      
      if (muscleExercises.length > 0) {
        totalWorkouts++;
        totalSets += muscleExercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
      }
    });
    
    // Calculate progress based on workout frequency and volume
    const frequency = Math.min((totalWorkouts / 30) * 100, 100); // Frequency score
    const volume = Math.min((totalSets / 100) * 100, 100); // Volume score
    
    return Math.round((frequency + volume) / 2);
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

  const getCurrentFitnessLevel = () => {
    // Calculate overall fitness level based on all muscle groups
    const totalProgress = muscleGroups.reduce((sum, muscle) => sum + getMuscleProgress(muscle.key), 0);
    const averageProgress = totalProgress / muscleGroups.length;
    
    if (averageProgress >= 95) return fitnessLevels[5]; // World Class
    if (averageProgress >= 80) return fitnessLevels[4]; // Elite
    if (averageProgress >= 60) return fitnessLevels[3]; // Advanced
    if (averageProgress >= 40) return fitnessLevels[2]; // Intermediate
    if (averageProgress >= 20) return fitnessLevels[1]; // Novice
    return fitnessLevels[0]; // Beginner
  };

  const currentLevel = getCurrentFitnessLevel();

  return (
    <div className="space-y-6">
      {/* Muscle Development Summary */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Muscle Development</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {muscleGroups.map((muscle) => {
              const progress = getMuscleProgress(muscle.key);
              const level = getMuscleLevel(progress);
              const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';
              const trendPercentage = Math.floor(Math.random() * 15) + 1;
              
              return (
                <div 
                  key={muscle.key}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors border-l-4 border-blue-500"
                  onClick={() => setSelectedMuscle(muscle.key)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: level.color }}
                    />
                    <div>
                      <span className="text-sm font-medium">{muscle.name}</span>
                      <div className="flex items-center gap-1 mt-1">
                        {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                        {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                        {trend === 'stable' && <Minus className="w-3 h-3 text-yellow-500" />}
                        <span className="text-xs text-muted-foreground">
                          {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{trendPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-foreground">{progress}%</div>
                    <div className="text-xs text-muted-foreground">{level.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overall Fitness Level */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Overall Fitness Level</h3>
          <div className="flex flex-wrap gap-2">
            {fitnessLevels.map((level, index) => (
              <div 
                key={level.name}
                className={`px-3 py-2 rounded-full text-white text-sm font-medium border-2 ${
                  currentLevel.name === level.name ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'
                }`}
                style={{ backgroundColor: level.color }}
              >
                {level.name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Muscle Group Details Overlay */}
      {selectedMuscle && (
        <MuscleGroupOverlay 
          muscleGroup={selectedMuscle}
          onClose={() => setSelectedMuscle(null)}
        />
      )}
    </div>
  );
}