import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert helper.
 * - Native: uses Alert.alert (modal dialog)
 * - Web: uses window.alert (Alert.alert is a no-op on web)
 */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}: ${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}
