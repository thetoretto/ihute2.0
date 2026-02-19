import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getDriverActivitySummary } from '../../services/mockApi';
import { colors, spacing, radii, typography } from '../../utils/theme';

interface Summary {
  doneCount: number;
  activeCount: number;
  bookingsCount: number;
  remainingSeats: number;
  income: number;
}

export default function DriverActivityDetailsScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    try {
      const data = await getDriverActivitySummary(user.id);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (!summary && loading) {
    return (
      <Screen style={styles.container}>
        <Text style={styles.loading}>Loading activity details...</Text>
      </Screen>
    );
  }

  if (!summary) {
    return (
      <Screen style={styles.container}>
        <Text style={styles.loading}>No activity summary yet.</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => void load()}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  const cards = [
    { icon: 'checkmark-done-circle-outline', label: 'Done trips', value: `${summary.doneCount}` },
    { icon: 'flash-outline', label: 'Active trips', value: `${summary.activeCount}` },
    { icon: 'people-outline', label: 'Bookings', value: `${summary.bookingsCount}` },
    { icon: 'car-outline', label: 'Seats left', value: `${summary.remainingSeats}` },
    { icon: 'cash-outline', label: 'Income', value: `${Number(summary.income).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF` },
  ];

  return (
    <Screen scroll style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Driver activity details</Text>
          <Text style={styles.subtitle}>Live mock metrics from your current trips</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => void load()}>
          <Text style={styles.refreshBtnText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.label} style={styles.card}>
            <Ionicons name={card.icon as any} size={18} color={colors.primary} />
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg },
  loading: { ...typography.body, color: colors.textSecondary },
  refreshBtn: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  refreshBtnText: { ...typography.caption, color: colors.primaryTextOnLight, fontWeight: '600' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    minHeight: 120,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  cardValue: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  cardLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
