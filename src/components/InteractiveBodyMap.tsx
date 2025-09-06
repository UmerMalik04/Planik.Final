import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
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

// More precise muscle group areas for highlighting with development level colors - coordinates adjusted for actual body image
const muscleAreas: Record<string, Record<string, { path: string; center: { x: number; y: number } }>> = {
  'male-front': {
    chest: { 
      path: "M 110,85 L 190,85 L 195,135 L 185,155 L 115,155 L 105,135 Z",
      center: { x: 150, y: 120 }
    },
    biceps: { 
      path: "M 70,95 L 105,100 L 100,150 L 65,145 Z",
      center: { x: 85, y: 122 }
    },
    forearms: { 
      path: "M 80,160 L 110,165 L 105,200 L 75,195 Z",
      center: { x: 92, y: 180 }
    },
    triceps: { 
      path: "M 60,105 L 95,110 L 90,155 L 55,150 Z",
      center: { x: 75, y: 132 }
    },
    abs: { 
      path: "M 115,145 L 185,145 L 185,205 L 115,205 Z",
      center: { x: 150, y: 175 }
    },
    quads: { 
      path: "M 115,200 L 155,200 L 160,295 L 110,295 Z",
      center: { x: 135, y: 247 }
    },
    calves: { 
      path: "M 115,295 L 155,295 L 150,355 L 120,355 Z",
      center: { x: 135, y: 325 }
    },
    'right-biceps': { 
      path: "M 195,100 L 235,95 L 240,145 L 200,150 Z",
      center: { x: 215, y: 122 }
    },
    'right-forearms': { 
      path: "M 190,165 L 220,160 L 225,195 L 195,200 Z",
      center: { x: 207, y: 180 }
    },
    'right-triceps': { 
      path: "M 205,110 L 245,105 L 250,150 L 210,155 Z",
      center: { x: 227, y: 132 }
    },
    'right-quads': { 
      path: "M 145,200 L 185,200 L 190,295 L 140,295 Z",
      center: { x: 165, y: 247 }
    },
    'right-calves': { 
      path: "M 145,295 L 185,295 L 180,355 L 150,355 Z",
      center: { x: 165, y: 325 }
    }
  },
  'male-back': {
    back: { 
      path: "M 105,65 L 195,65 L 190,155 L 110,155 Z",
      center: { x: 150, y: 110 }
    },
    lats: { 
      path: "M 85,85 L 125,90 L 130,155 L 90,150 Z",
      center: { x: 107.5, y: 120 }
    },
    triceps: { 
      path: "M 75,95 L 115,100 L 110,150 L 70,145 Z",
      center: { x: 92.5, y: 122.5 }
    },
    forearms: { 
      path: "M 85,160 L 120,165 L 115,200 L 80,195 Z",
      center: { x: 100, y: 177.5 }
    },
    glutes: { 
      path: "M 115,135 L 185,135 L 185,195 L 115,195 Z",
      center: { x: 150, y: 165 }
    },
    hamstrings: { 
      path: "M 115,190 L 155,190 L 160,285 L 110,285 Z",
      center: { x: 137.5, y: 237.5 }
    },
    calves: { 
      path: "M 125,285 L 165,285 L 160,345 L 130,345 Z",
      center: { x: 147, y: 315 }
    },
    'right-lats': { 
      path: "M 175,90 L 215,85 L 210,150 L 170,155 Z",
      center: { x: 192.5, y: 120 }
    },
    'right-triceps': { 
      path: "M 185,100 L 225,95 L 230,145 L 190,150 Z",
      center: { x: 207.5, y: 122.5 }
    },
    'right-forearms': { 
      path: "M 180,165 L 215,160 L 220,195 L 185,200 Z",
      center: { x: 200, y: 177.5 }
    },
    'right-hamstrings': { 
      path: "M 145,190 L 185,190 L 190,285 L 140,285 Z",
      center: { x: 162.5, y: 237.5 }
    },
    'right-calves': { 
      path: "M 135,285 L 175,285 L 170,345 L 140,345 Z",
      center: { x: 152, y: 315 }
    }
  },
  'female-front': {
    chest: { 
      path: "M 120,75 L 180,75 L 185,125 L 175,145 L 125,145 L 115,125 Z",
      center: { x: 150, y: 110 }
    },
    biceps: { 
      path: "M 75,85 L 115,90 L 110,140 L 70,135 Z",
      center: { x: 92.5, y: 112.5 }
    },
    forearms: { 
      path: "M 75,150 L 110,155 L 105,190 L 70,185 Z",
      center: { x: 87.5, y: 167.5 }
    },
    triceps: { 
      path: "M 65,95 L 105,100 L 100,145 L 60,140 Z",
      center: { x: 82.5, y: 122.5 }
    },
    abs: { 
      path: "M 125,135 L 175,135 L 175,195 L 125,195 Z",
      center: { x: 150, y: 165 }
    },
    quads: { 
      path: "M 115,190 L 155,190 L 160,285 L 110,285 Z",
      center: { x: 137.5, y: 237.5 }
    },
    calves: { 
      path: "M 115,285 L 155,285 L 150,345 L 120,345 Z",
      center: { x: 135, y: 315 }
    },
    'right-biceps': { 
      path: "M 185,90 L 225,85 L 230,135 L 190,140 Z",
      center: { x: 207.5, y: 112.5 }
    },
    'right-forearms': { 
      path: "M 190,155 L 225,150 L 230,185 L 195,190 Z",
      center: { x: 212.5, y: 167.5 }
    },
    'right-triceps': { 
      path: "M 195,100 L 235,95 L 240,140 L 200,145 Z",
      center: { x: 217.5, y: 122.5 }
    },
    'right-quads': { 
      path: "M 145,190 L 185,190 L 190,285 L 140,285 Z",
      center: { x: 162.5, y: 237.5 }
    },
    'right-calves': { 
      path: "M 145,285 L 185,285 L 180,345 L 150,345 Z",
      center: { x: 165, y: 315 }
    }
  },
  'female-back': {
    back: { 
      path: "M 105,65 L 195,65 L 190,155 L 110,155 Z",
      center: { x: 150, y: 110 }
    },
    lats: { 
      path: "M 85,85 L 125,90 L 130,155 L 90,150 Z",
      center: { x: 107.5, y: 120 }
    },
    triceps: { 
      path: "M 75,95 L 115,100 L 110,150 L 70,145 Z",
      center: { x: 92.5, y: 122.5 }
    },
    forearms: { 
      path: "M 75,160 L 110,165 L 105,200 L 70,195 Z",
      center: { x: 87.5, y: 177.5 }
    },
    glutes: { 
      path: "M 115,135 L 185,135 L 185,195 L 115,195 Z",
      center: { x: 150, y: 165 }
    },
    hamstrings: { 
      path: "M 115,190 L 155,190 L 160,285 L 110,285 Z",
      center: { x: 137.5, y: 237.5 }
    },
    calves: { 
      path: "M 115,285 L 155,285 L 150,345 L 120,345 Z",
      center: { x: 135, y: 315 }
    },
    'right-lats': { 
      path: "M 175,90 L 215,85 L 210,150 L 170,155 Z",
      center: { x: 192.5, y: 120 }
    },
    'right-triceps': { 
      path: "M 185,100 L 225,95 L 230,145 L 190,150 Z",
      center: { x: 207.5, y: 122.5 }
    },
    'right-forearms': { 
      path: "M 190,165 L 225,160 L 230,195 L 195,200 Z",
      center: { x: 212.5, y: 177.5 }
    },
    'right-hamstrings': { 
      path: "M 145,190 L 185,190 L 190,285 L 140,285 Z",
      center: { x: 162.5, y: 237.5 }
    },
    'right-calves': { 
      path: "M 145,285 L 185,285 L 180,345 L 150,345 Z",
      center: { x: 165, y: 315 }
    }
  }
};

// Muscle groups for tracking
const muscleGroups = ['chest', 'biceps', 'triceps', 'forearms', 'abs', 'back', 'lats', 'quads', 'hamstrings', 'glutes', 'calves'];

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
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{x: number, y: number, muscle: string} | null>(null);
  const { workoutSessions } = useWorkoutStore();

  // Calculate the centroid of a polygon path
  const calculatePolygonCentroid = (pathString: string) => {
    // Parse the path string to get coordinate pairs
    const coords = pathString
      .replace(/[MLZ]/g, '')
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter(n => !isNaN(n));
    
    // Group coordinates into [x, y] pairs
    const points = [];
    for (let i = 0; i < coords.length; i += 2) {
      if (coords[i + 1] !== undefined) {
        points.push([coords[i], coords[i + 1]]);
      }
    }
    
    if (points.length === 0) return { x: 150, y: 200 }; // fallback center
    
    // Calculate centroid
    const centroidX = points.reduce((sum, point) => sum + point[0], 0) / points.length;
    const centroidY = points.reduce((sum, point) => sum + point[1], 0) / points.length;
    
    return { x: centroidX, y: centroidY };
  };

  const detectMuscleFromCoordinates = (x: number, y: number, view: 'front' | 'back', gender: 'male' | 'female') => {
    // Define coordinate ranges for each muscle group based on the body image
    const muscleCoordinates = {
      'male-front': {
        chest: { minX: 110, maxX: 190, minY: 85, maxY: 155 },
        biceps: { minX: 70, maxX: 105, minY: 95, maxY: 165 },
        'right-biceps': { minX: 195, maxX: 235, minY: 95, maxY: 165 },
        forearms: { minX: 80, maxX: 110, minY: 160, maxY: 200 },
        'right-forearms': { minX: 190, maxX: 220, minY: 160, maxY: 200 },
        abs: { minX: 115, maxX: 185, minY: 145, maxY: 205 },
        quads: { minX: 115, maxX: 155, minY: 200, maxY: 295 },
        'right-quads': { minX: 145, maxX: 185, minY: 200, maxY: 295 },
        calves: { minX: 115, maxX: 155, minY: 295, maxY: 355 },
        'right-calves': { minX: 145, maxX: 185, minY: 295, maxY: 355 }
      },
      'male-back': {
        back: { minX: 105, maxX: 195, minY: 65, maxY: 155 },
        lats: { minX: 85, maxX: 125, minY: 85, maxY: 155 },
        'right-lats': { minX: 175, maxX: 215, minY: 85, maxY: 155 },
        triceps: { minX: 75, maxX: 115, minY: 95, maxY: 150 },
        'right-triceps': { minX: 185, maxX: 225, minY: 95, maxY: 150 },
        forearms: { minX: 85, maxX: 120, minY: 160, maxY: 200 },
        'right-forearms': { minX: 180, maxX: 215, minY: 160, maxY: 200 },
        glutes: { minX: 115, maxX: 185, minY: 135, maxY: 195 },
        hamstrings: { minX: 115, maxX: 155, minY: 190, maxY: 285 },
        'right-hamstrings': { minX: 145, maxX: 185, minY: 190, maxY: 285 },
        calves: { minX: 125, maxX: 165, minY: 285, maxY: 345 },
        'right-calves': { minX: 135, maxX: 175, minY: 285, maxY: 345 }
      }
    };

    const coordinates = muscleCoordinates[`${gender}-${view}` as keyof typeof muscleCoordinates];
    
    // Check each muscle group to see if the click falls within its bounds
    for (const [muscle, bounds] of Object.entries(coordinates)) {
      if (x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY) {
        return muscle;
      }
    }
    
    return null;
  };

  const handleBodyClick = (view: 'front' | 'back', event: React.MouseEvent<SVGRectElement>) => {
    // Get the SVG element and its bounding rect
    const svg = event.currentTarget.closest('svg');
    if (svg) {
      const rect = svg.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Get SVG viewBox dimensions
      const viewBox = svg.getAttribute('viewBox')?.split(' ') || ['0', '0', '300', '400'];
      const svgWidth = parseFloat(viewBox[2]);
      const svgHeight = parseFloat(viewBox[3]);
      
      // Convert to SVG coordinates
      const svgX = (x / rect.width) * svgWidth;
      const svgY = (y / rect.height) * svgHeight;
      
      // Detect which muscle was clicked
      const detectedMuscle = detectMuscleFromCoordinates(svgX, svgY, view, selectedGender);
      
      if (detectedMuscle) {
        setMarkerPosition({ x: svgX, y: svgY, muscle: `${detectedMuscle}-${view}` });
        // Remove "right-" prefix from muscle name for display
        const displayMuscle = detectedMuscle.replace('right-', '');
        setSelectedMuscle(displayMuscle);
      }
    }
  };

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
          biceps: ['curl', 'chin', 'bicep'],
          triceps: ['tricep', 'dip', 'extension', 'diamond', 'close-grip'],
          forearms: ['wrist', 'forearm', 'farmer', 'grip'],
          abs: ['crunch', 'plank', 'sit-up', 'ab', 'core', 'mountain'],
          back: ['pull', 'row', 'deadlift', 'lat'],
          lats: ['lat', 'pulldown', 'wide-grip'],
          quads: ['squat', 'lunge', 'leg press', 'quad'],
          hamstrings: ['deadlift', 'curl', 'hamstring', 'romanian'],
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
          <Select value={selectedGender} onValueChange={(value) => {
            setSelectedGender(value as 'male' | 'female');
            setMarkerPosition(null); // Clear marker when changing gender
            setSelectedMuscle(null);
          }}>
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
                className="w-full h-auto rounded-lg grayscale contrast-125 brightness-110"
              />
              
              {/* Muscle Development Level Color Overlays */}
              <svg 
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 300 400"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Single large clickable area for the entire body */}
                <rect
                  x="50"
                  y="50"
                  width="200"
                  height="320"
                  fill="transparent"
                  stroke={selectedGender === 'male' ? "#3b82f6" : "transparent"}
                  strokeWidth={selectedGender === 'male' ? "2" : "0"}
                  strokeOpacity={selectedGender === 'male' ? "0.5" : "0"}
                  className="cursor-pointer hover:fill-primary/5 transition-all duration-200"
                  onClick={(e) => handleBodyClick('front', e)}
                />
                 
                  {/* Interactive Marker for Front View */}
                  {markerPosition && markerPosition.muscle.endsWith('-front') && (
                    <g>
                      <circle
                        cx={markerPosition.x}
                        cy={markerPosition.y}
                        r="6"
                        fill="hsl(var(--primary))"
                        stroke="white"
                        strokeWidth="2"
                        className="drop-shadow-lg"
                      >
                        <animate
                          attributeName="r"
                          values="0;6;8;6"
                          dur="0.8s"
                          begin="0s"
                        />
                        <animate
                          attributeName="fill-opacity"
                          values="0;1;1;1"
                          dur="0.8s"
                          begin="0s"
                        />
                      </circle>
                      {/* Smooth pulse ring */}
                      <circle
                        cx={markerPosition.x}
                        cy={markerPosition.y}
                        r="6"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        opacity="0.6"
                      >
                        <animate
                          attributeName="r"
                          values="6;16;6"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-opacity"
                          values="0.6;0;0.6"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </g>
                  )}
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
                className="w-full h-auto rounded-lg grayscale contrast-125 brightness-110"
              />
              
              {/* Muscle Development Level Color Overlays */}
              <svg 
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 300 400"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Single large clickable area for the entire body */}
                <rect
                  x="50"
                  y="50"
                  width="200"
                  height="320"
                  fill="transparent"
                  stroke={selectedGender === 'male' ? "#3b82f6" : "transparent"}
                  strokeWidth={selectedGender === 'male' ? "2" : "0"}
                  strokeOpacity={selectedGender === 'male' ? "0.5" : "0"}
                  className="cursor-pointer hover:fill-primary/5 transition-all duration-200"
                  onClick={(e) => handleBodyClick('back', e)}
                />
                 
                  {/* Interactive Marker for Back View */}
                  {markerPosition && markerPosition.muscle.endsWith('-back') && (
                    <g>
                      <circle
                        cx={markerPosition.x}
                        cy={markerPosition.y}
                        r="6"
                        fill="hsl(var(--primary))"
                        stroke="white"
                        strokeWidth="2"
                        className="drop-shadow-lg"
                      >
                        <animate
                          attributeName="r"
                          values="0;6;8;6"
                          dur="0.8s"
                          begin="0s"
                        />
                        <animate
                          attributeName="fill-opacity"
                          values="0;1;1;1"
                          dur="0.8s"
                          begin="0s"
                        />
                      </circle>
                      {/* Smooth pulse ring */}
                      <circle
                        cx={markerPosition.x}
                        cy={markerPosition.y}
                        r="6"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        opacity="0.6"
                      >
                        <animate
                          attributeName="r"
                          values="6;16;6"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-opacity"
                          values="0.6;0;0.6"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </g>
                  )}
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

      {/* Muscle Development */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Muscle Development</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {muscleGroups.map((muscle) => {
              const progress = getMuscleProgress(muscle);
              const level = getMuscleLevel(progress);
              const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';
              const trendPercentage = Math.floor(Math.random() * 15) + 1;
              
              return (
                <div 
                  key={muscle}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors border-l-4 border-blue-500"
                  onClick={() => setSelectedMuscle(muscle)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: level.color }}
                    />
                    <div>
                      <span className="text-sm font-medium capitalize block">{muscle}</span>
                      <div className="flex items-center gap-1 mt-1">
                        {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                        {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                        {trend === 'stable' && <Minus className="w-3 h-3 text-yellow-500" />}
                        <span className={`text-xs font-medium ${
                          trend === 'up' ? 'text-green-500' : 
                          trend === 'down' ? 'text-red-500' : 
                          'text-yellow-500'
                        }`}>
                          {trend === 'up' ? `+${trendPercentage}%` : 
                           trend === 'down' ? `-${trendPercentage}%` : 
                           'No change'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium block">{level.name}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                </div>
              );
            })}
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