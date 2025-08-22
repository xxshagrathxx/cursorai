import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.binbug.followups',
  appName: 'Followups',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      // leave false so we use the native SDK (recommended)
      skipNativeAuth: false,
      // load the providers you need (google.com ensures Google provider is initialised)
      providers: ['google.com'],
    },
    SplashScreen: {
      launchShowDuration: 0,          // <— skip native splash
      showSpinner: false,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
