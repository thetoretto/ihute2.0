import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useThemeColors } from '../context/ThemeContext';
import { spacing, radii, cardShadow } from '../utils/theme';
import { cardRadius } from '../utils/layout';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof spacing | number;
  variant?: 'elevated' | 'outlined';
}

export default function Card({
  children,
  style,
  padding = 'md',
  variant = 'outlined',
}: CardProps) {
  const c = useThemeColors();
  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: c.card,
          borderColor: c.cardBorder ?? c.borderLight,
          padding: paddingValue,
          borderRadius: cardRadius ?? radii.lg,
        },
        variant === 'elevated' && cardShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
});
