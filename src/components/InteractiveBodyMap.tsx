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

const muscleGroups = {
  chest: { name: 'Chest', color: '#ef4444', coordinates: { x: 50, y: 35 } },
  shoulders: { name: 'Shoulders', color: '#f97316', coordinates: { x: 30, y: 25 } },
  biceps: { name: 'Biceps', color: '#eab308', coordinates: { x: 25, y: 40 } },
  triceps: { name: 'Triceps', color: '#84cc16', coordinates: { x: 75, y: 40 } },
  forearms: { name: 'Forearms', color: '#06b6d4', coordinates: { x: 20, y: 55 } },
  abs: { name: 'Abs', color: '#8b5cf6', coordinates: { x: 50, y: 50 } },
  obliques: { name: 'Obliques', color: '#ec4899', coordinates: { x: 40, y: 55 } },
  back: { name: 'Back', color: '#f59e0b', coordinates: { x: 50, y: 30 } },
  lats: { name: 'Lats', color: '#10b981', coordinates: { x: 35, y: 45 } },
  quads: { name: 'Quadriceps', color: '#3b82f6', coordinates: { x: 45, y: 70 } },
  hamstrings: { name: 'Hamstrings', color: '#6366f1', coordinates: { x: 55, y: 75 } },
  glutes: { name: 'Glutes', color: '#8b5cf6', coordinates: { x: 50, y: 65 } },
  calves: { name: 'Calves', color: '#06b6d4', coordinates: { x: 50, y: 85 } },
};

interface MuscleGroupOverlayProps {
  muscleGroup: keyof typeof muscleGroups;
  onClose: () => void;
}

function MuscleGroupOverlay({ muscleGroup, onClose }: MuscleGroupOverlayProps) {
  const { getExerciseHistory } = useWorkoutStore();
  const muscle = muscleGroups[muscleGroup];
  
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
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: muscle.color }}
            />
            {muscle.name}
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
  const [selectedView, setSelectedView] = useState<keyof typeof bodyMaps>('male-front');
  const [selectedMuscle, setSelectedMuscle] = useState<keyof typeof muscleGroups | null>(null);
  const { workoutSessions } = useWorkoutStore();

  const getMuscleIntensity = (muscleGroup: keyof typeof muscleGroups) => {
    // Mock logic to determine muscle group training intensity based on recent workouts
    const recentSessions = workoutSessions.slice(-5);
    const trainingCount = recentSessions.reduce((count, session) => {
      return count + (session.exercises.some(ex => 
        ex.name.toLowerCase().includes(muscleGroup.toLowerCase())
      ) ? 1 : 0);
    }, 0);
    
    if (trainingCount >= 3) return 'high';
    if (trainingCount >= 1) return 'medium';
    return 'low';
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'rgba(34, 197, 94, 0.8)'; // green
      case 'medium': return 'rgba(249, 115, 22, 0.8)'; // orange
      case 'low': return 'rgba(239, 68, 68, 0.8)'; // red
      default: return 'rgba(156, 163, 175, 0.5)'; // gray
    }
  };

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <Card>
        <CardContent className="p-4">
          <Select value={selectedView} onValueChange={(value) => setSelectedView(value as keyof typeof bodyMaps)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select body map view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male-front">Male - Front View</SelectItem>
              <SelectItem value="male-back">Male - Back View</SelectItem>
              <SelectItem value="female-front">Female - Front View</SelectItem>
              <SelectItem value="female-back">Female - Back View</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Interactive Body Map */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full max-w-md mx-auto">
            <img 
              src={bodyMaps[selectedView]}
              alt={`${selectedView} body map`}
              className="w-full h-auto"
            />
            
            {/* Muscle Group Overlays */}
            {Object.entries(muscleGroups).map(([key, muscle]) => {
              const intensity = getMuscleIntensity(key as keyof typeof muscleGroups);
              return (
                <button
                  key={key}
                  className="absolute w-8 h-8 rounded-full border-2 border-white shadow-lg transition-all duration-300 hover:scale-125 hover:z-10"
                  style={{
                    left: `${muscle.coordinates.x}%`,
                    top: `${muscle.coordinates.y}%`,
                    backgroundColor: getIntensityColor(intensity),
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => setSelectedMuscle(key as keyof typeof muscleGroups)}
                >
                  <span className="sr-only">{muscle.name}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Training Intensity Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500/80" />
              <span className="text-sm">High Activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500/80" />
              <span className="text-sm">Moderate Activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500/80" />
              <span className="text-sm">Low Activity</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tap any muscle group to view detailed exercise history and performance trends.
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