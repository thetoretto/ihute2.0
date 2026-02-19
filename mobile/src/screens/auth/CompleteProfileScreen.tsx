import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button, Screen } from '../../components';
import { colors, spacing, typography, radii } from '../../utils/theme';
import { selectorStyles } from '../../utils/selectorStyles';
import type { UserRole } from '../../types';

export default function CompleteProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name === 'Guest' ? '' : (user?.name ?? ''));
  const [role, setRole] = useState<UserRole>(user?.roles?.[0] ?? 'passenger');
  const [rolePickerVisible, setRolePickerVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPhoneOnlySignup = !!user?.email.startsWith('phone-');

  const handleComplete = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    if (isPhoneOnlySignup) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        setError('Email is required.');
        return;
      }
      if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
        setError('Enter a valid email address.');
        return;
      }
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updateProfile({
        name: trimmedName,
        role,
        ...(isPhoneOnlySignup ? { email: email.trim().toLowerCase() } : {}),
        ...(!isPhoneOnlySignup && phone.trim() ? { phone: phone.trim() } : {}),
        password,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile.');
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
      <Text style={styles.title}>Complete your profile</Text>
      <Text style={styles.hint}>
        Set your name and how you’ll use the app. You need a password to sign in later.
      </Text>

      <View style={styles.card}>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={(v) => { setName(v); if (error) setError(null); }}
          />
        </View>
        <View style={[styles.inputRow, styles.inputRowBorder]}>
          <Text style={styles.inputLabel}>I want to</Text>
          <TouchableOpacity
            style={selectorStyles.trigger}
            onPress={() => setRolePickerVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={selectorStyles.triggerText}>
              {role === 'passenger' ? 'Travel' : role === 'driver' ? 'Drive' : 'Run an agency'}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {isPhoneOnlySignup ? (
          <View style={[styles.inputRow, styles.inputRowBorder]}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(v) => { setEmail(v); if (error) setError(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        ) : (
          <View style={[styles.inputRow, styles.inputRowBorder]}>
            <Text style={styles.inputLabel}>Phone (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +250 123 456 789"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={(v) => setPhone(v)}
              keyboardType="phone-pad"
            />
          </View>
        )}

        <View style={[styles.inputRow, styles.inputRowBorder]}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={(v) => { setPassword(v); if (error) setError(null); }}
            secureTextEntry
          />
        </View>
        <View style={[styles.inputRow, styles.inputRowBorder]}>
          <Text style={styles.inputLabel}>Confirm password</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat password"
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); if (error) setError(null); }}
            secureTextEntry
          />
        </View>
      </View>

      <Modal visible={rolePickerVisible} animationType="slide" transparent>
        <View style={selectorStyles.overlay}>
          <View style={selectorStyles.sheet}>
            <TouchableOpacity
              style={selectorStyles.optionRow}
              onPress={() => { setRole('passenger'); setRolePickerVisible(false); }}
            >
              <Text style={selectorStyles.optionPrimary}>Travel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={selectorStyles.optionRow}
              onPress={() => { setRole('driver'); setRolePickerVisible(false); }}
            >
              <Text style={selectorStyles.optionPrimary}>Drive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={selectorStyles.optionRow}
              onPress={() => { setRole('agency'); setRolePickerVisible(false); }}
            >
              <Text style={selectorStyles.optionPrimary}>Run an agency</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={selectorStyles.closeButton}
              onPress={() => setRolePickerVisible(false)}
            >
              <Text style={selectorStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <Button
        title={loading ? 'Saving...' : 'Complete'}
        onPress={handleComplete}
        disabled={loading}
      />
      <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
        <Text style={styles.logoutText}>Log out</Text>
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
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  inputRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inputRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.xs,
    minHeight: 40,
  },
  chevron: { ...typography.body, color: colors.textSecondary },
  formError: { ...typography.caption, color: colors.error, marginBottom: spacing.md },
  logoutBtn: {
    marginTop: spacing.xl,
    alignSelf: 'center',
  },
  logoutText: { ...typography.bodySmall, color: colors.textSecondary },
});
