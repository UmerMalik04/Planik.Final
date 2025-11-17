import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExerciseStepsCarouselProps {
  stepImages: string[];
  exerciseName: string;
}

export function ExerciseStepsCarousel({ stepImages, exerciseName }: ExerciseStepsCarouselProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!stepImages || stepImages.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentStep((prev) => (prev === 0 ? stepImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentStep((prev) => (prev === stepImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full">
      {/* Main Image */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-lg bg-muted">
        <img
          src={stepImages[currentStep]}
          alt={`${exerciseName} - Step ${currentStep + 1}`}
          className="h-full w-full object-contain animate-fade-in"
        />
        
        {/* Step Indicator Badge */}
        <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
          Step {currentStep + 1} of {stepImages.length}
        </div>
      </div>

      {/* Navigation Buttons */}
      {stepImages.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm rounded-full shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm rounded-full shadow-lg"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Step Dots */}
      {stepImages.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {stepImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
