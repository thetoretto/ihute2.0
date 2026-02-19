import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { spacing } from '../utils/theme';
import { useThemeColors } from '../context/ThemeContext';

interface DividerProps {
  style?: StyleProp<ViewStyle>;
  marginVertical?: number;
}

export default function Divider({ style, marginVertical }: DividerProps) {
  const c = useThemeColors();
  return (
    <View
      style={[
        styles.line,
        { backgroundColor: c.border },
        marginVertical !== undefined && {
          marginVertical,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    height: 1,
    marginVertical: spacing.sm,
  },
});