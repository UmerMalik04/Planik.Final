import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Import the body map images - we'll use CSS filters to change muscle colors
const bodyMaps = {
  'male-front': '/lovable-uploads/0731170e-4d41-4a25-b381-49191ff2c5c5.png',
  'male-back': '/lovable-uploads/4b27650a-3252-4401-83f7-14699ced6400.png',
  'female-front': '/lovable-uploads/c73da54d-0b40-456b-bef3-c852df323dcf.png',
  'female-back': '/lovable-uploads/2ba581e5-8af8-4079-90a5-b3752b8d2395.png',
};

// Muscle group areas for highlighting with development level colors
const muscleAreas: Record<string, Record<string, string>> = {
  'male-front': {
    chest: "M 130,80 L 170,80 L 175,110 L 165,130 L 135,130 L 125,110 Z",
    biceps: "M 80,90 L 100,95 L 95,130 L 75,125 Z M 200,95 L 220,90 L 225,125 L 205,130 Z",
    triceps: "M 70,100 L 90,105 L 85,135 L 65,130 Z M 210,105 L 230,100 L 235,130 L 215,135 Z",
    abs: "M 135,130 L 165,130 L 165,180 L 135,180 Z",
    quads: "M 125,200 L 145,200 L 150,270 L 120,270 Z M 155,200 L 175,200 L 180,270 L 150,270 Z",
    calves: "M 125,290 L 145,290 L 140,330 L 130,330 Z M 155,290 L 175,290 L 170,330 L 160,330 Z"
  },
  'male-back': {
    back: "M 115,70 L 185,70 L 180,140 L 120,140 Z",
    lats: "M 95,90 L 115,95 L 120,140 L 100,135 Z M 185,95 L 205,90 L 200,135 L 180,140 Z",
    triceps: "M 85,100 L 105,105 L 100,135 L 80,130 Z M 195,105 L 215,100 L 220,130 L 200,135 Z",
    glutes: "M 125,140 L 175,140 L 175,180 L 125,180 Z",
    hamstrings: "M 125,200 L 145,200 L 150,270 L 120,270 Z M 155,200 L 175,200 L 180,270 L 150,270 Z",
    calves: "M 125,290 L 145,290 L 140,330 L 130,330 Z M 155,290 L 175,290 L 170,330 L 160,330 Z"
  },
  'female-front': {
    chest: "M 130,80 L 170,80 L 175,110 L 165,130 L 135,130 L 125,110 Z",
    biceps: "M 80,90 L 100,95 L 95,130 L 75,125 Z M 200,95 L 220,90 L 225,125 L 205,130 Z",
    triceps: "M 70,100 L 90,105 L 85,135 L 65,130 Z M 210,105 L 230,100 L 235,130 L 215,135 Z",
    abs: "M 135,130 L 165,130 L 165,180 L 135,180 Z",
    quads: "M 125,200 L 145,200 L 150,270 L 120,270 Z M 155,200 L 175,200 L 180,270 L 150,270 Z",
    calves: "M 125,290 L 145,290 L 140,330 L 130,330 Z M 155,290 L 175,290 L 170,330 L 160,330 Z"
  },
  'female-back': {
    back: "M 115,70 L 185,70 L 180,140 L 120,140 Z",
    lats: "M 95,90 L 115,95 L 120,140 L 100,135 Z M 185,95 L 205,90 L 200,135 L 180,140 Z",
    triceps: "M 85,100 L 105,105 L 100,135 L 80,130 Z M 195,105 L 215,100 L 220,130 L 200,135 Z",
    glutes: "M 125,140 L 175,140 L 175,180 L 125,180 Z",
    hamstrings: "M 125,200 L 145,200 L 150,270 L 120,270 Z M 155,200 L 175,200 L 180,270 L 150,270 Z",
    calves: "M 125,290 L 145,290 L 140,330 L 130,330 Z M 155,290 L 175,290 L 170,330 L 160,330 Z"
  }
};

// Muscle groups for tracking
const muscleGroups = ['chest', 'biceps', 'triceps', 'abs', 'back', 'lats', 'quads', 'hamstrings', 'glutes', 'calves'];

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
  
  // Get muscle-specific exercises based on muscle group
  const getExercisesForMuscle = (muscle: string) => {
    const exerciseMap = {
      chest: ['Push-ups', 'Bench Press', 'Incline Dumbbell Press', 'Chest Flyes'],
      shoulders: ['Shoulder Press', 'Lateral Raises', 'Front Raises', 'Rear Delt Flyes'],
      biceps: ['Bicep Curls', 'Hammer Curls', 'Chin-ups', 'Preacher Curls'],
      triceps: ['Tricep Dips', 'Close-Grip Bench Press', 'Overhead Extension', 'Diamond Push-ups'],
      abs: ['Crunches', 'Planks', 'Russian Twists', 'Mountain Climbers'],
      back: ['Pull-ups', 'Rows', 'Lat Pulldowns', 'Deadlifts'],
      lats: ['Lat Pulldowns', 'Wide Grip Pull-ups', 'T-Bar Rows', 'Cable Rows'],
      quads: ['Squats', 'Leg Press', 'Lunges', 'Leg Extensions'],
      hamstrings: ['Romanian Deadlifts', 'Leg Curls', 'Stiff Leg Deadlifts', 'Good Mornings'],
      glutes: ['Hip Thrusts', 'Bulgarian Split Squats', 'Glute Bridges', 'Clamshells'],
      calves: ['Calf Raises', 'Seated Calf Raises', 'Jump Rope', 'Box Jumps']
    };
    
    return exerciseMap[muscle as keyof typeof exerciseMap] || [];
  };

  const exercises = getExercisesForMuscle(muscleGroup).map(name => ({
    name,
    sets: Math.floor(Math.random() * 3) + 3,
    reps: Math.floor(Math.random() * 8) + 8,
    weight: name.includes('Push-ups') || name.includes('Plank') ? 0 : Math.floor(Math.random() * 100) + 50
  }));

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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {muscleGroup}
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
            <h4 className="text-sm font-medium">Target Exercises:</h4>
            {exercises.map((exercise, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.sets} sets × {exercise.reps} reps
                    {exercise.weight > 0 && ` @ ${exercise.weight}lbs`}
                  </p>
                </div>
              </div>
            ))}
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
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const { workoutSessions } = useWorkoutStore();

  const getMuscleProgress = (muscleGroup: string) => {
    // Mock logic to determine muscle group progress based on recent workouts
    const recentSessions = workoutSessions.slice(-10);
    const trainingCount = recentSessions.reduce((count, session) => {
      return count + (session.exercises.some(ex => 
        ex.name.toLowerCase().includes(muscleGroup.toLowerCase())
      ) ? 1 : 0);
    }, 0);
    
    // Convert training frequency to progress percentage
    const progressPercentage = Math.min((trainingCount / 10) * 100, 100);
    return progressPercentage;
  };

  const getMuscleColor = (progress: number) => {
    if (progress >= 90) return muscleTiers[5].color; // Legend - Gold
    if (progress >= 70) return muscleTiers[4].color; // Champion - Red
    if (progress >= 50) return muscleTiers[3].color; // Pro - Dark Blue
    if (progress >= 30) return muscleTiers[2].color; // Competitor - Orange
    if (progress >= 15) return muscleTiers[1].color; // Amateur - Light Blue
    if (progress > 0) return muscleTiers[0].color; // Rookie - Green
    return 'rgba(107,114,128,0.3)'; // No progress - Gray transparent
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
          <Select value={selectedGender} onValueChange={(value) => setSelectedGender(value as 'male' | 'female')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select body type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
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
                className="w-full h-auto rounded-lg"
              />
              
              {/* Muscle Development Level Color Overlays */}
              <svg 
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 300 400"
                preserveAspectRatio="xMidYMid meet"
              >
                {muscleAreas[`${selectedGender}-front`] && Object.entries(muscleAreas[`${selectedGender}-front`]).map(([muscle, path]) => (
                  <polygon
                    key={muscle}
                    points={path.replace(/[MLZ]/g, '').replace(/\s+/g, ' ').trim()}
                    fill={getMuscleColor(getMuscleProgress(muscle))}
                    fillOpacity="0.6"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                    className="cursor-pointer transition-all duration-300 hover:fill-opacity-80"
                    onClick={() => setSelectedMuscle(muscle)}
                  />
                ))}
              </svg>
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
                className="w-full h-auto rounded-lg"
              />
              
              {/* Muscle Development Level Color Overlays */}
              <svg 
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 300 400"
                preserveAspectRatio="xMidYMid meet"
              >
                {muscleAreas[`${selectedGender}-back`] && Object.entries(muscleAreas[`${selectedGender}-back`]).map(([muscle, path]) => (
                  <polygon
                    key={muscle}
                    points={path.replace(/[MLZ]/g, '').replace(/\s+/g, ' ').trim()}
                    fill={getMuscleColor(getMuscleProgress(muscle))}
                    fillOpacity="0.6"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                    className="cursor-pointer transition-all duration-300 hover:fill-opacity-80"
                    onClick={() => setSelectedMuscle(muscle)}
                  />
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Fitness Level */}
      <Card>
        <CardContent className="p-4 text-center">
          <h3 className="font-medium mb-3">Your Current Level</h3>
          <div 
            className="inline-block px-6 py-2 rounded-full text-white font-medium text-lg"
            style={{ backgroundColor: currentLevel.color }}
          >
            {currentLevel.name}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Progress Range: {currentLevel.range}
          </p>
        </CardContent>
      </Card>

      {/* Muscle Tier Legend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Muscle Development Levels</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {muscleTiers.map((tier) => (
              <div 
                key={tier.name}
                className="px-3 py-1 rounded-full text-white text-xs font-medium transition-all duration-300"
                style={{ backgroundColor: tier.color }}
              >
                {tier.name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fitness Level Progression */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Fitness Level Progression</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {fitnessLevels.map((level, index) => (
              <div 
                key={level.name}
                className={`px-3 py-1 rounded-full text-white text-xs font-medium transition-all duration-300 ${
                  level.name === currentLevel.name ? 'scale-110 ring-2 ring-white ring-offset-2' : 'opacity-70'
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