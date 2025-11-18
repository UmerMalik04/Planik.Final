import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Dumbbell, Calendar, TrendingUp, Book } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const tourSteps = [
  {
    title: "Welcome to Planik!",
    description: "Your complete fitness companion. Track workouts, monitor progress, and achieve your goals all in one place.",
    icon: Dumbbell,
  },
  {
    title: "Create Workout Plans",
    description: "Build custom workout routines or choose from our templates. Add exercises, set reps and weights, and organize your training schedule.",
    icon: Calendar,
  },
  {
    title: "Track Your Progress",
    description: "Log your workouts, monitor personal records, and view detailed progress charts. Track diet, water intake, and body measurements.",
    icon: TrendingUp,
  },
  {
    title: "Browse Exercise Library",
    description: "Explore hundreds of exercises with detailed instructions, muscle group filters, and proper form guidance.",
    icon: Book,
  },
];

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = tourSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{step.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-2">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              className="gap-2"
            >
              {currentStep === tourSteps.length - 1 ? "Get Started" : "Next"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skip button in bottom right */}
      <Button
        variant="ghost"
        onClick={handleSkip}
        className="fixed bottom-6 right-6 text-muted-foreground hover:text-foreground"
      >
        Skip Tutorial
      </Button>
    </div>
  );
}
