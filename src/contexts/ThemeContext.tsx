import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark';

interface ThemeColors {
  name: string;
  value: string;
}

interface ThemeContextType {
  theme: Theme;
  themeColor: string;
  toggleTheme: () => void;
  setThemeColor: (color: string) => void;
  availableColors: ThemeColors[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const availableColors: ThemeColors[] = [
  { name: 'Blue', value: '211 100% 50%' },
  { name: 'Green', value: '142 76% 36%' },
  { name: 'Purple', value: '262 83% 58%' },
  { name: 'Red', value: '0 84% 60%' },
  { name: 'Orange', value: '25 95% 53%' },
  { name: 'Pink', value: '330 81% 60%' },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [themeColor, setThemeColorState] = useState('211 100% 50%');

  useEffect(() => {
    const loadTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_settings')
        .select('theme, theme_color')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        if (data.theme) setTheme(data.theme as Theme);
        if (data.theme_color) setThemeColorState(data.theme_color);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Apply theme color
    document.documentElement.style.setProperty('--primary', themeColor);
    document.documentElement.style.setProperty('--accent', themeColor);
    
    // Save to Supabase
    const saveTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          theme,
          theme_color: themeColor
        }, { onConflict: 'user_id' });
    };

    saveTheme();
  }, [theme, themeColor]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setThemeColor = (color: string) => {
    setThemeColorState(color);
  };

  const value: ThemeContextType = {
    theme,
    themeColor,
    toggleTheme,
    setThemeColor,
    availableColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}