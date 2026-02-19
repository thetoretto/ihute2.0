import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '../../components';
import { colors, spacing, typography, radii } from '../../utils/theme';

const mockMethods = [
  { id: 'pm-1', label: 'Mobile Money', detail: 'Connected', icon: 'phone-portrait-outline' as const },
  { id: 'pm-2', label: 'Visa Card', detail: '**** 8842', icon: 'card-outline' as const },
  { id: 'pm-3', label: 'Cash', detail: 'Pay at pickup', icon: 'cash-outline' as const },
];

export default function PaymentMethodsScreen() {
  const [methods, setMethods] = React.useState(mockMethods);
  const [defaultMethodId, setDefaultMethodId] = React.useState('pm-1');

  return (
    <Screen scroll style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Linked accounts</Text>
      <Text style={styles.subtitle}>Manage how payments are handled in the app.</Text>

      {methods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={styles.card}
          onPress={() =>
            Alert.alert(method.label, `Mock settings for ${method.label}.`, [
              {
                text: defaultMethodId === method.id ? 'Default selected' : 'Set default',
                onPress: () => setDefaultMethodId(method.id),
              },
              {
                text: 'Disconnect',
                style: 'destructive',
                onPress: () => {
                  setMethods((prev) => prev.filter((item) => item.id !== method.id));
                },
              },
              { text: 'Close', style: 'cancel' },
            ])
          }
        >
          <Ionicons name={method.icon} size={20} color={colors.primary} />
          <View style={styles.textWrap}>
            <Text style={styles.cardTitle}>{method.label}</Text>
            <Text style={styles.cardSub}>
              {method.detail}
              {defaultMethodId === method.id ? ' • Default' : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}

      <Button
        title="Add payment method"
        onPress={() => Alert.alert('Add method', 'Mock flow: add a new payment method.')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  textWrap: { flex: 1 },
  cardTitle: { ...typography.body, color: colors.text },
  cardSub: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
