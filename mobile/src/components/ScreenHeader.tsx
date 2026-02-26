import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { spacing, typography } from '../utils/theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function ScreenHeader({ title, onBack, rightAction, style }: ScreenHeaderProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: c.card,
          borderBottomColor: c.borderLight,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: spacing.md,
        },
        style,
      ]}
    >
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: c.background || c.ghostBg }]} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={c.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.sideSpacer} />
        )}
      </View>
      <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>{rightAction ?? <View style={styles.sideSpacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  side: {
    minWidth: 44,
    alignItems: 'flex-start',
  },
  sideSpacer: { width: 44, height: 44 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.bodySmall,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
});
