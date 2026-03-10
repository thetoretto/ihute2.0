import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, radii, cardShadow } from '../utils/theme';
import { useThemeColors } from '../context/ThemeContext';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = 'document-text-outline', title, subtitle }: EmptyStateProps) {
  const c = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: c.card, borderColor: c.borderLight }, cardShadow]}>
      <Ionicons name={icon} size={40} color={c.textMuted} />
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: c.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  title: {
    ...typography.h3,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
