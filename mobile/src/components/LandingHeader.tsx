import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../context/ThemeContext';
import { typography, spacing } from '../utils/theme';
import { landingHeaderPaddingTop, landingHeaderPaddingHorizontal } from '../utils/layout';

interface LandingHeaderProps {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * No-bar display header for landing screens (Home, Profile, Travels).
 * Text sits on page background; asymmetric padding; left-aligned.
 */
export default function LandingHeader({ title, subtitle, style, contentContainerStyle }: LandingHeaderProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outer,
        {
          paddingTop: insets.top + landingHeaderPaddingTop,
          paddingBottom: spacing.md,
          paddingHorizontal: landingHeaderPaddingHorizontal,
        },
        style,
      ]}
    >
      <View style={[styles.content, contentContainerStyle]}>
        <Text style={[styles.title, { color: c.displayHeadlineColor ?? c.appPrimary }]} numberOfLines={3}>
          {title}
        </Text>
        {subtitle != null && subtitle !== '' ? (
          <Text style={[styles.subtitle, { color: c.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'stretch',
  },
  content: {
    alignSelf: 'stretch',
  },
  title: {
    ...typography.display,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
});
