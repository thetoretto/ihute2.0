import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input, Button, Screen } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { requestPasswordReset } from '../../services/api';
import { spacing, typography } from '../../utils/theme';
import { strings } from '../../constants/strings';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const c = useThemeColors();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError(strings.auth.enterValidEmail);
      return;
    }
    if (!isValidEmail(normalized)) {
      setError(strings.auth.enterValidEmail);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(normalized);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send reset link.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Screen style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.text }]}>Check your email</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          If an account exists for {email}, we sent a reset link.
        </Text>
        <Button title="Back to Login" onPress={() => navigation.navigate('Login')} style={styles.btn} />
      </Screen>
    );
  }

  return (
    <Screen style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>Forgot password?</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Enter your email and we will send you a link to reset your password.
      </Text>
      <Input
        placeholder={strings.auth.email}
        value={email}
        onChangeText={(v) => { setEmail(v); if (error) setError(null); }}
        keyboardType="email-address"
        autoCapitalize="none"
        error={error ?? undefined}
      />
      {error ? <Text style={[styles.formError, { color: c.error }]}>{error}</Text> : null}
      <Button title={loading ? 'Sending...' : 'Send reset link'} onPress={handleSubmit} disabled={loading} style={styles.btn} />
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backWrap}>
        <Text style={[styles.backText, { color: c.primary }]}>Back to Login</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  title: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.body, marginBottom: spacing.xl },
  formError: { ...typography.caption, marginBottom: spacing.sm },
  btn: { marginTop: spacing.md },
  backWrap: { marginTop: spacing.lg, alignSelf: 'center' },
  backText: { ...typography.bodySmall, fontWeight: '600' },
});
