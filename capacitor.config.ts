import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uk.org.planik.app',
  appName: 'Planik',
  webDir: 'dist',
  // Load the live web app so publishing updates the installed app instantly —
  // no App Store resubmission needed for JS/CSS changes.
  // Native plugin changes (Capacitor upgrades, new permissions) still require a rebuild.
  server: {
    url: 'https://planik.org.uk',
    cleartext: false
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '876860682396-snp1r9u16ftm6mgoksm8348guoerjlnu.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
