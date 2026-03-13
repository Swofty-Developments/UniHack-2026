import type { ExpoConfig } from 'expo/config';

const appJson = require('./app.json');

const fallbackApiUrl = appJson.expo.extra?.apiUrl ?? 'http://localhost:3001/api';
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || fallbackApiUrl;

const config: ExpoConfig = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    apiUrl,
  },
};

export default config;
