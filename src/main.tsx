import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { SplashScreen } from "./components/SplashScreen";
import OnboardingTour from "./components/OnboardingTour";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';
import { supabase } from "./integrations/supabase/client";

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

const MainApp = () => {
  // Only show splash once per session
  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem('splashShown') !== 'true';
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && !showSplash && !isCheckingOnboarding) {
        setIsCheckingOnboarding(true);
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('has_completed_onboarding')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!preferences?.has_completed_onboarding) {
          setShowOnboarding(true);
        }
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [showSplash, isCheckingOnboarding]);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  const handleOnboardingComplete = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Check if user_preferences row exists
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (existing) {
        // Update existing row
        await supabase
          .from('user_preferences')
          .update({ has_completed_onboarding: true })
          .eq('user_id', session.user.id);
      } else {
        // Insert new row
        await supabase
          .from('user_preferences')
          .insert({ 
            user_id: session.user.id, 
            has_completed_onboarding: true 
          });
      }
    }
    
    setShowOnboarding(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <SettingsProvider>
          {showOnboarding && (
            <OnboardingTour onComplete={handleOnboardingComplete} />
          )}
          <App />
        </SettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <StrictMode>
    <MainApp />
  </StrictMode>
);
