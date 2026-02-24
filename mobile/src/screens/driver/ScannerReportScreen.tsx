import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { getScannerTicketReport } from '../../services/api';
import type { ScannerTicketReportItem } from '../../services/api';
import { colors, spacing, typography, radii } from '../../utils/theme';

type Period = 'past' | 'today' | 'upcoming';

export default function ScannerReportScreen() {
  const [period, setPeriod] = useState<Period>('today');
  const [items, setItems] = useState<ScannerTicketReportItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await getScannerTicketReport(period);
    setItems(list);
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen scroll={false} style={styles.container}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>Ticket report</Text>
        <Text style={styles.reportSubtitle}>Past, today & upcoming tickets for your shift</Text>
      </View>
      <View style={styles.segmentRow}>
        {(['past', 'today', 'upcoming'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.segmentBtn, period === p && styles.segmentBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.segmentText, period === p && styles.segmentTextActive]}>
              {p === 'past' ? 'Past' : p === 'today' ? 'Today' : 'Upcoming'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="ticket-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No tickets for this period.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.route}>{item.route}</Text>
              <Text style={styles.passenger}>{item.passengerName}</Text>
              <Text style={styles.time}>{item.departureTime}</Text>
            </View>
            <View style={[styles.statusBadge, item.status === 'scanned' && styles.statusScanned, item.status === 'cancelled' && styles.statusCancelled]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            {item.scannedAt ? (
              <Text style={styles.scannedAt}>
                Scanned {new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  reportHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  reportTitle: { ...typography.h3, color: colors.text },
  reportSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  segmentRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  segmentBtnActive: {
    borderColor: colors.primaryButtonBorder,
    backgroundColor: colors.primary,
  },
  segmentText: { ...typography.bodySmall, color: colors.textSecondary },
  segmentTextActive: { color: colors.onPrimary, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  row: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowMain: {},
  route: { ...typography.body, color: colors.text, fontWeight: '600' },
  passenger: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  time: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryTint,
  },
  statusScanned: { backgroundColor: colors.successTint },
  statusCancelled: { backgroundColor: 'rgba(223, 8, 39, 0.12)' },
  statusText: { ...typography.caption, color: colors.text, fontWeight: '600', textTransform: 'capitalize' },
  scannedAt: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
