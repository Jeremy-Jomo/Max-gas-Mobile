import { Formik } from 'formik';
import { useState } from 'react';
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
import * as Yup from 'yup';

import { ThemedText } from '@/components/themed-text';
import { BRAND } from '@/constants/theme';
import { showAlert } from '@/lib/alert';
import { normalizeBaseUrl } from '@/lib/config';
import { ApiError } from '@/lib/api/http';
import { useAuth } from '@/lib/auth/AuthProvider';

const LoginSchema = Yup.object().shape({
  phone: Yup.string()
    .required('Phone is required')
    .matches(/^\+?\d{9,15}$/, 'Use international format, e.g. +2547XXXXXXXX'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default function LoginScreen() {
  const { login, baseUrl, setBaseUrl } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showServer, setShowServer] = useState(false);
  const [serverUrl, setServerUrl] = useState(baseUrl);

  const saveServerUrl = async (url: string) => {
    const normalized = normalizeBaseUrl(url || '');
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      showAlert('Server URL', 'URL must start with http:// or https://');
      return;
    }
    setServerUrl(normalized);
    await setBaseUrl(normalized);
  };

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
              Max Gas
            </ThemedText>
            <ThemedText style={styles.subtitle}>Agent App</ThemedText>
          </View>

          <Formik
            initialValues={{ phone: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={async (values, helpers) => {
              setLoading(true);
              try {
                await login({ phone: values.phone.trim(), password: values.password });
                helpers.resetForm();
                // AuthGate handles routing based on profile flags (OTP / change-password / dashboard).
              } catch (e) {
                const message = e instanceof ApiError ? e.message : 'Login failed. Please try again.';
                showAlert('Login failed', message);
              } finally {
                setLoading(false);
              }
            }}>
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isValid }) => (
              <View style={styles.form}>
                <View style={styles.field}>
                  <ThemedText style={styles.label}>Phone number</ThemedText>
                  <TextInput
                    placeholder="+2547XXXXXXXX"
                    placeholderTextColor={BRAND.muted}
                    value={values.phone}
                    onChangeText={handleChange('phone')}
                    onBlur={handleBlur('phone')}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    style={[styles.input, errors.phone && touched.phone ? styles.inputError : undefined]}
                  />
                  {errors.phone && touched.phone ? <ThemedText style={styles.error}>{errors.phone}</ThemedText> : null}
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Password</ThemedText>
                  <TextInput
                    placeholder="Enter password"
                    placeholderTextColor={BRAND.muted}
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    secureTextEntry
                    autoCapitalize="none"
                    style={[styles.input, errors.password && touched.password ? styles.inputError : undefined]}
                  />
                  {errors.password && touched.password ? (
                    <ThemedText style={styles.error}>{errors.password}</ThemedText>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={() => handleSubmit()}
                  disabled={!isValid || loading}
                  style={[styles.button, (!isValid || loading) ? styles.buttonDisabled : undefined]}>
                  {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Login</ThemedText>}
                </TouchableOpacity>

                <ThemedText style={styles.helper}>
                  Use the login details provided by admin. On first login you will verify OTP and change password.
                </ThemedText>
              </View>
            )}
          </Formik>

          {/* Collapsible server URL configuration */}
          <TouchableOpacity onPress={() => setShowServer((v) => !v)} style={styles.serverToggle}>
            <ThemedText style={styles.serverToggleText}>
              {showServer ? 'Hide server settings' : 'Server settings'}
            </ThemedText>
          </TouchableOpacity>

          {showServer ? (
            <View style={styles.serverCard}>
              <ThemedText style={styles.serverLabel}>
                Current: <ThemedText style={styles.serverUrl}>{baseUrl}</ThemedText>
              </ThemedText>

              <TextInput
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://10.0.2.2"
                placeholderTextColor={BRAND.muted}
                autoCapitalize="none"
                style={styles.input}
              />

              <View style={styles.quickRow}>
                <TouchableOpacity
                  onPress={() => saveServerUrl('http://10.0.2.2')}
                  style={styles.quickBtn}>
                  <ThemedText style={styles.quickText}>Emulator</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => saveServerUrl('http://localhost')}
                  style={styles.quickBtn}>
                  <ThemedText style={styles.quickText}>Localhost</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => saveServerUrl('http://178.128.25.228')}
                  style={styles.quickBtn}>
                  <ThemedText style={styles.quickText}>Production</ThemedText>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => saveServerUrl(serverUrl)} style={styles.serverSaveBtn}>
                <ThemedText style={styles.serverSaveBtnText}>Save URL</ThemedText>
              </TouchableOpacity>
            </View>
          ) : null}
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
    fontSize: 30,
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: BRAND.blue,
    marginTop: 6,
    fontSize: 14,
  },
  form: {
    marginTop: 10,
    gap: 14,
  },
  field: {
    gap: 8,
  },
  label: {
    color: BRAND.muted,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
  },
  button: {
    backgroundColor: BRAND.orange,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  helper: {
    color: BRAND.muted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  serverToggle: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  serverToggleText: {
    color: BRAND.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  serverCard: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
    gap: 10,
  },
  serverLabel: {
    color: BRAND.muted,
    fontSize: 12,
  },
  serverUrl: {
    color: BRAND.blue,
    fontWeight: '700',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  quickText: {
    color: BRAND.blue,
    fontWeight: '700',
    fontSize: 12,
  },
  serverSaveBtn: {
    backgroundColor: BRAND.blue,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  serverSaveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
