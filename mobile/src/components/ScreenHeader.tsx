import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { spacing, typography } from '../utils/theme';
import { headerIconSize } from '../utils/layout';
import { sharedStyles } from '../utils/sharedStyles';

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
        sharedStyles.header,
        {
          backgroundColor: c.card,
          borderBottomColor: c.borderLight,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: spacing.md,
        },
        style,
      ]}
    >
      <View style={sharedStyles.headerSide}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[sharedStyles.headerIconBtn, { backgroundColor: c.background || c.ghostBg }]}
            hitSlop={spacing.sm}
          >
            <Ionicons name="chevron-back" size={headerIconSize} color={c.text} />
          </TouchableOpacity>
        ) : (
          <View style={sharedStyles.headerSideSpacer} />
        )}
      </View>
      <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={sharedStyles.headerSide}>{rightAction ?? <View style={sharedStyles.headerSideSpacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
});
