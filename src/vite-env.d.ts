/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare global {
  interface Window {
    workoutReminderInterval?: NodeJS.Timeout | number | null;
  }
}

export {};
