import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ae88b11777b84910b56c76e68ab4d741',
  appName: 'planik-flex-flow',
  webDir: 'dist',
  server: {
    url: 'https://ae88b117-77b8-4910-b56c-76e68ab4d741.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    }
  }
};

export default config;