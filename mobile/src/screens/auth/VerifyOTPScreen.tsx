import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Button, Screen } from '../../components';
import { colors, spacing, typography, radii } from '../../utils/theme';

type Params = {
  VerifyOTP: { phoneOrEmail: string; isEmail: boolean };
};

export default function VerifyOTPScreen() {
  const route = useRoute<RouteProp<Params, 'VerifyOTP'>>();
  const { phoneOrEmail = '', isEmail = false } = route.params ?? {};
  const { verifyOtpAndRegister, sendOtp } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    const trimmed = code.trim().replace(/\s/g, '');
    if (trimmed.length < 4) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyOtpAndRegister(phoneOrEmail, trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid or expired code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendLoading(true);
    try {
      await sendOtp(phoneOrEmail);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  const channel = isEmail ? 'email' : 'phone';
  return (
    <Screen
      scroll
      style={styles.scroll}
      contentContainerStyle={styles.container}
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <Text style={styles.title}>Verify code</Text>
      <Text style={styles.hint}>
        We sent a 6-digit code to your {channel}. Enter it below. For testing, use code: 123456
      </Text>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>Code</Text>
        <TextInput
          style={styles.input}
          placeholder="000000"
          placeholderTextColor={colors.textMuted}
          value={code}
          onChangeText={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); if (error) setError(null); }}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <Button
        title={loading ? 'Verifying...' : 'Verify'}
        onPress={handleVerify}
        disabled={loading}
      />
      <TouchableOpacity
        style={styles.resendBtn}
        onPress={handleResend}
        disabled={resendLoading}
      >
        <Text style={styles.resendText}>
          {resendLoading ? 'Sending...' : 'Resend OTP'}
        </Text>
      </TouchableOpacity>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
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
    letterSpacing: 4,
  },
  formError: { ...typography.caption, color: colors.error, marginBottom: spacing.md },
  resendBtn: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
  resendText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
});
