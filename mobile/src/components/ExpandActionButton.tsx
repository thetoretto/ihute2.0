import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buttonHeights, colors, radii, spacing, typography } from '../utils/theme';

interface ExpandActionButtonProps {
  expanded: boolean;
  onPress: () => void;
}

export default function ExpandActionButton({ expanded, onPress }: ExpandActionButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Hide details' : 'Expand details'}
    >
      <Ionicons
        name={expanded ? 'remove-circle-outline' : 'add-circle-outline'}
        size={14}
        color={colors.onPrimary}
      />
      <Text style={styles.text}>{expanded ? 'Hide' : 'Expand'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: buttonHeights.small,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryButtonBorder,
  },
  text: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: '600',
  },
});
