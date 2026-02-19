import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getWithdrawalMethods, updateWithdrawalMethods } from '../../services/mockPersistence';
import { colors, spacing, typography, radii } from '../../utils/theme';

export default function WithdrawalMethodsScreen() {
  const { user } = useAuth();
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getWithdrawalMethods(user.id).then((methods) => {
      setMobileMoneyPhone(methods.mobileMoney?.phone ?? '');
      setBankName(methods.bankTransfer?.bankName ?? '');
      setAccountNumber(methods.bankTransfer?.accountNumber ?? '');
      setAccountName(methods.bankTransfer?.accountName ?? '');
    });
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await updateWithdrawalMethods(user.id, {
        mobileMoney: mobileMoneyPhone.trim() ? { phone: mobileMoneyPhone.trim() } : undefined,
        bankTransfer:
          bankName.trim() || accountNumber.trim()
            ? { bankName: bankName.trim(), accountNumber: accountNumber.trim(), accountName: accountName.trim() || undefined }
            : undefined,
      });
      Alert.alert('Saved', 'Your withdrawal methods have been updated.');
    } catch {
      Alert.alert('Error', 'Could not save withdrawal methods.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Withdrawal methods</Text>
      <Text style={styles.subtitle}>
        Link your Mobile Money or bank account to receive payouts from your trips.
      </Text>

      <Text style={styles.sectionLabel}>Mobile Money</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
        <TextInput
          style={styles.input}
          placeholder="e.g. +250 788 123 456"
          placeholderTextColor={colors.textMuted}
          value={mobileMoneyPhone}
          onChangeText={setMobileMoneyPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.sectionLabel}>Bank transfer</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="business-outline" size={20} color={colors.primary} />
        <TextInput
          style={styles.input}
          placeholder="Bank name"
          placeholderTextColor={colors.textMuted}
          value={bankName}
          onChangeText={setBankName}
          autoCapitalize="words"
        />
      </View>
      <View style={styles.inputWrap}>
        <Ionicons name="card-outline" size={20} color={colors.primary} />
        <TextInput
          style={styles.input}
          placeholder="Account number"
          placeholderTextColor={colors.textMuted}
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="numeric"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputWrap}>
        <Ionicons name="person-outline" size={20} color={colors.primary} />
        <TextInput
          style={styles.input}
          placeholder="Account holder name (optional)"
          placeholderTextColor={colors.textMuted}
          value={accountName}
          onChangeText={setAccountName}
          autoCapitalize="words"
        />
      </View>

      <Button title={saving ? 'Saving...' : 'Save'} onPress={handleSave} disabled={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  sectionLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  input: { flex: 1, ...typography.body, color: colors.text },
});
