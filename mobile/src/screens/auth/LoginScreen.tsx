import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Input, Button, Screen } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { colors, spacing, typography, radii, buttonHeights, sizes } from '../../utils/theme';
import { strings } from '../../constants/strings';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const c = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    if (!normalizedEmail || !normalizedPassword) {
      setError(strings.auth.emailPasswordRequired);
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setError(strings.auth.enterValidEmail);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(normalizedEmail, normalizedPassword);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isNetworkError =
        /network request failed|failed to fetch|could not connect|connection refused|timeout/i.test(msg) ||
        msg === 'Network Error';
      setError(
        isNetworkError
          ? 'Cannot reach server. Set EXPO_PUBLIC_API_BASE_URL in mobile/.env to your PC IP (run ipconfig for IPv4), e.g. http://192.168.1.105:3000, then restart Expo.'
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  const onSocialLogin = (provider: string) => {
    Alert.alert(
      strings.auth.comingSoon,
      strings.auth.socialSignInMessage(provider),
      [{ text: strings.common.ok }]
    );
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.brandWrap}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.appName, { color: c.text }]}>{strings.app.name}</Text>
        <Text style={[styles.appSlogan, { color: c.textSecondary }]}>{strings.app.slogan}</Text>
      </View>
      <Text style={[styles.title, { color: c.text }]}>{strings.auth.welcomeBack}</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>{strings.auth.signInContinue}</Text>
      <Text style={[styles.helper, { color: c.textMuted }]}>{strings.auth.helperAccounts}</Text>
      <Input
        placeholder={strings.auth.email}
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (error) setError(null);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        error={error?.toLowerCase().includes('email') ? error : undefined}
      />
      <Input
        placeholder={strings.auth.password}
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (error) setError(null);
        }}
        secureTextEntry
        error={error?.toLowerCase().includes('password') ? error : undefined}
      />
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
        <Text style={[styles.forgotText, { color: c.primary }]}>Forgot password?</Text>
      </TouchableOpacity>
      {error && !error.toLowerCase().includes('email') && !error.toLowerCase().includes('password') ? (
        <Text style={[styles.formError, { color: c.error }]}>{error}</Text>
      ) : null}
      <Button
        title={loading ? strings.auth.signingIn : strings.auth.signIn}
        onPress={handleLogin}
        disabled={loading}
      />
      <Text style={[styles.socialDivider, { color: c.textMuted }]}>{strings.auth.orSignInWith}</Text>
      <View style={styles.socialRow}>
        <TouchableOpacity
          style={[styles.socialBtn, { borderColor: c.border, backgroundColor: c.surface }]}
          onPress={() => onSocialLogin('Google')}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-google" size={22} color={c.text} />
          <Text style={[styles.socialBtnText, { color: c.text }]}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.socialBtn, { borderColor: c.border, backgroundColor: c.surface }]}
          onPress={() => onSocialLogin('Apple')}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-apple" size={22} color={c.text} />
          <Text style={[styles.socialBtnText, { color: c.text }]}>Apple</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.socialBtn, { borderColor: c.border, backgroundColor: c.surface }]}
          onPress={() => onSocialLogin('Facebook')}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-facebook" size={22} color={c.text} />
          <Text style={[styles.socialBtnText, { color: c.text }]}>Facebook</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.registerLink}>
        <Text style={[styles.registerText, { color: c.textSecondary }]}>Don't have an account? </Text>
        <TouchableOpacity
          style={[styles.registerPill, { backgroundColor: c.primary }]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.registerHighlight, { color: c.onPrimary }]}>Register</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: sizes.logo.width * 1.5,
    height: sizes.logo.height * 1.5,
    marginBottom: spacing.xs,
  },
  appName: {
    ...typography.h1,
    letterSpacing: 0.8,
    textTransform: 'lowercase',
  },
  appSlogan: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  helper: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  formError: { ...typography.caption, color: colors.error, marginBottom: spacing.md },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: spacing.sm },
  forgotText: { ...typography.caption, fontWeight: '600' },
  socialDivider: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: buttonHeights.medium,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  socialBtnText: { ...typography.bodySmall, color: colors.text, fontWeight: '500' },
  registerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  registerText: { ...typography.body, color: colors.textSecondary },
  registerHighlight: { color: colors.onPrimary, fontWeight: '600' },
  registerPill: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
