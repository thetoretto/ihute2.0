import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getPendingOtp } from '../../services/mockPersistence';
import { Button, Screen } from '../../components';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';

function normalizeOtpKey(phoneOrEmail: string): string {
  const t = phoneOrEmail.trim();
  return t.includes('@') ? t.toLowerCase() : t;
}

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { sendOtp } = useAuth();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentCode, setSentCode] = useState<string | null>(null);

  const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
  const phoneOrEmail = value.trim();
  const isEmail = mode === 'email';

  const handleSendOtp = async () => {
    if (!phoneOrEmail) {
      setError(isEmail ? 'Enter your email.' : 'Enter your phone number.');
      return;
    }
    if (isEmail && !isValidEmail(phoneOrEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setSentCode(null);
    setLoading(true);
    try {
      await sendOtp(phoneOrEmail);
      const key = normalizeOtpKey(phoneOrEmail);
      const pending = await getPendingOtp(key);
      if (pending) setSentCode(pending.code);
      navigation.navigate('VerifyOTP', { phoneOrEmail, isEmail: mode === 'email' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      scroll
      style={styles.scroll}
      contentContainerStyle={styles.container}
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.hint}>
        Enter your phone number or email. We’ll send you a code to verify. Then complete your profile in the app.
      </Text>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'phone' && styles.modeBtnActive]}
          onPress={() => { setMode('phone'); setError(null); setSentCode(null); }}
        >
          <Text style={[styles.modeText, mode === 'phone' && styles.modeTextActive]}>Phone</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'email' && styles.modeBtnActive]}
          onPress={() => { setMode('email'); setError(null); setSentCode(null); }}
        >
          <Text style={[styles.modeText, mode === 'email' && styles.modeTextActive]}>Email</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>{isEmail ? 'Email' : 'Phone number'}</Text>
        <TextInput
          style={styles.input}
          placeholder={isEmail ? 'you@example.com' : 'e.g. +250 123 456 789'}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={(v) => { setValue(v); if (error) setError(null); }}
          keyboardType={isEmail ? 'email-address' : 'phone-pad'}
          autoCapitalize="none"
        />
      </View>

      {sentCode ? (
        <Text style={styles.devCode}>For testing, your code is: {sentCode}</Text>
      ) : null}

      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <Button
        title={loading ? 'Sending...' : 'Send OTP'}
        onPress={handleSendOtp}
        disabled={loading}
      />
      <View style={styles.loginLink}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity style={styles.loginPill} onPress={() => navigation.goBack()}>
          <Text style={styles.loginHighlight}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingTop: spacing.lg },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
  hint: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modeBtn: {
    flex: 1,
    minHeight: buttonHeights.medium,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  modeText: { ...typography.bodySmall, color: colors.textSecondary },
  modeTextActive: { color: colors.primary, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  devCode: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  formError: { ...typography.caption, color: colors.error, marginBottom: spacing.md },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  loginText: { ...typography.body, color: colors.textSecondary },
  loginHighlight: { color: colors.onPrimary, fontWeight: '600' },
  loginPill: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
