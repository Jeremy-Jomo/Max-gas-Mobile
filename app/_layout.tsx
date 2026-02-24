import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BRAND } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(agent)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function AuthGate() {
  const { loading, accessToken, profile, logout } = useAuth();
  const segments: string[] = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key) return;
    if (loading) return;

    const top = String(segments[0] ?? '');
    const inAuth = top === '(auth)';
    const inAgent = top === '(agent)';

    if (!accessToken) {
      if (!inAuth) router.replace('/(auth)/login' as any);
      return;
    }

    if (!profile) return;

    // This build is for the AGENT app. If a different role logs in, log them out.
    if (profile.role !== 'AGENT') {
      void logout();
      router.replace('/(auth)/login' as any);
      return;
    }

    if (!profile.phone_verified) {
      if (!(inAuth && String(segments[1] ?? '') === 'otp')) router.replace('/(auth)/otp' as any);
      return;
    }

    if (profile.must_change_password) {
      if (!(inAuth && String(segments[1] ?? '') === 'change-password')) router.replace('/(auth)/change-password' as any);
      return;
    }

    if (!inAgent) {
      router.replace('/(agent)/(tabs)/home' as any);
    }
  }, [accessToken, loading, logout, navState?.key, profile, router, segments]);

  if (!navState?.key) return null;

  // Branded splash while bootstrapping (loading tokens / fetching profile).
  if (loading) {
    return (
      <View style={splashStyles.container}>
        <View style={splashStyles.logoPlaceholder} />
        <ThemedText style={splashStyles.title}>Max Gas</ThemedText>
        <ActivityIndicator size="large" color={BRAND.orange} style={splashStyles.spinner} />
      </View>
    );
  }

  return null;
}

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 14,
  },
  title: {
    color: BRAND.text,
    fontSize: 28,
    fontWeight: '800',
  },
  spinner: {
    marginTop: 20,
  },
});
