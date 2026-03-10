import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { getWithdrawalMethods, updateWithdrawalMethods } from '../../services/api';
import { spacing, typography, radii, cardShadow } from '../../utils/theme';
import { strings } from '../../constants/strings';

export default function WithdrawalMethodsScreen() {
  const { user } = useAuth();
  const themeColors = useThemeColors();
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
    <Screen scroll style={[styles.container, { backgroundColor: themeColors.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: themeColors.text }]}>{strings.profile.withdrawalMethods}</Text>
      <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{strings.profile.withdrawalSubtitle}</Text>

      <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Mobile Money</Text>
      <Text style={[styles.hint, { color: themeColors.textMuted }]}>For payouts, your registered account phone number will be used as the withdrawal reference.</Text>
      <View style={[styles.inputWrap, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }, cardShadow]}>
        <Ionicons name="phone-portrait-outline" size={20} color={themeColors.primary} />
        <TextInput
          style={[styles.input, { color: themeColors.text }]}
          placeholder="e.g. +250 788 123 456"
          placeholderTextColor={themeColors.textMuted}
          value={mobileMoneyPhone}
          onChangeText={setMobileMoneyPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
      </View>

      <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Bank transfer</Text>
      <View style={[styles.inputWrap, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }, cardShadow]}>
        <Ionicons name="business-outline" size={20} color={themeColors.primary} />
        <TextInput
          style={[styles.input, { color: themeColors.text }]}
          placeholder="Bank name"
          placeholderTextColor={themeColors.textMuted}
          value={bankName}
          onChangeText={setBankName}
          autoCapitalize="words"
        />
      </View>
      <View style={[styles.inputWrap, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }, cardShadow]}>
        <Ionicons name="card-outline" size={20} color={themeColors.primary} />
        <TextInput
          style={[styles.input, { color: themeColors.text }]}
          placeholder="Account number"
          placeholderTextColor={themeColors.textMuted}
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="numeric"
          autoCapitalize="none"
        />
      </View>
      <View style={[styles.inputWrap, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }, cardShadow]}>
        <Ionicons name="person-outline" size={20} color={themeColors.primary} />
        <TextInput
          style={[styles.input, { color: themeColors.text }]}
          placeholder="Account holder name (optional)"
          placeholderTextColor={themeColors.textMuted}
          value={accountName}
          onChangeText={setAccountName}
          autoCapitalize="words"
        />
      </View>

      <Button title={saving ? strings.profile.saving : strings.profile.save} onPress={handleSave} disabled={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.lg },
  hint: { ...typography.caption, marginBottom: spacing.sm },
  sectionLabel: { ...typography.overline, marginTop: spacing.sm, marginBottom: spacing.xs },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  input: { flex: 1, ...typography.body },
});
