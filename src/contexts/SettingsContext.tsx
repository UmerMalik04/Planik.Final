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
  it: {
    'welcome_message': 'Benvenuto su Planik!',
    'gym_companion': 'Il tuo compagno di palestra',
    'diet_tracker': 'Tracker Dieta',
    'track_nutrition': 'Traccia nutrizione e calorie',
    'progress': 'Progresso',
    'workouts': 'Allenamenti',
    'exercises': 'Esercizi',
    'profile': 'Profilo',
    'settings': 'Impostazioni',
    'daily_steps': 'Passi Giornalieri',
    'goal_progress': 'Progresso Obiettivo',
    'workout_plan': 'Piano Allenamento',
    'add_exercise': 'Aggiungi Esercizio',
    'save': 'Salva',
    'cancel': 'Annulla',
    'delete': 'Elimina',
    'edit': 'Modifica',
    'back_to_home': 'Torna a Casa',
    'member_since': 'Membro Da',
    'achievements': 'Risultati',
    'completed': 'Completato',
    'calories': 'calorie',
    'protein': 'Proteine',
    'carbs': 'Carboidrati',
    'fat': 'Grassi',
  },
  pt: {
    'welcome_message': 'Bem-vindo ao Planik!',
    'gym_companion': 'Seu companheiro de academia',
    'diet_tracker': 'Rastreador de Dieta',
    'track_nutrition': 'Rastrear nutrição e calorias',
    'progress': 'Progresso',
    'workouts': 'Treinos',
    'exercises': 'Exercícios',
    'profile': 'Perfil',
    'settings': 'Configurações',
    'daily_steps': 'Passos Diários',
    'goal_progress': 'Progresso da Meta',
    'workout_plan': 'Plano de Treino',
    'add_exercise': 'Adicionar Exercício',
    'save': 'Salvar',
    'cancel': 'Cancelar',
    'delete': 'Deletar',
    'edit': 'Editar',
    'back_to_home': 'Voltar ao Início',
    'member_since': 'Membro Desde',
    'achievements': 'Conquistas',
    'completed': 'Completado',
    'calories': 'calorias',
    'protein': 'Proteína',
    'carbs': 'Carboidratos',
    'fat': 'Gordura',
  },
  ru: {
    'welcome_message': 'Добро пожаловать в Planik!',
    'gym_companion': 'Ваш спутник в спортзале',
    'diet_tracker': 'Трекер Питания',
    'track_nutrition': 'Отслеживать питание и калории',
    'progress': 'Прогресс',
    'workouts': 'Тренировки',
    'exercises': 'Упражнения',
    'profile': 'Профиль',
    'settings': 'Настройки',
    'daily_steps': 'Дневные Шаги',
    'goal_progress': 'Прогресс Цели',
    'workout_plan': 'План Тренировок',
    'add_exercise': 'Добавить Упражнение',
    'save': 'Сохранить',
    'cancel': 'Отмена',
    'delete': 'Удалить',
    'edit': 'Редактировать',
    'back_to_home': 'Домой',
    'member_since': 'Участник С',
    'achievements': 'Достижения',
    'completed': 'Завершено',
    'calories': 'калории',
    'protein': 'Белок',
    'carbs': 'Углеводы',
    'fat': 'Жир',
  },
  ja: {
    'welcome_message': 'Planikへようこそ！',
    'gym_companion': 'あなたのジムの相棒',
    'diet_tracker': 'ダイエットトラッカー',
    'track_nutrition': '栄養とカロリーを追跡',
    'progress': '進歩',
    'workouts': 'ワークアウト',
    'exercises': 'エクササイズ',
    'profile': 'プロフィール',
    'settings': '設定',
    'daily_steps': '1日の歩数',
    'goal_progress': '目標の進歩',
    'workout_plan': 'ワークアウトプラン',
    'add_exercise': 'エクササイズを追加',
    'save': '保存',
    'cancel': 'キャンセル',
    'delete': '削除',
    'edit': '編集',
    'back_to_home': 'ホームに戻る',
    'member_since': 'メンバー歴',
    'achievements': '実績',
    'completed': '完了',
    'calories': 'カロリー',
    'protein': 'タンパク質',
    'carbs': '炭水化物',
    'fat': '脂肪',
  },
  ko: {
    'welcome_message': 'Planik에 오신 것을 환영합니다!',
    'gym_companion': '당신의 체육관 동반자',
    'diet_tracker': '다이어트 트래커',
    'track_nutrition': '영양 및 칼로리 추적',
    'progress': '진행',
    'workouts': '운동',
    'exercises': '연습',
    'profile': '프로필',
    'settings': '설정',
    'daily_steps': '일일 걸음',
    'goal_progress': '목표 진행',
    'workout_plan': '운동 계획',
    'add_exercise': '운동 추가',
    'save': '저장',
    'cancel': '취소',
    'delete': '삭제',
    'edit': '편집',
    'back_to_home': '홈으로',
    'member_since': '가입일',
    'achievements': '성취',
    'completed': '완료',
    'calories': '칼로리',
    'protein': '단백질',
    'carbs': '탄수화물',
    'fat': '지방',
  },
  zh: {
    'welcome_message': '欢迎来到Planik！',
    'gym_companion': '您的健身房伴侣',
    'diet_tracker': '饮食追踪器',
    'track_nutrition': '跟踪营养和卡路里',
    'progress': '进展',
    'workouts': '训练',
    'exercises': '练习',
    'profile': '个人资料',
    'settings': '设置',
    'daily_steps': '每日步数',
    'goal_progress': '目标进展',
    'workout_plan': '训练计划',
    'add_exercise': '添加练习',
    'save': '保存',
    'cancel': '取消',
    'delete': '删除',
    'edit': '编辑',
    'back_to_home': '回到首页',
    'member_since': '会员自',  
    'achievements': '成就',
    'completed': '已完成',
    'calories': '卡路里',
    'protein': '蛋白质',
    'carbs': '碳水化合物',
    'fat': '脂肪',
  },
  ar: {
    'welcome_message': 'مرحباً بك في Planik!',
    'gym_companion': 'رفيقك في الصالة الرياضية',
    'diet_tracker': 'متتبع النظام الغذائي',
    'track_nutrition': 'تتبع التغذية والسعرات الحرارية',
    'progress': 'التقدم',
    'workouts': 'التمارين',
    'exercises': 'التدريبات',
    'profile': 'الملف الشخصي',
    'settings': 'الإعدادات',
    'daily_steps': 'الخطوات اليومية',
    'goal_progress': 'تقدم الهدف',
    'workout_plan': 'خطة التمرين',
    'add_exercise': 'إضافة تمرين',
    'save': 'حفظ',
    'cancel': 'إلغاء',
    'delete': 'حذف',
    'edit': 'تحرير',
    'back_to_home': 'العودة للرئيسية',
    'member_since': 'عضو منذ',
    'achievements': 'الإنجازات',
    'completed': 'مكتمل',
    'calories': 'سعرة حرارية',
    'protein': 'بروتين',
    'carbs': 'كربوهيدرات',
    'fat': 'دهون',
  },
  hi: {
    'welcome_message': 'Planik में आपका स्वागत है!',
    'gym_companion': 'आपका जिम साथी',
    'diet_tracker': 'डाइट ट्रैकर',
    'track_nutrition': 'पोषण और कैलोरी ट्रैक करें',
    'progress': 'प्रगति',
    'workouts': 'वर्कआउट',
    'exercises': 'व्यायाम',
    'profile': 'प्रोफ़ाइल',
    'settings': 'सेटिंग्स',
    'daily_steps': 'दैनिक कदम',
    'goal_progress': 'लक्ष्य प्रगति',
    'workout_plan': 'वर्कआउट प्लान',
    'add_exercise': 'व्यायाम जोड़ें',
    'save': 'सेव करें',
    'cancel': 'रद्द करें',
    'delete': 'हटाएं',
    'edit': 'संपादित करें',
    'back_to_home': 'होम पर वापस',
    'member_since': 'सदस्य से',
    'achievements': 'उपलब्धियां',
    'completed': 'पूर्ण',
    'calories': 'कैलोरी',
    'protein': 'प्रोटीन',
    'carbs': 'कार्ब्स',
    'fat': 'वसा',
  },
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