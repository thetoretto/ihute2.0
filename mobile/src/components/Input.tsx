import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';
import * as theme from '../utils/theme';
import { useResponsiveThemeContext } from '../context/ResponsiveThemeContext';
import { useThemeColors } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Input({ label, error, style, ...props }: InputProps) {
  const responsive = useResponsiveThemeContext();
  const c = useThemeColors();
  const spacing = responsive?.spacing ?? theme.spacing;
  const typography = responsive?.typography ?? theme.typography;
  const buttonHeights = responsive?.buttonHeights ?? theme.buttonHeights;
  const radii = responsive?.radii ?? theme.radii;

  const containerStyle = { marginBottom: spacing.md };
  const labelStyle = {
    ...typography.bodySmall,
    color: c.textSecondary,
    marginBottom: spacing.xs,
  };
  const inputStyle = {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radii.button,
    minHeight: Math.max(44, buttonHeights.large),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: c.text,
  };
  const errorTextStyle = {
    ...typography.caption,
    color: c.error,
    marginTop: spacing.xs,
  };

  return (
    <View style={containerStyle}>
      {label ? <Text style={labelStyle}>{label}</Text> : null}
      <TextInput
        style={[inputStyle, error && { borderColor: c.error }, style]}
        placeholderTextColor={c.textMuted}
        {...props}
      />
      {error ? <Text style={errorTextStyle}>{error}</Text> : null}
    </View>
  );
}
