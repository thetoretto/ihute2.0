import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, typography, radii, cardShadow } from '../../utils/theme';

const items = [
  { q: 'How do I book a trip?', a: 'Tap Find trips, choose a ride, select seats and confirm with your payment method.' },
  { q: 'How do I cancel a booking?', a: 'Open Activities, tap the booking and choose Cancel. Refunds follow our policy.' },
  { q: 'How do I pay?', a: 'Add a card or Mobile Money in Profile > Linked accounts. Choose your method at checkout.' },
  { q: 'Who do I contact for help?', a: 'Use the Hotline in Profile or the dispute option on your ticket.' },
];

export default function FAQScreen() {
  const c = useThemeColors();
  return (
    <Screen scroll style={[styles.container, { backgroundColor: c.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.text }]}>FAQ</Text>
      {items.map((item, i) => (
        <View key={i} style={[styles.card, { backgroundColor: c.card, borderColor: c.borderLight }, cardShadow]}>
          <Text style={[styles.question, { color: c.text }]}>{item.q}</Text>
          <Text style={[styles.answer, { color: c.textSecondary }]}>{item.a}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.lg },
  card: { padding: spacing.md, borderRadius: radii.md, borderWidth: 1, marginBottom: spacing.sm },
  question: { ...typography.body, fontWeight: '600', marginBottom: spacing.xs },
  answer: { ...typography.bodySmall },
});
