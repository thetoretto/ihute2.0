import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../utils/theme';
import type { PaymentMethod } from '../types';

const PAYMENT_ICONS: Record<PaymentMethod, keyof typeof Ionicons.glyphMap> = {
  cash: 'cash-outline',
  mobile_money: 'phone-portrait-outline',
  card: 'card-outline',
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  card: 'Card',
};

interface PaymentMethodIconsProps {
  methods: PaymentMethod[];
  selected?: PaymentMethod | PaymentMethod[] | null;
  onSelect?: (method: PaymentMethod) => void;
  multiSelect?: boolean;
}

export default function PaymentMethodIcons({
  methods,
  selected,
  onSelect,
  multiSelect = false,
}: PaymentMethodIconsProps) {
  return (
    <View style={styles.container}>
      {methods.map((method) => {
        const isSelected = multiSelect
          ? (Array.isArray(selected) ? (selected as PaymentMethod[]).includes(method) : false)
          : selected === method;
        return (
          <TouchableOpacity
            key={method}
            style={[styles.iconWrapper, isSelected && styles.iconSelected]}
            onPress={() => onSelect?.(method)}
            disabled={!onSelect}
          >
            <Ionicons
              name={PAYMENT_ICONS[method]}
              size={24}
              color={isSelected ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {PAYMENT_LABELS[method]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  iconWrapper: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    minWidth: 70,
  },
  iconSelected: {
    backgroundColor: colors.surface,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  labelSelected: {
    color: colors.primaryTextOnLight,
  },
});
