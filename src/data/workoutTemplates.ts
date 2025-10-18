export interface TemplateExercise {
  name: string;
  sets: number;
  reps: string;
  notes: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  emoji: string;
  color: string;
  goal: string;
  warmup?: string;
  exercises: TemplateExercise[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  frequency: string;
}

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'push-day',
    name: 'Push Day',
    emoji: '🟥',
    color: 'bg-red-500',
    goal: 'Build pressing strength and upper-body volume',
    warmup: '5–10 min light cardio + shoulder mobility',
    difficulty: 'Intermediate',
    frequency: '2x per week',
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '6-8', notes: 'Focus on form, slow eccentric' },
      { name: 'Overhead Shoulder Press (Dumbbell/Barbell)', sets: 3, reps: '8-10', notes: 'Keep core tight' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8-12', notes: 'Slight incline for upper chest' },
      { name: 'Dumbbell Lateral Raise', sets: 3, reps: '12-15', notes: "Don't swing weights" },
      { name: 'Triceps Rope Pushdown', sets: 3, reps: '10-15', notes: 'Squeeze at bottom' },
      { name: 'Triceps Dips or Close-Grip Push-Ups', sets: 3, reps: '10-12', notes: 'Bodyweight burnout' },
    ],
  },
  {
    id: 'pull-day',
    name: 'Pull Day',
    emoji: '🟩',
    color: 'bg-green-500',
    goal: 'Strengthen pulling muscles and improve posture',
    difficulty: 'Intermediate',
    frequency: '2x per week',
    exercises: [
      { name: 'Pull-Ups / Lat Pull-Down', sets: 4, reps: '8-10', notes: 'Use full range' },
      { name: 'Barbell or Dumbbell Row', sets: 4, reps: '8-10', notes: 'Keep back straight' },
      { name: 'Seated Cable Row', sets: 3, reps: '10-12', notes: 'Focus on contraction' },
      { name: 'Face Pulls', sets: 3, reps: '12-15', notes: 'External rotation emphasis' },
      { name: 'Barbell Bicep Curl', sets: 3, reps: '8-10', notes: 'Full range of motion' },
      { name: 'Hammer Curl', sets: 3, reps: '10-12', notes: 'Neutral grip for forearms' },
    ],
  },
  {
    id: 'leg-day',
    name: 'Leg Day',
    emoji: '🟨',
    color: 'bg-yellow-500',
    goal: 'Build strength, symmetry, and stability',
    difficulty: 'Intermediate',
    frequency: '1-2x per week',
    exercises: [
      { name: 'Back Squat', sets: 4, reps: '6-8', notes: 'Core tight, parallel depth' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8-10', notes: 'Stretch hamstrings' },
      { name: 'Leg Press', sets: 3, reps: '10-12', notes: 'Control movement' },
      { name: 'Lunges (each leg)', sets: 3, reps: '10-12', notes: 'Keep knees behind toes' },
      { name: 'Leg Curls', sets: 3, reps: '10-15', notes: 'Squeeze hamstrings' },
      { name: 'Calf Raises (Standing or Seated)', sets: 4, reps: '15-20', notes: 'Slow reps for stretch' },
    ],
  },
  {
    id: 'abs-focus',
    name: 'Abs Focus',
    emoji: '🟦',
    color: 'bg-blue-500',
    goal: 'Core stability and definition (add to any day or alternate)',
    difficulty: 'Beginner',
    frequency: '3-4x per week',
    exercises: [
      { name: 'Hanging Leg Raise', sets: 3, reps: '12-15', notes: 'Control movement' },
      { name: 'Cable Crunch', sets: 3, reps: '15-20', notes: 'Focus on contraction' },
      { name: 'Plank', sets: 3, reps: '45-60 sec', notes: 'Keep hips level' },
      { name: 'Russian Twist (weighted optional)', sets: 3, reps: '20 total', notes: 'Slow and controlled' },
    ],
  },
  {
    id: 'back-biceps',
    name: 'Back & Biceps',
    emoji: '🟪',
    color: 'bg-purple-500',
    goal: 'Pull-strength and arm development',
    difficulty: 'Intermediate',
    frequency: '1-2x per week',
    exercises: [
      { name: 'Deadlift', sets: 3, reps: '5', notes: 'Focus on power' },
      { name: 'Pull-Ups / Chin-Ups', sets: 3, reps: '8-10', notes: 'Weighted if advanced' },
      { name: 'Barbell Row', sets: 3, reps: '8-10', notes: 'Controlled motion' },
      { name: 'Lat Pull-Down', sets: 3, reps: '10-12', notes: 'Squeeze at bottom' },
      { name: 'Incline Dumbbell Curl', sets: 3, reps: '10-12', notes: 'Stretch at bottom' },
      { name: 'Cable Curl or Preacher Curl', sets: 3, reps: '10-15', notes: 'Burnout set' },
    ],
  },
  {
    id: 'chest-triceps',
    name: 'Chest & Triceps',
    emoji: '🟥',
    color: 'bg-red-600',
    goal: 'Maximize pressing volume and triceps hypertrophy',
    difficulty: 'Intermediate',
    frequency: '1-2x per week',
    exercises: [
      { name: 'Flat Barbell Bench Press', sets: 4, reps: '6-8', notes: 'Core tight, steady tempo' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', notes: 'Upper chest focus' },
      { name: 'Cable Fly / Pec Deck', sets: 3, reps: '12-15', notes: 'Controlled stretch' },
      { name: 'Triceps Dips (Weighted optional)', sets: 3, reps: '8-12', notes: 'Elbows tucked' },
      { name: 'Skull Crushers / Overhead Extension', sets: 3, reps: '10-12', notes: "Don't flare elbows" },
      { name: 'Triceps Rope Pushdown', sets: 3, reps: '12-15', notes: 'Burnout finisher' },
    ],
  },
  {
    id: 'shoulders-abs',
    name: 'Shoulders & Abs',
    emoji: '🟧',
    color: 'bg-orange-500',
    goal: 'Round shoulders + core stability',
    difficulty: 'Intermediate',
    frequency: '1-2x per week',
    exercises: [
      { name: 'Seated Overhead Press', sets: 4, reps: '6-8', notes: 'Full range' },
      { name: 'Dumbbell Lateral Raise', sets: 3, reps: '12-15', notes: 'Keep slight bend in arms' },
      { name: 'Arnold Press', sets: 3, reps: '8-10', notes: 'Controlled rotation' },
      { name: 'Rear Delt Fly / Reverse Pec Deck', sets: 3, reps: '12-15', notes: "Don't shrug" },
      { name: 'Plank', sets: 3, reps: '60 sec', notes: 'Keep body straight' },
      { name: 'Hanging Knee Raises', sets: 3, reps: '12-15', notes: 'Focus on abs, not swing' },
    ],
  },
];
