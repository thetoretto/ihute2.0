import React, { useState, useEffect, useCallback } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { useRootNavigation } from '../../context/RootNavigationContext';
import { getPaymentMethods, removePaymentMethod, setDefaultPaymentMethod } from '../../services/api';
import type { PaymentMethodItem } from '../../services/api';
import { spacing, typography, radii } from '../../utils/theme';
import { strings } from '../../constants/strings';

const iconByType: Record<string, 'phone-portrait-outline' | 'card-outline' | 'cash-outline'> = {
  mobile_money: 'phone-portrait-outline',
  card: 'card-outline',
  cash: 'cash-outline',
};

export default function PaymentMethodsScreen() {
  const { user } = useAuth();
  const themeColors = useThemeColors();
  const { rootNavigate } = useRootNavigation();
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [defaultMethodId, setDefaultMethodId] = useState<string | null>(null);

  const loadMethods = useCallback(() => {
    if (!user?.id) return;
    getPaymentMethods(user.id)
      .then((list) => {
        setMethods(list);
        const d = list.find((m) => m.isDefault);
        setDefaultMethodId(d?.id ?? list[0]?.id ?? null);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => { loadMethods(); }, [loadMethods]);
  useFocusEffect(useCallback(() => { loadMethods(); }, [loadMethods]));

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

  const handleAddCard = () => rootNavigate('AddCard');
  const handleAddMobileMoney = () => rootNavigate('AddMobileMoney');

  return (
    <Screen scroll style={[styles.container, { backgroundColor: themeColors.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: themeColors.text }]}>{strings.profile.linkedAccounts}</Text>
      <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{strings.profile.linkedAccountsSubtitle}</Text>

      {methods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}
          onPress={() =>
            Alert.alert(method.label ?? method.type, `Settings for ${method.label ?? method.type}.`, [
              { text: defaultMethodId === method.id ? 'Default selected' : 'Set default', onPress: () => handleSetDefault(method.id) },
              { text: 'Disconnect', style: 'destructive', onPress: () => handleRemove(method.id) },
              { text: 'Close', style: 'cancel' },
            ])
          }
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: themeColors.ghostBg }]}>
            <Ionicons name={iconByType[method.type] ?? 'card-outline'} size={20} color={themeColors.primary} />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>{method.label ?? method.type}</Text>
            <Text style={[styles.cardSub, { color: themeColors.textMuted }]}>
              {method.detail ?? ''}
              {defaultMethodId === method.id ? ' • Default' : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
        </TouchableOpacity>
      ))}

      <Button title="Add card" onPress={handleAddCard} style={styles.addBtn} />
      <Button title="Add Mobile Money" variant="outline" onPress={handleAddMobileMoney} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.smMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textWrap: { flex: 1 },
  cardTitle: { ...typography.body, fontWeight: '600' },
  cardSub: { ...typography.caption, marginTop: spacing.xxs },
  addBtn: { marginTop: spacing.md, marginBottom: spacing.sm },
});
