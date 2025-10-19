import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary via-purple-600 to-blue-600 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
        <img
          src="/pwa-512x512.png"
          alt="FlexFlow Logo"
          className="w-32 h-32 rounded-3xl shadow-2xl animate-pulse"
        />
        <h1 className="text-5xl font-bold text-white tracking-tight">
          FlexFlow
        </h1>
        <p className="text-white/80 text-lg">Your Fitness Journey Starts Here</p>
      </div>
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:0ms]"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:150ms]"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:300ms]"></div>
        </div>
      </div>
    </div>
  );
};
