import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors, spacing, radii, typography } from '../utils/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type ExpansionTone = 'passenger' | 'driver';

export interface ExpansionRow {
  icon: IconName;
  label: string;
  value: string;
}

interface ExpansionDetailsCardProps {
  tone: ExpansionTone;
  title: string;
  rows: ExpansionRow[];
}

export default function ExpansionDetailsCard({
  tone,
  title,
  rows,
}: ExpansionDetailsCardProps) {
  const toneColor = tone === 'driver' ? colors.success : colors.primary;
  const toneBg = tone === 'driver' ? colors.successTint : colors.primaryTint;

  return (
    <View style={styles.container}>
      <View style={[styles.headerBadge, { backgroundColor: toneBg, borderColor: toneColor }]}>
        <Ionicons
          name={tone === 'driver' ? 'speedometer' : 'person'}
          size={13}
          color={toneColor}
        />
        <Text style={[styles.headerTitle, { color: toneColor }]}>{title}</Text>
      </View>

      {rows.map((row) => (
        <View key={`${row.label}-${row.value}`} style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: toneBg }]}>
            <Ionicons name={row.icon} size={13} color={toneColor} />
          </View>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceElevated,
    gap: spacing.sm,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  headerTitle: {
    ...typography.caption,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
});
