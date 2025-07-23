import React, { createContext, useContext, useEffect, useState } from 'react';

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
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    const savedColor = localStorage.getItem('app-theme-color');
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedColor) {
      setThemeColorState(savedColor);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Apply theme color
    document.documentElement.style.setProperty('--primary', themeColor);
    document.documentElement.style.setProperty('--accent', themeColor);
    
    // Save to localStorage
    localStorage.setItem('app-theme', theme);
    localStorage.setItem('app-theme-color', themeColor);
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