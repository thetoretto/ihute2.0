import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import * as theme from '../utils/theme';
import { useResponsiveThemeContext } from '../context/ResponsiveThemeContext';
import { useThemeColors } from '../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'agency' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  style,
  textStyle,
  disabled = false,
}: ButtonProps) {
  const responsive = useResponsiveThemeContext();
  const c = useThemeColors();
  const spacing = responsive?.spacing ?? theme.spacing;
  const typography = responsive?.typography ?? theme.typography;
  const buttonHeights = responsive?.buttonHeights ?? theme.buttonHeights;
  const radii = responsive?.radii ?? theme.radii;

  const variantStyles: Record<NonNullable<ButtonProps['variant']>, ViewStyle> = {
    primary: {
      backgroundColor: c.buttonPrimaryBg,
      borderWidth: 1,
      borderColor: c.primaryButtonBorder,
    },
    secondary: {
      backgroundColor: c.buttonSecondaryBg,
      borderWidth: 2,
      borderColor: c.textMuted,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: c.primaryButtonBorder,
    },
    ghost: {
      backgroundColor: c.ghostBg,
      borderWidth: 1,
      borderColor: c.ghostBorder,
    },
    agency: {
      backgroundColor: c.agency,
      borderWidth: 1,
      borderColor: 'rgba(99,102,241,0.5)',
    },
    danger: {
      backgroundColor: c.accent,
      borderWidth: 0,
      borderColor: 'transparent',
    },
  };
  const textColor =
    variant === 'primary'
      ? c.buttonPrimaryText
      : variant === 'secondary'
        ? c.buttonSecondaryText
        : variant === 'outline'
          ? c.primary
          : variant === 'ghost'
            ? c.ghostText
            : variant === 'agency'
              ? '#FFFFFF'
              : variant === 'danger'
                ? '#FFFFFF'
                : c.text;
  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          minHeight: buttonHeights[size],
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: radii.button,
        },
        variantStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text
        style={[
          { ...typography.body, fontWeight: '600' as const, color: textColor },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
