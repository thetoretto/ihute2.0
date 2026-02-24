import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { getPaymentMethods, removePaymentMethod, setDefaultPaymentMethod, addPaymentMethod } from '../../services/api';
import type { PaymentMethodItem } from '../../services/api';
import { spacing, typography, radii } from '../../utils/theme';
import { strings } from '../../constants/strings';

const iconByType: Record<string, 'phone-portrait-outline' | 'card-outline' | 'cash-outline'> = {
  mobile_money: 'phone-portrait-outline',
  card: 'card-outline',
  cash: 'cash-outline',
};

const mockMethods: PaymentMethodItem[] = [
  { id: 'pm-1', type: 'mobile_money', label: 'Mobile Money', detail: 'Connected', isDefault: true },
  { id: 'pm-2', type: 'card', label: 'Visa Card', detail: '**** 8842', isDefault: false },
  { id: 'pm-3', type: 'cash', label: 'Cash', detail: 'Pay at pickup', isDefault: false },
];

export default function PaymentMethodsScreen() {
  const { user } = useAuth();
  const themeColors = useThemeColors();
  const [methods, setMethods] = useState<PaymentMethodItem[]>(mockMethods);
  const [defaultMethodId, setDefaultMethodId] = useState<string | null>('pm-1');

  useEffect(() => {
    if (user?.id) {
      getPaymentMethods(user.id)
        .then((list) => {
          if (list.length) {
            setMethods(list);
            const d = list.find((m) => m.isDefault);
            setDefaultMethodId(d?.id ?? list[0]?.id ?? null);
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  const handleSetDefault = (methodId: string) => {
    if (!user?.id) return;
    setDefaultPaymentMethod(user.id, methodId).then(() => setDefaultMethodId(methodId)).catch(() => {});
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === methodId })));
  };

  const handleRemove = (methodId: string) => {
    if (!user?.id) return;
    removePaymentMethod(user.id, methodId).then(() => {
      setMethods((prev) => {
        const next = prev.filter((m) => m.id !== methodId);
        if (defaultMethodId === methodId) setDefaultMethodId(next[0]?.id ?? null);
        return next;
      });
    }).catch(() => {});
  };

  const handleAdd = () => {
    if (!user?.id) {
      Alert.alert('Add method', 'Mock flow: add a new payment method.');
      return;
    }
    Alert.alert(strings.profile.addPaymentMethod, 'Choose type', [
      { text: 'Mobile Money', onPress: () => addPaymentMethod(user.id, { type: 'mobile_money', label: 'Mobile Money' }).then(() => getPaymentMethods(user.id).then(setMethods)).catch(() => {}) },
      { text: 'Card', onPress: () => addPaymentMethod(user.id, { type: 'card', label: 'Card' }).then(() => getPaymentMethods(user.id).then(setMethods)).catch(() => {}) },
      { text: strings.common.cancel, style: 'cancel' },
    ]);
  };

  return (
    <Screen scroll style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: themeColors.text }]}>{strings.profile.linkedAccounts}</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>{strings.profile.linkedAccountsSubtitle}</Text>

      {methods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          onPress={() =>
            Alert.alert(method.label ?? method.type, `Settings for ${method.label ?? method.type}.`, [
              { text: defaultMethodId === method.id ? 'Default selected' : 'Set default', onPress: () => handleSetDefault(method.id) },
              { text: 'Disconnect', style: 'destructive', onPress: () => handleRemove(method.id) },
              { text: 'Close', style: 'cancel' },
            ])
          }
        >
          <Ionicons name={iconByType[method.type] ?? 'card-outline'} size={20} color={themeColors.primary} />
          <View style={styles.textWrap}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>{method.label ?? method.type}</Text>
            <Text style={[styles.cardSub, { color: themeColors.textSecondary }]}>
              {method.detail ?? ''}
              {defaultMethodId === method.id ? ' • Default' : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={themeColors.textSecondary} />
        </TouchableOpacity>
      ))}

      <Button title={strings.profile.addPaymentMethod} onPress={handleAdd} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2 },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  textWrap: { flex: 1 },
  cardTitle: { ...typography.body },
  cardSub: { ...typography.caption, marginTop: spacing.xs },
});
