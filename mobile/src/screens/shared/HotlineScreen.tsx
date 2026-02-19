import React from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';

const HOTLINE_NUMBER = '+123456789';

export default function HotlineScreen() {
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
    <Screen style={styles.container}>
      <Ionicons name="call" size={64} color={colors.primary} />
      <Text style={styles.title}>Need help?</Text>
      <Text style={styles.subtitle}>
        Call our hotline for support
      </Text>
      <Text style={styles.hours}>Available daily: 06:00 - 22:00</Text>
      <Text style={styles.number}>{HOTLINE_NUMBER}</Text>
      <Button title={calling ? 'Opening dialer...' : 'Call'} onPress={() => void call()} disabled={calling} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { ...typography.h1, color: colors.text, marginTop: spacing.lg },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  hours: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  number: {
    ...typography.h2,
    color: colors.primaryTextOnLight,
    marginVertical: spacing.xl,
  },
});
