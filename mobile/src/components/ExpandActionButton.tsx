import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { buttonHeights, radii, spacing, typography } from '../utils/theme';

interface ExpandActionButtonProps {
  expanded: boolean;
  onPress: () => void;
}

export default function ExpandActionButton({ expanded, onPress }: ExpandActionButtonProps) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: c.primary, borderColor: c.primaryButtonBorder }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Hide details' : 'Expand details'}
    >
      <Ionicons
        name={expanded ? 'remove-circle-outline' : 'add-circle-outline'}
        size={14}
        color={c.onPrimary}
      />
      <Text style={[styles.text, { color: c.onPrimary }]}>{expanded ? 'Hide' : 'Expand'}</Text>
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
    borderWidth: 1,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
