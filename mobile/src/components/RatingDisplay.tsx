import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../utils/theme';

interface RatingDisplayProps {
  rating?: number | null;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  placeholder?: string;
}

export function formatRatingValue(rating?: number | null, fallback = '0.0') {
  return rating == null ? fallback : rating.toFixed(1);
}

export default function RatingDisplay({
  rating,
  style,
  textStyle,
  placeholder = 'N/A',
}: RatingDisplayProps) {
  const value = rating == null ? placeholder : formatRatingValue(rating);

  return (
    <View style={[styles.row, style]}>
      <Ionicons name={rating == null ? 'star-outline' : 'star'} size={14} color={colors.primary} />
      <Text style={[styles.text, textStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
