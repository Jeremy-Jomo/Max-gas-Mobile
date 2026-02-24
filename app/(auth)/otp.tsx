import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BRAND } from '@/constants/theme';
import { showAlert } from '@/lib/alert';
import { ApiError } from '@/lib/api/http';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function OtpScreen() {
  const { profile, requestOtp, verifyOtp } = useAuth();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const phone = profile?.phone ?? '';
  const canResend = cooldownSeconds <= 0 && !sending && !verifying;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => setCooldownSeconds((s) => Math.max(0, s - 1)), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownSeconds]);

  const sendOtp = async () => {
    setSending(true);
    try {
      await requestOtp();
      setCooldownSeconds(45);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Failed to send OTP. Please try again.';
      showAlert('OTP', message);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    // Auto-send on first load.
    if (!sending && cooldownSeconds === 0) {
      sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prettyPhone = useMemo(() => (phone ? phone : 'your phone'), [phone]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          <View style={styles.header}>
            <View style={styles.logoPlaceholder} />
            <ThemedText type="title" style={styles.title}>
              Verify phone
            </ThemedText>
            <ThemedText style={styles.subtitle}>We sent a 6-digit code to {prettyPhone}.</ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText style={styles.label}>OTP code</ThemedText>
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^\d]/g, '').slice(0, 6))}
              placeholder="123456"
              placeholderTextColor={BRAND.muted}
              keyboardType="number-pad"
              style={styles.input}
              maxLength={6}
            />

            <TouchableOpacity
              disabled={verifying || code.length !== 6}
              onPress={async () => {
                setVerifying(true);
                try {
                  await verifyOtp(code);
                  // AuthGate will route next.
                } catch (e) {
                  const message = e instanceof ApiError ? e.message : 'Invalid code.';
                  showAlert('Verify OTP', message);
                } finally {
                  setVerifying(false);
                }
              }}
              style={[styles.button, (verifying || code.length !== 6) ? styles.buttonDisabled : undefined]}>
              {verifying ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Verify</ThemedText>}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!canResend}
              onPress={sendOtp}
              style={[styles.linkBtn, !canResend ? styles.linkBtnDisabled : undefined]}>
              <ThemedText style={styles.linkText}>
                {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend code'}
              </ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.helper}>If you don&apos;t receive the SMS, confirm your phone number with admin.</ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    color: BRAND.muted,
    marginTop: 8,
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  label: {
    color: BRAND.muted,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: 'center',
  },
  button: {
    backgroundColor: BRAND.orange,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  linkBtnDisabled: {
    opacity: 0.6,
  },
  linkText: {
    color: BRAND.blue,
    fontWeight: '600',
  },
  helper: {
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
});
