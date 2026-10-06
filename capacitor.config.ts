import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.planik.app',
  appName: 'Planik',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#488AFF'
    }
  }
};

export default config;
