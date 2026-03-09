import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, typography } from '../../utils/theme';

export default function TermsOfServiceScreen() {
  const c = useThemeColors();
  return (
    <Screen scroll style={[styles.container, { backgroundColor: c.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.text }]}>Terms of Service</Text>
      <Text style={[styles.body, { color: c.textSecondary }]}>
        By using iHute you agree to these terms. Use of the service is subject to your compliance with these terms and applicable law. You are responsible for the accuracy of information you provide. We may update these terms from time to time. For support, contact us via the Hotline in Profile.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.lg },
  body: { ...typography.body, lineHeight: 24 },
});
