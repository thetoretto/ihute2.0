import React from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, typography } from '../../utils/theme';
import { strings } from '../../constants/strings';

const HOTLINE_NUMBER = '+123456789';

export default function HotlineScreen() {
  const themeColors = useThemeColors();
  const [calling, setCalling] = React.useState(false);

  const call = async () => {
    try {
      setCalling(true);
      const url = `tel:${HOTLINE_NUMBER}`;
      const canCall = await Linking.canOpenURL(url);
      if (!canCall) {
        Alert.alert('Dialer unavailable', `Call manually at ${HOTLINE_NUMBER}.`);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Call failed', `Could not open dialer. Use ${HOTLINE_NUMBER}.`);
    } finally {
      setCalling(false);
    }
  };

  return (
    <Screen style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Ionicons name="call" size={64} color={themeColors.primary} />
      <Text style={[styles.title, { color: themeColors.text }]}>{strings.profile.hotlineNeedHelp}</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>{strings.profile.hotlineSubtitle}</Text>
      <Text style={[styles.hours, { color: themeColors.textMuted }]}>{strings.profile.hotlineHours}</Text>
      <Text style={[styles.number, { color: themeColors.text }]}>{HOTLINE_NUMBER}</Text>
      <Button title={calling ? strings.profile.hotlineOpening : strings.profile.hotlineCall} onPress={() => void call()} disabled={calling} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h1, marginTop: spacing.lg },
  subtitle: { ...typography.body, marginTop: spacing.sm, textAlign: 'center' },
  hours: { ...typography.caption, marginTop: spacing.xs },
  number: { ...typography.h2, marginVertical: spacing.xl },
});
