import React, { createContext, useContext, useEffect, useState } from 'react';

type Units = 'kg' | 'lbs';
type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'ko' | 'zh' | 'ar' | 'hi';

interface AppSettings {
  language: Language;
  units: Units;
  notifications: boolean;
  dateFormat: DateFormat;
  biometricLogin: boolean;
  autoSync: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: any) => void;
  formatWeight: (weight: number) => string;
  formatDate: (date: Date | string) => string;
  formatDateWithOptions: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  getText: (key: string) => string;
}

const defaultSettings: AppSettings = {
  language: 'en',
  units: 'kg',
  notifications: true,
  dateFormat: 'MM/DD/YYYY',
  biometricLogin: false,
  autoSync: true,
};

// Basic translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    'welcome_message': 'Welcome to Planik!',
    'gym_companion': 'Your gym companion',
    'diet_tracker': 'Diet Tracker',
    'track_nutrition': 'Track nutrition & calories',
    'progress': 'Progress',
    'workouts': 'Workouts',
    'exercises': 'Exercises',
    'profile': 'Profile',
    'settings': 'Settings',
    'daily_steps': 'Daily Steps',
    'goal_progress': 'Goal Progress',
    'workout_plan': 'Workout Plan',
    'add_exercise': 'Add Exercise',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'back_to_home': 'Back to Home',
    'member_since': 'Member Since',
    'achievements': 'Achievements',
    'completed': 'Completed',
    'calories': 'calories',
    'protein': 'Protein',
    'carbs': 'Carbs',
    'fat': 'Fat',
  },
  es: {
    'welcome_message': '¡Bienvenido a Planik!',
    'gym_companion': 'Tu compañero de gimnasio',
    'diet_tracker': 'Rastreador de Dieta',
    'track_nutrition': 'Rastrea nutrición y calorías',
    'progress': 'Progreso',
    'workouts': 'Entrenamientos',
    'exercises': 'Ejercicios',
    'profile': 'Perfil',
    'settings': 'Configuración',
    'daily_steps': 'Pasos Diarios',
    'goal_progress': 'Progreso del Objetivo',
    'workout_plan': 'Plan de Entrenamiento',
    'add_exercise': 'Agregar Ejercicio',
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'delete': 'Eliminar',
    'edit': 'Editar',
    'back_to_home': 'Volver al Inicio',
    'member_since': 'Miembro Desde',
    'achievements': 'Logros',
    'completed': 'Completado',
    'calories': 'calorías',
    'protein': 'Proteína',
    'carbs': 'Carbohidratos',
    'fat': 'Grasa',
  },
  fr: {
    'welcome_message': 'Bienvenue sur Planik!',
    'gym_companion': 'Votre compagnon de gym',
    'diet_tracker': 'Suivi de Régime',
    'track_nutrition': 'Suivez la nutrition et les calories',
    'progress': 'Progrès',
    'workouts': 'Entraînements',
    'exercises': 'Exercices',
    'profile': 'Profil',
    'settings': 'Paramètres',
    'daily_steps': 'Pas Quotidiens',
    'goal_progress': 'Progrès de l\'Objectif',
    'workout_plan': 'Plan d\'Entraînement',
    'add_exercise': 'Ajouter un Exercice',
    'save': 'Sauvegarder',
    'cancel': 'Annuler',
    'delete': 'Supprimer',
    'edit': 'Modifier',
    'back_to_home': 'Retour à l\'Accueil',
    'member_since': 'Membre Depuis',
    'achievements': 'Réalisations',
    'completed': 'Terminé',
    'calories': 'calories',
    'protein': 'Protéine',
    'carbs': 'Glucides',
    'fat': 'Graisse',
  },
  de: {
    'welcome_message': 'Willkommen bei Planik!',
    'gym_companion': 'Ihr Fitnessstudio-Begleiter',
    'diet_tracker': 'Diät-Tracker',
    'track_nutrition': 'Verfolgen Sie Ernährung und Kalorien',
    'progress': 'Fortschritt',
    'workouts': 'Workouts',
    'exercises': 'Übungen',
    'profile': 'Profil',
    'settings': 'Einstellungen',
    'daily_steps': 'Tägliche Schritte',
    'goal_progress': 'Ziel-Fortschritt',
    'workout_plan': 'Trainingsplan',
    'add_exercise': 'Übung Hinzufügen',
    'save': 'Speichern',
    'cancel': 'Abbrechen',
    'delete': 'Löschen',
    'edit': 'Bearbeiten',
    'back_to_home': 'Zurück zur Startseite',
    'member_since': 'Mitglied Seit',
    'achievements': 'Erfolge',
    'completed': 'Abgeschlossen',
    'calories': 'Kalorien',
    'protein': 'Protein',
    'carbs': 'Kohlenhydrate',
    'fat': 'Fett',
  },
  // Add other languages with basic translations
  it: { 'welcome_message': 'Benvenuto su Planik!', 'gym_companion': 'Il tuo compagno di palestra' },
  pt: { 'welcome_message': 'Bem-vindo ao Planik!', 'gym_companion': 'Seu companheiro de academia' },
  ru: { 'welcome_message': 'Добро пожаловать в Planik!', 'gym_companion': 'Ваш спутник в спортзале' },
  ja: { 'welcome_message': 'Planikへようこそ！', 'gym_companion': 'あなたのジムの相棒' },
  ko: { 'welcome_message': 'Planik에 오신 것을 환영합니다!', 'gym_companion': '당신의 체육관 동반자' },
  zh: { 'welcome_message': '欢迎来到Planik！', 'gym_companion': '您的健身房伴侣' },
  ar: { 'welcome_message': 'مرحباً بك في Planik!', 'gym_companion': 'رفيقك في الصالة الرياضية' },
  hi: { 'welcome_message': 'Planik में आपका स्वागत है!', 'gym_companion': 'आपका जिम साथी' },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings({ ...defaultSettings, ...parsedSettings });
    }
  }, []);

  const updateSetting = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('app-settings', JSON.stringify(newSettings));
  };

  const formatWeight = (weight: number): string => {
    if (settings.units === 'lbs') {
      const lbs = Math.round(weight * 2.20462 * 10) / 10; // Convert kg to lbs with 1 decimal
      return `${lbs} lbs`;
    }
    return `${weight} kg`;
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    switch (settings.dateFormat) {
      case 'DD/MM/YYYY':
        return dateObj.toLocaleDateString('en-GB');
      case 'YYYY-MM-DD':
        return dateObj.toISOString().split('T')[0];
      case 'MM/DD/YYYY':
      default:
        return dateObj.toLocaleDateString('en-US');
    }
  };

  const formatDateWithOptions = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Map our date format to locale
    let locale = 'en-US';
    switch (settings.dateFormat) {
      case 'DD/MM/YYYY':
        locale = 'en-GB';
        break;
      case 'YYYY-MM-DD':
        locale = 'sv-SE'; // Sweden uses YYYY-MM-DD format
        break;
    }
    
    return dateObj.toLocaleDateString(locale, options);
  };

  const getText = (key: string): string => {
    const languageTranslations = translations[settings.language] || translations.en;
    return languageTranslations[key] || translations.en[key] || key;
  };

  const value: SettingsContextType = {
    settings,
    updateSetting,
    formatWeight,
    formatDate,
    formatDateWithOptions,
    getText,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}