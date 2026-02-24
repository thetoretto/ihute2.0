import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Divider, Screen } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, typography, radii } from '../../utils/theme';
import { getMockStore, updateMockStore } from '../../services/api';
import { strings } from '../../constants/strings';

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
  themeColors: ReturnType<typeof useThemeColors>;
}

function ToggleRow({ label, description, value, onChange, themeColors }: ToggleRowProps) {
  return (
    <View style={[styles.row, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <View style={styles.textWrap}>
        <Text style={[styles.rowTitle, { color: themeColors.text }]}>{label}</Text>
        <Text style={[styles.rowSub, { color: themeColors.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: themeColors.border, true: themeColors.primaryTint }}
        thumbColor={value ? themeColors.primary : themeColors.textSecondary}
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const themeColors = useThemeColors();
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
    <Screen scroll style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: themeColors.text }]}>{strings.profile.notifications}</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>{strings.profile.notificationsSubtitle}</Text>
      <Divider marginVertical={0} style={[styles.dividerTop, { backgroundColor: themeColors.border }]} />
      <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>{strings.profile.trips}</Text>
      <ToggleRow
        label={strings.profile.tripUpdates}
        description={strings.profile.tripUpdatesDesc}
        value={tripUpdates}
        onChange={setTripUpdates}
        themeColors={themeColors}
      />
      <Divider marginVertical={spacing.sm} />
      <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>{strings.profile.messages}</Text>
      <ToggleRow
        label={strings.profile.messages}
        description={strings.profile.messageAlertsDesc}
        value={messageAlerts}
        onChange={setMessageAlerts}
        themeColors={themeColors}
      />
      <Divider marginVertical={spacing.sm} />
      <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>{strings.profile.promotions}</Text>
      <ToggleRow
        label={strings.profile.promotions}
        description={strings.profile.promotionsDesc}
        value={promo}
        onChange={setPromo}
        themeColors={themeColors}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2 },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg },
  dividerTop: { marginVertical: 0, marginBottom: spacing.sm },
  sectionLabel: { ...typography.caption, marginTop: spacing.xs, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  textWrap: { flex: 1 },
  rowTitle: { ...typography.body },
  rowSub: { ...typography.caption, marginTop: spacing.xs },
});
