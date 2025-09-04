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
      path: "M 70,160 L 100,165 L 95,200 L 65,195 Z",
      center: { x: 82, y: 180 }
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
      path: "M 105,200 L 145,200 L 150,295 L 100,295 Z",
      center: { x: 125, y: 247 }
    },
    calves: { 
      path: "M 105,295 L 145,295 L 140,355 L 110,355 Z",
      center: { x: 125, y: 325 }
    },
    'right-biceps': { 
      path: "M 195,100 L 235,95 L 240,145 L 200,150 Z",
      center: { x: 215, y: 122 }
    },
    'right-forearms': { 
      path: "M 200,165 L 235,160 L 240,195 L 205,200 Z",
      center: { x: 220, y: 180 }
    },
    'right-triceps': { 
      path: "M 205,110 L 245,105 L 250,150 L 210,155 Z",
      center: { x: 227, y: 132 }
    },
    'right-quads': { 
      path: "M 155,200 L 195,200 L 200,295 L 150,295 Z",
      center: { x: 175, y: 247 }
    },
    'right-calves': { 
      path: "M 155,295 L 195,295 L 190,355 L 160,355 Z",
      center: { x: 175, y: 325 }
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
  
  // Get muscle-specific exercises based on muscle group
  const getExercisesForMuscle = (muscle: string) => {
    const exerciseMap = {
      chest: ['Push-ups', 'Bench Press', 'Incline Dumbbell Press', 'Chest Flyes'],
      shoulders: ['Shoulder Press', 'Lateral Raises', 'Front Raises', 'Rear Delt Flyes'],
      biceps: ['Bicep Curls', 'Hammer Curls', 'Chin-ups', 'Preacher Curls'],
      triceps: ['Tricep Dips', 'Close-Grip Bench Press', 'Overhead Extension', 'Diamond Push-ups'],
      forearms: ['Wrist Curls', 'Reverse Wrist Curls', 'Farmer\'s Walk', 'Hammer Curls'],
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

  const handleMuscleClick = (muscle: string, view: 'front' | 'back', event: React.MouseEvent<SVGPathElement>) => {
    const muscleData = muscleAreas[`${selectedGender}-${view}`]?.[muscle];
    if (muscleData) {
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
        
        setMarkerPosition({ x: svgX, y: svgY, muscle: `${muscle}-${view}` });
        // Remove "right-" prefix from muscle name for display
        const displayMuscle = muscle.replace('right-', '');
        setSelectedMuscle(displayMuscle);
      }
    }
  };

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
                {muscleAreas[`${selectedGender}-front`] && Object.entries(muscleAreas[`${selectedGender}-front`]).map(([muscle, muscleData]) => (
                   <polygon
                     key={muscle}
                     points={muscleData.path.replace(/[MLZ]/g, '').replace(/\s+/g, ' ').trim()}
                     fill="transparent"
                     stroke={selectedGender === 'male' ? "#3b82f6" : "transparent"}
                     strokeWidth={selectedGender === 'male' ? "1" : "0"}
                     strokeOpacity={selectedGender === 'male' ? "0.7" : "0"}
                     className="cursor-pointer hover:fill-primary/5 transition-all duration-200"
                     onClick={(e) => handleMuscleClick(muscle, 'front', e)}
                   />
                 ))}
                 
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
                {muscleAreas[`${selectedGender}-back`] && Object.entries(muscleAreas[`${selectedGender}-back`]).map(([muscle, muscleData]) => (
                   <polygon
                     key={muscle}
                     points={muscleData.path.replace(/[MLZ]/g, '').replace(/\s+/g, ' ').trim()}
                     fill="transparent"
                     stroke={selectedGender === 'male' ? "#3b82f6" : "transparent"}
                     strokeWidth={selectedGender === 'male' ? "1" : "0"}
                     strokeOpacity={selectedGender === 'male' ? "0.7" : "0"}
                     className="cursor-pointer hover:fill-primary/5 transition-all duration-200"
                     onClick={(e) => handleMuscleClick(muscle, 'back', e)}
                   />
                 ))}
                 
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