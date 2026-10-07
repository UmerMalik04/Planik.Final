import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * Brand splash. It is rendered as an OVERLAY on top of the already-mounted app
 * so route chunks, auth and data all load behind it — by the time it fades out
 * the underlying screen is fully painted, so tapping into the app feels instant.
 */

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 900);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-gradient-to-t from-purple-600 via-pink-500 to-orange-400 transition-opacity duration-300 ${
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
          planik
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
