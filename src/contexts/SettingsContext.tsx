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

// Comprehensive translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation & General
    'welcome_message': 'Welcome to Planik!',
    'gym_companion': 'Your gym companion',
    'profile': 'Profile',
    'settings': 'Settings',
    'back': 'Back',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'continue': 'Continue',
    'custom': 'Custom',
    
    // Home Page
    'progress': 'Progress',
    'workouts': 'Workouts',
    'exercises': 'Exercises',
    'daily_steps': 'Daily Steps',
    'goal_progress': 'Goal Progress',
    'choose_workout': 'Choose Your Workout',
    'diet_tracker': 'Diet Tracker',
    'track_nutrition': 'Track nutrition & calories',
    
    // Workout related
    'create_plan': 'Create plan',
    'tap_to_continue': 'Tap to continue',
    'times_past_month': 'Times past 1 month',
    'seen_increase': 'Seen an Increase',
    'seen_decrease': 'Seen a Decrease',
    'same_as_last_week': 'Same as Last Week',
    'no_recent_activity': 'No Recent Activity',
    
    // Settings
    'app_info_support': 'App Info & Support',
    'language_region': 'Language & Region',
    'language': 'Language',
    'weight_units': 'Weight Units',
    'date_format': 'Date Format',
    'notifications_privacy': 'Notifications & Privacy',
    'push_notifications': 'Push Notifications',
    'receive_workout_reminders': 'Receive workout reminders and updates',
    'biometric_login': 'Biometric Login',
    'use_face_id_fingerprint': 'Use Face ID or Fingerprint to sign in',
    'security': 'Security',
    'change_password': 'Change Password',
    'new_password': 'New Password',
    'confirm_new_password': 'Confirm New Password',
    'update_password': 'Update Password',
    'contact_us': 'Contact Us',
    'privacy_policy': 'Privacy Policy',
    'terms_service': 'Terms of Service',
    'app_version': 'App Version',
    
    // Progress Page
    'personal_records': 'Personal Records',
    'your_best_performances': 'Your best performances',
    'one_rep_max': 'Personal Records (1 Rep Max)',
    'add_exercise': 'Add Exercise',
    'add_record': 'Add record',
    'exercise_progress': 'Exercise Progress',
    'no_exercise_data': 'No exercise data yet',
    'latest': 'Latest',
    
    // History Page
    'workout_history': 'Workout History',
    'view_completed_workouts': 'View all your completed workouts',
    'no_workouts_completed': 'No workouts completed yet',
    'complete_first_workout': 'Complete your first workout to see it here!',
    'exercises_completed': 'exercises completed',
    'click_view_details': 'Click to view details',
    'completed': 'Completed',
    'sets_completed': 'sets completed',
    'more_exercises': 'more exercises...',
    'total_volume': 'Total Volume',
    
    // Legacy keys for compatibility
    'workout_plan': 'Workout Plan',
    'back_to_home': 'Back to Home',
    'member_since': 'Member Since',
    'achievements': 'Achievements',
    'calories': 'calories',
    'protein': 'Protein',
    'carbs': 'Carbs',
    'fat': 'Fat',
    
    // Units
    'kg': 'kg',
    'lbs': 'lbs',
    
    // Navigation
    'home': 'Home',
    'history': 'History',
    'log_out': 'Log out',
    
    // Progress Terms
    'average': 'Average',
    'previous': 'Previous',
    
    // Dates
    'monday': 'Monday',
    'tuesday': 'Tuesday', 
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday'
  },
  es: {
    // Navigation & General
    'welcome_message': '¡Bienvenido a Planik!',
    'gym_companion': 'Tu compañero de gimnasio',
    'profile': 'Perfil',
    'settings': 'Configuración',
    'back': 'Atrás',
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'delete': 'Eliminar',
    'edit': 'Editar',
    'add': 'Añadir',
    'continue': 'Continuar',
    'custom': 'Personalizado',
    
    // Home Page
    'progress': 'Progreso',
    'workouts': 'Entrenamientos',
    'exercises': 'Ejercicios',
    'daily_steps': 'Pasos Diarios',
    'goal_progress': 'Progreso del Objetivo',
    'choose_workout': 'Elige Tu Entrenamiento',
    'diet_tracker': 'Rastreador de Dieta',
    'track_nutrition': 'Rastrea nutrición y calorías',
    
    // Workout related
    'create_plan': 'Crear plan',
    'tap_to_continue': 'Toca para continuar',
    'times_past_month': 'Veces el mes pasado',
    'seen_increase': 'Ha Aumentado',
    'seen_decrease': 'Ha Disminuido',
    'same_as_last_week': 'Igual que la Semana Pasada',
    'no_recent_activity': 'Sin Actividad Reciente',
    
    // Settings
    'app_info_support': 'Info de la App y Soporte',
    'language_region': 'Idioma y Región',
    'language': 'Idioma',
    'weight_units': 'Unidades de Peso',
    'date_format': 'Formato de Fecha',
    'notifications_privacy': 'Notificaciones y Privacidad',
    'push_notifications': 'Notificaciones Push',
    'receive_workout_reminders': 'Recibir recordatorios de entrenamiento y actualizaciones',
    'biometric_login': 'Inicio de Sesión Biométrico',
    'use_face_id_fingerprint': 'Usar Face ID o Huella Dactilar para iniciar sesión',
    'security': 'Seguridad',
    'change_password': 'Cambiar Contraseña',
    'new_password': 'Nueva Contraseña',
    'confirm_new_password': 'Confirmar Nueva Contraseña',
    'update_password': 'Actualizar Contraseña',
    'contact_us': 'Contáctanos',
    'privacy_policy': 'Política de Privacidad',
    'terms_service': 'Términos de Servicio',
    'app_version': 'Versión de la App',
    
    // Progress Page
    'personal_records': 'Récords Personales',
    'your_best_performances': 'Tus mejores rendimientos',
    'one_rep_max': 'Récords Personales (1 Rep Máx)',
    'add_exercise': 'Añadir Ejercicio',
    'add_record': 'Añadir récord',
    'exercise_progress': 'Progreso de Ejercicios',
    'no_exercise_data': 'Aún no hay datos de ejercicios',
    'latest': 'Último',
    
    // History Page
    'workout_history': 'Historial de Entrenamientos',
    'view_completed_workouts': 'Ver todos tus entrenamientos completados',
    'no_workouts_completed': 'Aún no hay entrenamientos completados',
    'complete_first_workout': '¡Completa tu primer entrenamiento para verlo aquí!',
    'exercises_completed': 'ejercicios completados',
    'click_view_details': 'Haz clic para ver detalles',
    'completed': 'Completado',
    'sets_completed': 'series completadas',
    'more_exercises': 'más ejercicios...',
    'total_volume': 'Volumen Total',
    
    // Legacy keys for compatibility
    'workout_plan': 'Plan de Entrenamiento',
    'back_to_home': 'Volver al Inicio',
    'member_since': 'Miembro Desde',
    'achievements': 'Logros',
    'calories': 'calorías',
    'protein': 'Proteína',
    'carbs': 'Carbohidratos',
    'fat': 'Grasa',
    
    // Units
    'kg': 'kg',
    'lbs': 'lbs',
    
    // Navigation
    'home': 'Inicio',
    'history': 'Historial',
    'log_out': 'Cerrar sesión',
    
    // Progress Terms
    'average': 'Promedio',
    'previous': 'Anterior',
    
    // Dates
    'monday': 'Lunes',
    'tuesday': 'Martes',
    'wednesday': 'Miércoles', 
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  },
  fr: {
    // Navigation & General
    'welcome_message': 'Bienvenue sur Planik !',
    'gym_companion': 'Votre compagnon de gym',
    'profile': 'Profil',
    'settings': 'Paramètres',
    'back': 'Retour',
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    'delete': 'Supprimer',
    'edit': 'Modifier',
    'add': 'Ajouter',
    'continue': 'Continuer',
    'custom': 'Personnalisé',
    
    // Home Page
    'progress': 'Progrès',
    'workouts': 'Entraînements',
    'exercises': 'Exercices',
    'daily_steps': 'Pas Quotidiens',
    'goal_progress': 'Progrès de l\'Objectif',
    'choose_workout': 'Choisissez Votre Entraînement',
    'diet_tracker': 'Suivi de Régime',
    'track_nutrition': 'Suivez nutrition et calories',
    
    // Workout related
    'create_plan': 'Créer un plan',
    'tap_to_continue': 'Tapez pour continuer',
    'times_past_month': 'Fois le mois dernier',
    'seen_increase': 'A Augmenté',
    'seen_decrease': 'A Diminué',
    'same_as_last_week': 'Identique à la Semaine Dernière',
    'no_recent_activity': 'Aucune Activité Récente',
    
    // Settings
    'app_info_support': 'Info de l\'App et Support',
    'language_region': 'Langue et Région',
    'language': 'Langue',
    'weight_units': 'Unités de Poids',
    'date_format': 'Format de Date',
    'notifications_privacy': 'Notifications et Confidentialité',
    'push_notifications': 'Notifications Push',
    'receive_workout_reminders': 'Recevoir des rappels d\'entraînement et des mises à jour',
    'biometric_login': 'Connexion Biométrique',
    'use_face_id_fingerprint': 'Utiliser Face ID ou l\'empreinte digitale pour se connecter',
    'security': 'Sécurité',
    'change_password': 'Changer le Mot de Passe',
    'new_password': 'Nouveau Mot de Passe',
    'confirm_new_password': 'Confirmer le Nouveau Mot de Passe',
    'update_password': 'Mettre à Jour le Mot de Passe',
    'contact_us': 'Nous Contacter',
    'privacy_policy': 'Politique de Confidentialité',
    'terms_service': 'Conditions de Service',
    'app_version': 'Version de l\'App',
    
    // Progress Page
    'personal_records': 'Records Personnels',
    'your_best_performances': 'Vos meilleures performances',
    'one_rep_max': 'Records Personnels (1 Rep Max)',
    'add_exercise': 'Ajouter un Exercice',
    'add_record': 'Ajouter un record',
    'exercise_progress': 'Progrès des Exercices',
    'no_exercise_data': 'Pas encore de données d\'exercices',
    'latest': 'Dernier',
    
    // History Page
    'workout_history': 'Historique des Entraînements',
    'view_completed_workouts': 'Voir tous vos entraînements terminés',
    'no_workouts_completed': 'Aucun entraînement terminé pour le moment',
    'complete_first_workout': 'Terminez votre premier entraînement pour le voir ici !',
    'exercises_completed': 'exercices terminés',
    'click_view_details': 'Cliquez pour voir les détails',
    'completed': 'Terminé',
    'sets_completed': 'séries terminées',
    'more_exercises': 'plus d\'exercices...',
    'total_volume': 'Volume Total',
    
    // Legacy keys for compatibility
    'workout_plan': 'Plan d\'Entraînement',
    'back_to_home': 'Retour à l\'Accueil',
    'member_since': 'Membre Depuis',
    'achievements': 'Réalisations',
    'calories': 'calories',
    'protein': 'Protéine',
    'carbs': 'Glucides',
    'fat': 'Graisse',
    
    // Units
    'kg': 'kg',
    'lbs': 'lbs',
    
    // Navigation
    'home': 'Accueil',
    'history': 'Historique',
    'log_out': 'Se déconnecter',
    
    // Progress Terms
    'average': 'Moyenne',
    'previous': 'Précédent',
    
    // Dates
    'monday': 'Lundi',
    'tuesday': 'Mardi',
    'wednesday': 'Mercredi',
    'thursday': 'Jeudi', 
    'friday': 'Vendredi',
    'saturday': 'Samedi',
    'sunday': 'Dimanche'
  },
  de: {
    // Navigation & General
    'welcome_message': 'Willkommen bei Planik!',
    'gym_companion': 'Ihr Fitnessstudio-Begleiter',
    'profile': 'Profil',
    'settings': 'Einstellungen',
    'back': 'Zurück',
    'save': 'Speichern',
    'cancel': 'Abbrechen',
    'delete': 'Löschen',
    'edit': 'Bearbeiten',
    'add': 'Hinzufügen',
    'continue': 'Weiter',
    'custom': 'Benutzerdefiniert',
    
    // Home Page
    'progress': 'Fortschritt',
    'workouts': 'Trainings',
    'exercises': 'Übungen',
    'daily_steps': 'Tägliche Schritte',
    'goal_progress': 'Ziel-Fortschritt',
    'choose_workout': 'Wählen Sie Ihr Training',
    'diet_tracker': 'Diät-Tracker',
    'track_nutrition': 'Ernährung und Kalorien verfolgen',
    
    // Workout related
    'create_plan': 'Plan erstellen',
    'tap_to_continue': 'Tippen zum Fortfahren',
    'times_past_month': 'Mal im letzten Monat',
    'seen_increase': 'Zunahme Gesehen',
    'seen_decrease': 'Abnahme Gesehen',
    'same_as_last_week': 'Gleich wie Letzte Woche',
    'no_recent_activity': 'Keine Aktuelle Aktivität',
    
    // Settings
    'app_info_support': 'App-Info & Support',
    'language_region': 'Sprache & Region',
    'language': 'Sprache',
    'weight_units': 'Gewichtseinheiten',
    'date_format': 'Datumsformat',
    'notifications_privacy': 'Benachrichtigungen & Datenschutz',
    'push_notifications': 'Push-Benachrichtigungen',
    'receive_workout_reminders': 'Training-Erinnerungen und Updates erhalten',
    'biometric_login': 'Biometrische Anmeldung',
    'use_face_id_fingerprint': 'Face ID oder Fingerabdruck zur Anmeldung verwenden',
    'security': 'Sicherheit',
    'change_password': 'Passwort Ändern',
    'new_password': 'Neues Passwort',
    'confirm_new_password': 'Neues Passwort Bestätigen',
    'update_password': 'Passwort Aktualisieren',
    'contact_us': 'Kontaktieren Sie Uns',
    'privacy_policy': 'Datenschutzrichtlinie',
    'terms_service': 'Nutzungsbedingungen',
    'app_version': 'App-Version',
    
    // Progress Page
    'personal_records': 'Persönliche Rekorde',
    'your_best_performances': 'Ihre besten Leistungen',
    'one_rep_max': 'Persönliche Rekorde (1 Wdh Max)',
    'add_exercise': 'Übung Hinzufügen',
    'add_record': 'Rekord hinzufügen',
    'exercise_progress': 'Übungsfortschritt',
    'no_exercise_data': 'Noch keine Übungsdaten',
    'latest': 'Neueste',
    
    // History Page
    'workout_history': 'Training-Historie',
    'view_completed_workouts': 'Alle abgeschlossenen Trainings anzeigen',
    'no_workouts_completed': 'Noch keine Trainings abgeschlossen',
    'complete_first_workout': 'Schließen Sie Ihr erstes Training ab, um es hier zu sehen!',
    'exercises_completed': 'Übungen abgeschlossen',
    'click_view_details': 'Klicken für Details',
    'completed': 'Abgeschlossen',
    'sets_completed': 'Sätze abgeschlossen',
    'more_exercises': 'weitere Übungen...',
    'total_volume': 'Gesamtvolumen',
    
    // Legacy keys for compatibility
    'workout_plan': 'Trainingsplan',
    'back_to_home': 'Zurück zur Startseite',
    'member_since': 'Mitglied Seit',  
    'achievements': 'Erfolge',
    'calories': 'Kalorien',
    'protein': 'Protein',
    'carbs': 'Kohlenhydrate',
    'fat': 'Fett',
    
    // Units
    'kg': 'kg',
    'lbs': 'lbs',
    
    // Navigation
    'home': 'Startseite',
    'history': 'Verlauf',
    'log_out': 'Abmelden',
    
    // Progress Terms
    'average': 'Durchschnitt',
    'previous': 'Vorherige',
    
    // Dates
    'monday': 'Montag',
    'tuesday': 'Dienstag',
    'wednesday': 'Mittwoch',
    'thursday': 'Donnerstag',
    'friday': 'Freitag', 
    'saturday': 'Samstag',
    'sunday': 'Sonntag'
  },
  it: {
    'welcome_message': 'Benvenuto su Planik!',
    'gym_companion': 'Il tuo compagno di palestra',
    'profile': 'Profilo',
    'settings': 'Impostazioni',
    'back': 'Indietro',
    'save': 'Salva',
    'cancel': 'Annulla',
    'delete': 'Elimina',
    'edit': 'Modifica',
    'add': 'Aggiungi',
    'continue': 'Continua',
    'custom': 'Personalizzato',
    'progress': 'Progresso',
    'workouts': 'Allenamenti',
    'exercises': 'Esercizi',
    'daily_steps': 'Passi Giornalieri',
    'goal_progress': 'Progresso Obiettivo',
    'choose_workout': 'Scegli Il Tuo Allenamento',
    'diet_tracker': 'Tracker Dieta',
    'track_nutrition': 'Traccia nutrizione e calorie',
    'create_plan': 'Crea piano',
    'tap_to_continue': 'Tocca per continuare',
    'times_past_month': 'Volte il mese scorso',
    'seen_increase': 'Ha Aumentato',
    'seen_decrease': 'Ha Diminuito',
    'same_as_last_week': 'Uguale alla Settimana Scorsa',
    'no_recent_activity': 'Nessuna Attività Recente',
    'workout_plan': 'Piano Allenamento',
    'add_exercise': 'Aggiungi Esercizio',
    'back_to_home': 'Torna a Casa',
    'member_since': 'Membro Da',
    'achievements': 'Risultati',
    'completed': 'Completato',
    'calories': 'calorie',
    'protein': 'Proteine',
    'carbs': 'Carboidrati',
    'fat': 'Grassi',
    'kg': 'kg',
    'lbs': 'lbs',
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