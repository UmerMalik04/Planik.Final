import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Import the body map images
const bodyMaps = {
  'male-front': '/lovable-uploads/0731170e-4d41-4a25-b381-49191ff2c5c5.png',
  'male-back': '/lovable-uploads/4b27650a-3252-4401-83f7-14699ced6400.png',
  'female-front': '/lovable-uploads/c73da54d-0b40-456b-bef3-c852df323dcf.png',
  'female-back': '/lovable-uploads/2ba581e5-8af8-4079-90a5-b3752b8d2395.png',
};

const muscleOverlays: Record<string, Record<string, string>> = {
  'male-front': {
    chest: "M 45,30 Q 50,25 55,30 Q 55,40 50,45 Q 45,40 45,30 Z",
    shoulders: "M 35,25 Q 40,20 45,25 Q 45,35 40,40 Q 35,35 35,25 Z M 55,25 Q 60,20 65,25 Q 65,35 60,40 Q 55,35 55,25 Z",
    biceps: "M 30,35 Q 35,30 40,35 Q 40,50 35,55 Q 30,50 30,35 Z M 60,35 Q 65,30 70,35 Q 70,50 65,55 Q 60,50 60,35 Z",
    abs: "M 45,45 Q 50,40 55,45 Q 55,65 50,70 Q 45,65 45,45 Z",
    quads: "M 42,70 Q 47,65 52,70 Q 52,85 47,90 Q 42,85 42,70 Z M 48,70 Q 53,65 58,70 Q 58,85 53,90 Q 48,85 48,70 Z",
    calves: "M 44,88 Q 49,83 54,88 Q 54,95 49,98 Q 44,95 44,88 Z M 46,88 Q 51,83 56,88 Q 56,95 51,98 Q 46,95 46,88 Z"
  },
  'male-back': {
    back: "M 40,25 Q 50,20 60,25 Q 60,50 50,55 Q 40,50 40,25 Z",
    lats: "M 35,35 Q 45,30 50,35 Q 50,55 45,60 Q 35,55 35,35 Z M 50,35 Q 55,30 65,35 Q 65,55 55,60 Q 50,55 50,35 Z",
    glutes: "M 42,55 Q 50,50 58,55 Q 58,70 50,75 Q 42,70 42,55 Z",
    hamstrings: "M 42,75 Q 47,70 52,75 Q 52,88 47,93 Q 42,88 42,75 Z M 48,75 Q 53,70 58,75 Q 58,88 53,93 Q 48,88 48,75 Z",
    calves: "M 44,90 Q 49,85 54,90 Q 54,97 49,100 Q 44,97 44,90 Z M 46,90 Q 51,85 56,90 Q 56,97 51,100 Q 46,97 46,90 Z"
  },
  'female-front': {
    chest: "M 45,30 Q 50,25 55,30 Q 55,40 50,45 Q 45,40 45,30 Z",
    shoulders: "M 35,25 Q 40,20 45,25 Q 45,35 40,40 Q 35,35 35,25 Z M 55,25 Q 60,20 65,25 Q 65,35 60,40 Q 55,35 55,25 Z",
    biceps: "M 30,35 Q 35,30 40,35 Q 40,50 35,55 Q 30,50 30,35 Z M 60,35 Q 65,30 70,35 Q 70,50 65,55 Q 60,50 60,35 Z",
    abs: "M 45,45 Q 50,40 55,45 Q 55,65 50,70 Q 45,65 45,45 Z",
    quads: "M 42,70 Q 47,65 52,70 Q 52,85 47,90 Q 42,85 42,70 Z M 48,70 Q 53,65 58,70 Q 58,85 53,90 Q 48,85 48,70 Z",
    calves: "M 44,88 Q 49,83 54,88 Q 54,95 49,98 Q 44,95 44,88 Z M 46,88 Q 51,83 56,88 Q 56,95 51,98 Q 46,95 46,88 Z"
  },
  'female-back': {
    back: "M 40,25 Q 50,20 60,25 Q 60,50 50,55 Q 40,50 40,25 Z",
    lats: "M 35,35 Q 45,30 50,35 Q 50,55 45,60 Q 35,55 35,35 Z M 50,35 Q 55,30 65,35 Q 65,55 55,60 Q 50,55 50,35 Z",
    glutes: "M 42,55 Q 50,50 58,55 Q 58,70 50,75 Q 42,70 42,55 Z",
    hamstrings: "M 42,75 Q 47,70 52,75 Q 52,88 47,93 Q 42,88 42,75 Z M 48,75 Q 53,70 58,75 Q 58,88 53,93 Q 48,88 48,75 Z",
    calves: "M 44,90 Q 49,85 54,90 Q 54,97 49,100 Q 44,97 44,90 Z M 46,90 Q 51,85 56,90 Q 56,97 51,100 Q 46,97 46,90 Z"
  }
};

const fitnessLevels = [
  { name: 'Beginner', color: '#ef4444', range: '0-20%' },
  { name: 'Novice', color: '#f97316', range: '20-40%' },
  { name: 'Intermediate', color: '#eab308', range: '40-60%' },
  { name: 'Advanced', color: '#3b82f6', range: '60-80%' },
  { name: 'Elite', color: '#8b5cf6', range: '80-95%' },
  { name: 'World Class', color: '#ec4899', range: '95-100%' }
];

interface MuscleGroupOverlayProps {
  muscleGroup: string;
  onClose: () => void;
}

function MuscleGroupOverlay({ muscleGroup, onClose }: MuscleGroupOverlayProps) {
  const { getExerciseHistory } = useWorkoutStore();
  
  // Mock exercise data for the muscle group
  const exercises = [
    { name: 'Push-ups', sets: 3, reps: 15, weight: 0 },
    { name: 'Bench Press', sets: 4, reps: 8, weight: 185 },
    { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 65 },
  ];

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
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#ec4899'; // Elite - Pink
    if (progress >= 60) return '#8b5cf6'; // Advanced - Purple  
    if (progress >= 40) return '#3b82f6'; // Intermediate - Blue
    if (progress >= 20) return '#eab308'; // Novice - Yellow
    if (progress > 0) return '#f97316'; // Beginner - Orange
    return '#6b7280'; // No progress - Gray
  };

  const getCurrentFitnessLevel = () => {
    // Calculate overall fitness level based on all muscle groups
    const allMuscles = ['chest', 'shoulders', 'biceps', 'abs', 'back', 'lats', 'quads', 'hamstrings', 'glutes', 'calves'];
    const totalProgress = allMuscles.reduce((sum, muscle) => sum + getMuscleProgress(muscle), 0);
    const averageProgress = totalProgress / allMuscles.length;
    
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
                className="w-full h-auto"
              />
              
              {/* SVG Muscle Overlays */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {muscleOverlays[`${selectedGender}-front`] && Object.entries(muscleOverlays[`${selectedGender}-front`]).map(([muscle, path]) => (
                  <path
                    key={muscle}
                    d={path}
                    fill={getProgressColor(getMuscleProgress(muscle))}
                    fillOpacity="0.6"
                    stroke="white"
                    strokeWidth="0.5"
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
                className="w-full h-auto"
              />
              
              {/* SVG Muscle Overlays */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {muscleOverlays[`${selectedGender}-back`] && Object.entries(muscleOverlays[`${selectedGender}-back`]).map(([muscle, path]) => (
                  <path
                    key={muscle}
                    d={path}
                    fill={getProgressColor(getMuscleProgress(muscle))}
                    fillOpacity="0.6"
                    stroke="white"
                    strokeWidth="0.5"
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
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Keep working out to progress through the levels! Colors on your body show muscle group development.
          </p>
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