import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { getScannerTicketReport } from '../../services/api';
import type { ScannerTicketReportItem } from '../../services/api';
import { spacing, typography, radii } from '../../utils/theme';
import { useThemeColors } from '../../context/ThemeContext';
import { landingHeaderPaddingHorizontal, tightGap } from '../../utils/layout';

type Period = 'past' | 'today' | 'upcoming';

export default function ScannerReportScreen() {
  const c = useThemeColors();
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
    <Screen scroll={false} style={[styles.container, { paddingHorizontal: 0 }]}>
      <View style={[styles.reportHeader, { borderBottomColor: c.border, backgroundColor: c.surface }]}>
        <Text style={[styles.reportTitle, { color: c.text }]}>Ticket report</Text>
        <Text style={[styles.reportSubtitle, { color: c.textSecondary }]}>Past, today & upcoming tickets for your shift</Text>
      </View>
      <View style={[styles.segmentRow, { borderBottomColor: c.border, backgroundColor: c.surface }]}>
        {(['past', 'today', 'upcoming'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.segmentBtn,
              { backgroundColor: c.surface, borderColor: c.border },
              period === p && { borderColor: c.primaryButtonBorder, backgroundColor: c.primary },
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.segmentText, { color: c.textSecondary }, period === p && { color: c.onPrimary, fontWeight: '600' }]}>
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
            colors={[c.primary]}
            tintColor={c.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="ticket-outline" size={40} color={c.textMuted} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>No tickets for this period.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.rowMain}>
              <Text style={[styles.route, { color: c.text }]}>{item.route}</Text>
              <Text style={[styles.passenger, { color: c.textSecondary }]}>{item.passengerName}</Text>
              <Text style={[styles.time, { color: c.textMuted }]}>{item.departureTime}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: c.primaryTint },
                item.status === 'scanned' && { backgroundColor: c.successTint },
                item.status === 'cancelled' && { backgroundColor: c.errorTint },
              ]}
            >
              <Text style={[styles.statusText, { color: c.text }]}>{item.status}</Text>
            </View>
            {item.scannedAt ? (
              <Text style={[styles.scannedAt, { color: c.textMuted }]}>
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
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  reportTitle: { ...typography.h3 },
  reportSubtitle: { ...typography.caption, marginTop: spacing.xs },
  segmentRow: {
    flexDirection: 'row',
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    borderWidth: 1,
    alignItems: 'center',
  },
  segmentText: { ...typography.bodySmall },
  list: { flex: 1 },
  listContent: { padding: landingHeaderPaddingHorizontal, paddingBottom: spacing.xl },
  row: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  rowMain: {},
  route: { ...typography.body, fontWeight: '600' },
  passenger: { ...typography.bodySmall, marginTop: spacing.xs },
  time: { ...typography.caption, marginTop: spacing.xs },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: tightGap,
    borderRadius: radii.sm,
  },
  statusText: { ...typography.caption, fontWeight: '600', textTransform: 'capitalize' },
  scannedAt: { ...typography.caption, marginTop: spacing.xs },
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { ...typography.body, marginTop: spacing.sm },
});
