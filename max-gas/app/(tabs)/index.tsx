import { useRouter } from "expo-router";
import { Formik } from "formik";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Yup from "yup";

// Validation Schema
const LoginSchema = Yup.object().shape({
  identifier: Yup.string()
    .required("Username or phone number is required")
    .test(
      "username-or-phone",
      "Enter a valid username (min 3 chars) or phone number (9–15 digits)",
      (value) => {
        if (!value) return false;
        const isPhone = /^\+?\d{9,15}$/.test(value);
        const isUsername = /^[a-zA-Z0-9._]{3,}$/.test(value);
        return isPhone || isUsername;
      },
    ),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values, { resetForm }) => {
    // ✅ JUST CONSOLE.LOG - NO API CALLS
    console.log("📱 Login Form Submitted:");
    console.log("Identifier (username or phone):", values.identifier);
    console.log("Password:", values.password);
    console.log("Timestamp:", new Date().toISOString());

    // Simulate loading state for UX
    setLoading(true);

    // Simulate network delay (remove this when adding real API)
    setTimeout(() => {
      setLoading(false);
      resetForm();
      // Show success message
      Alert.alert("Success", "Login form submitted! Check console logs.");
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agent Login</Text>

      <Formik
        initialValues={{ identifier: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          isValid,
        }) => (
          <>
            {/* Username or Phone Input */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Username or Phone Number"
                onChangeText={handleChange("identifier")}
                onBlur={handleBlur("identifier")}
                value={values.identifier}
                keyboardType="default"
                autoCapitalize="none"
                style={[
                  styles.input,
                  errors.identifier && touched.identifier && styles.inputError,
                ]}
              />
              {errors.identifier && touched.identifier && (
                <Text style={styles.errorText}>{errors.identifier}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Password"
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                value={values.password}
                secureTextEntry
                autoCapitalize="none"
                style={[
                  styles.input,
                  errors.password && touched.password && styles.inputError,
                ]}
              />
              {errors.password && touched.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (!isValid || loading) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isValid || loading}
            >
              {loading ? (
                <ActivityIndicator color="#e9c10d" />
              ) : (
                <Text style={styles.buttonText}>LOGIN</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    color: "orange",
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#15247c",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#0d3ad1",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#666",
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
