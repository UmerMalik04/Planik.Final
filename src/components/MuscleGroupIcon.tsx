import Lottie from 'lottie-react';
import dumbbellAnimation from '@/assets/animations/dumbbell.json';
import runningAnimation from '@/assets/animations/running.json';
import workoutAnimation from '@/assets/animations/workout.json';

interface MuscleGroupIconProps {
  group: string;
  className?: string;
}

const muscleGroupAnimations: Record<string, any> = {
  'All': dumbbellAnimation,
  'Legs': workoutAnimation,
  'Back': dumbbellAnimation,
  'Chest': dumbbellAnimation,
  'Shoulders': dumbbellAnimation,
  'Abs': workoutAnimation,
  'Cardio': runningAnimation,
  'Triceps': dumbbellAnimation,
  'Biceps': dumbbellAnimation,
};

export function MuscleGroupIcon({ group, className = '' }: MuscleGroupIconProps) {
  const animation = muscleGroupAnimations[group] || dumbbellAnimation;
  
  return (
    <Lottie
      animationData={animation}
      loop={true}
      autoplay={true}
      className={className}
    />
  );
}