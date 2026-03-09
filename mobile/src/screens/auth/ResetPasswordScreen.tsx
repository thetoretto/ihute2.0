import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Input, Button, Screen } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { resetPassword } from '../../services/api';
import { spacing, typography } from '../../utils/theme';
import { strings } from '../../constants/strings';

type Params = { ResetPassword: { email?: string; token?: string } };

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Params, 'ResetPassword'>>();
  const c = useThemeColors();
  const email = route.params?.email ?? route.params?.token ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('Enter a new password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    const tokenOrEmail = email.trim() || password; // fallback for param
    if (!tokenOrEmail) {
      setError('Reset link expired. Please request a new one.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(tokenOrEmail, password.trim());
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Screen style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.text }]}>Password updated</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>You can now sign in with your new password.</Text>
        <Button title="Back to Login" onPress={() => navigation.navigate('Login')} style={styles.btn} />
      </Screen>
    );
  }

  return (
    <Screen style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>Reset password</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>Enter your new password below.</Text>
        <Input
        placeholder="New password"
        value={password}
        onChangeText={(v) => { setPassword(v); if (error) setError(null); }}
        secureTextEntry
      />
        <Input
        placeholder="Confirm password"
        value={confirm}
        onChangeText={(v) => { setConfirm(v); if (error) setError(null); }}
        secureTextEntry
      />
      {error ? <Text style={[styles.formError, { color: c.error }]}>{error}</Text> : null}
      <Button title={loading ? 'Saving...' : 'Reset password'} onPress={handleSubmit} disabled={loading} style={styles.btn} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  title: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.body, marginBottom: spacing.xl },
  formError: { ...typography.caption, marginBottom: spacing.sm },
  btn: { marginTop: spacing.md },
});
