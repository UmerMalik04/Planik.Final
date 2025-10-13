import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Timer, Plus, SkipForward } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface RestTimerProps {
  isActive: boolean;
  initialSeconds: number;
  exerciseName: string;
  setNumber: number;
  onComplete: () => void;
  onSkip: () => void;
  onAddTime: () => void;
}

export default function RestTimer({
  isActive,
  initialSeconds,
  exerciseName,
  setNumber,
  onComplete,
  onSkip,
  onAddTime
}: RestTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (isActive) {
      setRemainingSeconds(initialSeconds);
    }
  }, [isActive, initialSeconds]);

  useEffect(() => {
    if (!isActive || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Timer completed - trigger haptic feedback
          Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {
            // Fallback for web
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          });
          
          // Play audio beep
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, remainingSeconds, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((initialSeconds - remainingSeconds) / initialSeconds) * 100;

  return (
    <Dialog open={isActive} onOpenChange={onSkip}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Rest Timer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Exercise Info */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">{exerciseName}</p>
            <p className="text-xs text-muted-foreground">Set {setNumber} completed</p>
          </div>

          {/* Timer Display */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Circular Progress Ring */}
              <svg className="absolute w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - progressPercentage / 100)}`}
                  className="text-primary transition-all duration-1000 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Time Text */}
              <div className="text-5xl font-bold">
                {formatTime(remainingSeconds)}
              </div>
            </div>

            {/* Progress Bar (backup visual) */}
            <Progress value={progressPercentage} className="w-full" />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onAddTime}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              +30s
            </Button>
            <Button
              variant="outline"
              onClick={onSkip}
              className="w-full"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
