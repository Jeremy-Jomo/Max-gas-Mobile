import { Platform } from 'react-native';

/**
 * Platform-aware storage wrapper.
 * - Web: uses localStorage (SecureStore is a no-op on web)
 * - Native (iOS/Android): uses expo-secure-store
 */

let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

export async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore!.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore!.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore!.deleteItemAsync(key);
  } catch {
    // ignore
  }
}
