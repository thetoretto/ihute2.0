import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { spacing, typography } from '../utils/theme';
import { useThemeColors } from '../context/ThemeContext';

export default function OfflineBanner() {
  const c = useThemeColors();
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: c.error }]}>
      <Text style={[styles.text, { color: c.text }]}>No connection. Some features may be limited.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
