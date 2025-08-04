/// <reference types="vite/client" />

declare global {
  interface Window {
    workoutReminderInterval?: NodeJS.Timeout | number | null;
  }
}

export {};
