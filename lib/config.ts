import { Platform } from 'react-native';

const FALLBACK_ANDROID_EMULATOR = 'http://10.0.2.2';
const FALLBACK_LOCALHOST = 'http://localhost';

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function getDefaultBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.trim()) return normalizeBaseUrl(fromEnv);

  // Sensible dev fallback when env is not provided.
  if (Platform.OS === 'android') return FALLBACK_ANDROID_EMULATOR;
  return FALLBACK_LOCALHOST;
}

