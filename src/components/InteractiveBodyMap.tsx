import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { useSettings } from '@/contexts/SettingsContext';
import { Activity, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';

// Import the body map images - we'll use CSS filters to change muscle colors
const bodyMaps = {
  'male-front': '/lovable-uploads/0731170e-4d41-4a25-b381-49191ff2c5c5.png',
  'male-back': '/lovable-uploads/4b27650a-3252-4401-83f7-14699ced6400.png',
  'female-front': '/lovable-uploads/c73da54d-0b40-456b-bef3-c852df323dcf.png',
  'female-back': '/lovable-uploads/2ba581e5-8af8-4079-90a5-b3752b8d2395.png',
};

// Muscle groups for tracking
const muscleGroups = ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'back', 'lats', 'quads', 'hamstrings', 'glutes', 'calves'];

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
      biceps: [
        { name: 'Bicep Curls', sets: 3, reps: 12, weight: 25 },
        { name: 'Hammer Curls', sets: 3, reps: 10, weight: 25 },
        { name: 'Chin-ups', sets: 3, reps: 8, weight: 0 },
        { name: 'Preacher Curls', sets: 3, reps: 10, weight: 20 }
      ],
      triceps: [
        { name: 'Tricep Dips', sets: 3, reps: 10, weight: 0 },
        { name: 'Close-Grip Bench Press', sets: 3, reps: 8, weight: 115 },
        { name: 'Overhead Extension', sets: 3, reps: 12, weight: 30 },
        { name: 'Diamond Push-ups', sets: 3, reps: 10, weight: 0 }
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
      lats: [
        { name: 'Lat Pulldowns', sets: 3, reps: 10, weight: 80 },
        { name: 'Wide Grip Pull-ups', sets: 3, reps: 6, weight: 0 },
        { name: 'T-Bar Rows', sets: 3, reps: 8, weight: 90 },
        { name: 'Cable Rows', sets: 3, reps: 10, weight: 70 }
      ],
      quads: [
        { name: 'Squats', sets: 4, reps: 8, weight: 155 },
        { name: 'Leg Press', sets: 3, reps: 12, weight: 200 },
        { name: 'Lunges', sets: 3, reps: 12, weight: 30 },
        { name: 'Leg Extensions', sets: 3, reps: 12, weight: 60 }
      ],
      hamstrings: [
        { name: 'Romanian Deadlifts', sets: 3, reps: 10, weight: 115 },
        { name: 'Leg Curls', sets: 3, reps: 12, weight: 50 },
        { name: 'Stiff Leg Deadlifts', sets: 3, reps: 10, weight: 95 },
        { name: 'Good Mornings', sets: 3, reps: 12, weight: 65 }
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
  const [markerPosition, setMarkerPosition] = useState<{x: number, y: number, muscle: string} | null>(null);
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');

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

  // Handle image click to show marker and muscle info
  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to percentage-based coordinates for consistency
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    let clickedMuscle = 'chest'; // Default fallback
    
    // More accurate muscle detection based on anatomical positions
    if (currentView === 'front') {
      // Front view muscle detection
      if (yPercent < 25) {
        // Head/neck area - shoulders
        clickedMuscle = 'shoulders';
      } else if (yPercent < 40) {
        // Upper torso
        if (xPercent < 25) {
          clickedMuscle = 'biceps';
        } else if (xPercent > 75) {
          clickedMuscle = 'right-biceps';
        } else {
          clickedMuscle = 'chest';
        }
      } else if (yPercent < 50) {
        // Mid torso / arms
        if (xPercent < 20) {
          clickedMuscle = 'forearms';
        } else if (xPercent > 80) {
          clickedMuscle = 'right-forearms';
        } else {
          clickedMuscle = 'abs';
        }
      } else if (yPercent < 75) {
        // Upper legs
        if (xPercent < 35) {
          clickedMuscle = 'quads';
        } else if (xPercent > 65) {
          clickedMuscle = 'right-quads';
        } else {
          clickedMuscle = 'quads';
        }
      } else {
        // Lower legs
        if (xPercent < 35) {
          clickedMuscle = 'calves';
        } else if (xPercent > 65) {
          clickedMuscle = 'right-calves';
        } else {
          clickedMuscle = 'calves';
        }
      }
    } else {
      // Back view muscle detection
      if (yPercent < 25) {
        // Head/neck area - shoulders
        clickedMuscle = 'shoulders';
      } else if (yPercent < 40) {
        // Upper back
        if (xPercent < 25) {
          clickedMuscle = 'triceps';
        } else if (xPercent > 75) {
          clickedMuscle = 'right-triceps';
        } else if (xPercent < 35 || xPercent > 65) {
          clickedMuscle = 'lats';
        } else {
          clickedMuscle = 'back';
        }
      } else if (yPercent < 50) {
        // Mid back / arms
        if (xPercent < 20) {
          clickedMuscle = 'forearms';
        } else if (xPercent > 80) {
          clickedMuscle = 'right-forearms';
        } else {
          clickedMuscle = 'glutes';
        }
      } else if (yPercent < 75) {
        // Upper legs
        if (xPercent < 35) {
          clickedMuscle = 'hamstrings';
        } else if (xPercent > 65) {
          clickedMuscle = 'right-hamstrings';
        } else {
          clickedMuscle = 'hamstrings';
        }
      } else {
        // Lower legs
        if (xPercent < 35) {
          clickedMuscle = 'calves';
        } else if (xPercent > 65) {
          clickedMuscle = 'right-calves';
        } else {
          clickedMuscle = 'calves';
        }
      }
    }

    setMarkerPosition({ x, y, muscle: clickedMuscle });
    setSelectedMuscle(clickedMuscle);
  };

  const getCurrentFitnessLevel = () => {
    // Calculate overall fitness level based on all muscle groups
    const totalProgress = muscleGroups.reduce((sum, muscle) => sum + getMuscleProgress(muscle), 0);
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
      {/* Gender Selector */}
      <Card>
        <CardContent className="p-4">
          <Select value={selectedGender} onValueChange={(value) => {
            setSelectedGender(value as 'male' | 'female');
            setMarkerPosition(null); // Clear marker when changing gender
            setSelectedMuscle(null);
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-4">Click on the body image to see muscle progress</p>
        </CardContent>
      </Card>

      {/* Side by Side Body Maps */}
      <div className="grid grid-cols-2 gap-4">
        {/* Front View */}
        <Card className="overflow-hidden">
          <CardContent className="p-2">
            <h3 className="text-center text-sm font-medium mb-2">Front View</h3>
            <div className="relative w-full max-w-xs mx-auto">
              <img 
                src={bodyMaps[`${selectedGender}-front`]}
                alt={`${selectedGender} front view`}
                className="w-full h-auto rounded-lg grayscale contrast-125 brightness-110 cursor-pointer"
                onClick={(e) => {
                  setCurrentView('front');
                  handleImageClick(e);
                }}
              />
              
              {/* Show marker where user clicked on front view */}
              {markerPosition && currentView === 'front' && (
                <div 
                  className="absolute w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                  style={{ 
                    left: `${markerPosition.x}px`, 
                    top: `${markerPosition.y}px` 
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Back View */}
        <Card className="overflow-hidden">
          <CardContent className="p-2">
            <h3 className="text-center text-sm font-medium mb-2">Back View</h3>
            <div className="relative w-full max-w-xs mx-auto">
              <img 
                src={bodyMaps[`${selectedGender}-back`]}
                alt={`${selectedGender} back view`}
                className="w-full h-auto rounded-lg grayscale contrast-125 brightness-110 cursor-pointer"
                onClick={(e) => {
                  setCurrentView('back');
                  handleImageClick(e);
                }}
              />
              
              {/* Show marker where user clicked on back view */}
              {markerPosition && currentView === 'back' && (
                <div 
                  className="absolute w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                  style={{ 
                    left: `${markerPosition.x}px`, 
                    top: `${markerPosition.y}px` 
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Fitness Level */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <span className="font-medium">Overall Fitness Level</span>
            </div>
            <div 
              className="px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: currentLevel.color }}
            >
              {currentLevel.name}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Based on your training consistency across all muscle groups
          </p>
        </CardContent>
      </Card>

      {/* Muscle Group Overlay */}
      {selectedMuscle && (
        <MuscleGroupOverlay 
          muscleGroup={selectedMuscle} 
          onClose={() => {
            setSelectedMuscle(null);
            setMarkerPosition(null);
          }} 
        />
      )}
    </div>
  );
}