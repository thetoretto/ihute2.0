import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Constants from 'expo-constants';
import { Screen } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, typography } from '../../utils/theme';

export default function AboutScreen() {
  const c = useThemeColors();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <Screen scroll style={[styles.container, { backgroundColor: c.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.text }]}>iHute</Text>
      <Text style={[styles.version, { color: c.textSecondary }]}>Version {version}</Text>
      <Text style={[styles.body, { color: c.textSecondary }]}>
        Travel together. Find trips, book seats, and manage your rides in one place.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.xs },
  version: { ...typography.caption, marginBottom: spacing.lg },
  body: { ...typography.body },
});
