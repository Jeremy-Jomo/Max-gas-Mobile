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
import { ApiError } from '@/lib/api/http';
import { useAuth } from '@/lib/auth/AuthProvider';

const Schema = Yup.object().shape({
  newPassword: Yup.string().min(6, 'Min 6 characters').required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
    .required('Confirm your password'),
});

export default function ChangePasswordScreen() {
  const { profile, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);

  const reason = profile?.must_change_password_reason;

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
              Set new password
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {reason === 'ADMIN_RESET'
                ? 'Admin reset your password. Please set a new one to continue.'
                : 'First login: please set a new password to continue.'}
            </ThemedText>
          </View>

          <Formik
            initialValues={{ newPassword: '', confirmPassword: '' }}
            validationSchema={Schema}
            onSubmit={async (values, helpers) => {
              setLoading(true);
              try {
                await changePassword(values.newPassword);
                helpers.resetForm();
                // AuthGate will route to agent app.
              } catch (e) {
                const message = e instanceof ApiError ? e.message : 'Password change failed.';
                showAlert('Change password', message);
              } finally {
                setLoading(false);
              }
            }}>
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isValid }) => (
              <View style={styles.card}>
                <View style={styles.field}>
                  <ThemedText style={styles.label}>New password</ThemedText>
                  <TextInput
                    value={values.newPassword}
                    onChangeText={handleChange('newPassword')}
                    onBlur={handleBlur('newPassword')}
                    placeholder="New password"
                    placeholderTextColor={BRAND.muted}
                    secureTextEntry
                    style={[styles.input, errors.newPassword && touched.newPassword ? styles.inputError : undefined]}
                    autoCapitalize="none"
                  />
                  {errors.newPassword && touched.newPassword ? (
                    <ThemedText style={styles.error}>{errors.newPassword}</ThemedText>
                  ) : null}
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Confirm password</ThemedText>
                  <TextInput
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    placeholder="Confirm password"
                    placeholderTextColor={BRAND.muted}
                    secureTextEntry
                    style={[styles.input, errors.confirmPassword && touched.confirmPassword ? styles.inputError : undefined]}
                    autoCapitalize="none"
                  />
                  {errors.confirmPassword && touched.confirmPassword ? (
                    <ThemedText style={styles.error}>{errors.confirmPassword}</ThemedText>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={() => handleSubmit()}
                  disabled={!isValid || loading}
                  style={[styles.button, (!isValid || loading) ? styles.buttonDisabled : undefined]}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.buttonText}>Save password</ThemedText>
                  )}
                </TouchableOpacity>

                <ThemedText style={styles.helper}>
                  Tip: Use a password you can remember. You will need it every time you log in.
                </ThemedText>
              </View>
            )}
          </Formik>
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
  helper: {
    color: BRAND.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
