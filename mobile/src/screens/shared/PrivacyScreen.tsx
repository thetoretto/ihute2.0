import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { colors, spacing, typography, radii } from '../../utils/theme';

const actions = [
  {
    id: 'privacy-1',
    title: 'Account visibility',
    subtitle: 'Control how your profile appears to other users.',
    icon: 'eye-outline' as const,
  },
  {
    id: 'privacy-2',
    title: 'Data export',
    subtitle: 'Download your account data and trip history.',
    icon: 'download-outline' as const,
  },
  {
    id: 'privacy-3',
    title: 'Delete account',
    subtitle: 'Remove your profile and personal data from this mock app.',
    icon: 'trash-outline' as const,
  },
];

export default function PrivacyScreen() {
  const [isExporting, setIsExporting] = React.useState(false);

  const onActionPress = (id: string, title: string) => {
    if (id === 'privacy-2') {
      Alert.alert('Export data', 'Generate and download your mock data package?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            setIsExporting(true);
            setTimeout(() => {
              setIsExporting(false);
              Alert.alert('Export ready', 'Mock data export completed.');
            }, 900);
          },
        },
      ]);
      return;
    }
    if (id === 'privacy-3') {
      Alert.alert('Delete account', 'This mock action is irreversible. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account deleted', 'Mock delete completed.') },
      ]);
      return;
    }
    Alert.alert(title, `Mock flow: ${title.toLowerCase()}.`);
  };

  return (
    <Screen scroll style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy</Text>
      <Text style={styles.subtitle}>Security and data controls for your account.</Text>
      {isExporting ? <Text style={styles.exportInfo}>Preparing export...</Text> : null}

      {actions.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => onActionPress(item.id, item.title)}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={item.id === 'privacy-3' ? colors.error : colors.primary}
          />
          <View style={styles.textWrap}>
            <Text style={[styles.cardTitle, item.id === 'privacy-3' && styles.dangerText]}>{item.title}</Text>
            <Text style={styles.cardSub}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  exportInfo: { ...typography.caption, color: colors.primaryTextOnLight, marginBottom: spacing.sm },
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
  dangerText: { color: colors.error },
});
