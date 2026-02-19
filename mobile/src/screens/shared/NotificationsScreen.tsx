import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Divider, Screen } from '../../components';
import { colors, spacing, typography, radii } from '../../utils/theme';
import { getMockStore, updateMockStore } from '../../services/mockPersistence';

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowSub}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primaryTint }}
        thumbColor={value ? colors.primary : colors.textSecondary}
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const [tripUpdates, setTripUpdates] = React.useState(true);
  const [messageAlerts, setMessageAlerts] = React.useState(true);
  const [promo, setPromo] = React.useState(false);

  React.useEffect(() => {
    const loadPrefs = async () => {
      const store = await getMockStore();
      if (store.notificationPrefs) {
        setTripUpdates(store.notificationPrefs.tripUpdates);
        setMessageAlerts(store.notificationPrefs.messageAlerts);
        setPromo(store.notificationPrefs.promotions);
      }
    };
    void loadPrefs();
  }, []);

  React.useEffect(() => {
    void updateMockStore({
      notificationPrefs: {
        tripUpdates,
        messageAlerts,
        promotions: promo,
      },
    });
  }, [messageAlerts, promo, tripUpdates]);

  return (
    <Screen scroll style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Choose which app updates you want to receive.</Text>
      <Divider marginVertical={0} style={styles.dividerTop} />
      <Text style={styles.sectionLabel}>Trips</Text>
      <ToggleRow
        label="Trip updates"
        description="Booking confirmations, departure reminders, and ride status."
        value={tripUpdates}
        onChange={setTripUpdates}
      />
      <Divider marginVertical={spacing.sm} />
      <Text style={styles.sectionLabel}>Messages</Text>
      <ToggleRow
        label="Messages"
        description="Alerts when drivers or passengers send a message."
        value={messageAlerts}
        onChange={setMessageAlerts}
      />
      <Divider marginVertical={spacing.sm} />
      <Text style={styles.sectionLabel}>Promotions</Text>
      <ToggleRow
        label="Promotions"
        description="Discounts and product announcements."
        value={promo}
        onChange={setPromo}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.popupSurface },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  dividerTop: { marginVertical: 0, marginBottom: spacing.sm },
  sectionLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  rowTitle: { ...typography.body, color: colors.text },
  rowSub: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
