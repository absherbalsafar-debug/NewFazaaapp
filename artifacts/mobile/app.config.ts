import type { ExpoConfig } from 'expo/config';

const isProduction = process.env.APP_ENV === 'production';

const config: ExpoConfig = {
  name: 'فزعة | FAZAAH',
  slug: 'fazaa',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  scheme: 'fazaa',
  icon: './assets/icon.png',
  splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#0F766E' },
  android: {
    package: 'com.fazaa.app',
    versionCode: 1,
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#0F766E' },
    edgeToEdgeEnabled: true,
  },
  plugins: [
    ['expo-build-properties', { android: { targetSdkVersion: 36, compileSdkVersion: 36, buildToolsVersion: '36.0.0' } }],
    'expo-system-ui',
  ],
  extra: {
    apiUrl: isProduction ? process.env.EXPO_PUBLIC_API_URL || 'https://api.fazaa.com' : process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.fazaa.com',
    appEnv: isProduction ? 'production' : 'staging',
  },
};

export default config;
