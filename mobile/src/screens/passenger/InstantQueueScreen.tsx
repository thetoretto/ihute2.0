import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, HotpointPicker } from '../../components';
import { getInstantQueue, getHotpoints } from '../../services/api';
import { useThemeColors } from '../../context/ThemeContext';
import { colors, spacing, typography } from '../../utils/theme';
import { listBottomPaddingTab } from '../../utils/layout';
import type { DriverInstantQueueEntry, Hotpoint } from '../../types';

function formatRwf(value: number) {
  return `${Number(value).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF`;
}

export default function InstantQueueScreen() {
  const navigation = useNavigation<any>();
  const c = useThemeColors();
  const [entries, setEntries] = useState<DriverInstantQueueEntry[]>([]);
  const [hotpoints, setHotpoints] = useState<Hotpoint[]>([]);
  const [fromFilter, setFromFilter] = useState<Hotpoint | null>(null);
  const [toFilter, setToFilter] = useState<Hotpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHotpoints = useCallback(() => {
    getHotpoints().then(setHotpoints);
  }, []);

  const loadQueue = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const params: { fromId?: string; toId?: string } = {};
    if (fromFilter?.id) params.fromId = fromFilter.id;
    if (toFilter?.id) params.toId = toFilter.id;
    const list = await getInstantQueue(params);
    setEntries(list);
    if (showLoading) setLoading(false);
  }, [fromFilter?.id, toFilter?.id]);

  useEffect(() => {
    loadHotpoints();
  }, [loadHotpoints]);

  useEffect(() => {
    void loadQueue(true);
  }, [loadQueue]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueue(false);
    setRefreshing(false);
  };

  return (
    <Screen
      scroll={false}
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: listBottomPaddingTab }]}
    >
      <View style={[styles.filterSection, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.filterLabel, { color: c.textSecondary }]}>Filter by destination (optional)</Text>
        <View style={[styles.pickerRow, { borderBottomColor: c.border }]}>
          <Text style={[styles.pickerLabel, { color: c.textSecondary }]}>To</Text>
          <HotpointPicker
            value={toFilter}
            hotpoints={hotpoints}
            onSelect={setToFilter}
            placeholder="Any destination"
            triggerStyle={[styles.pickerTrigger, { borderBottomColor: c.border }]}
          />
        </View>
        <View style={[styles.pickerRow, { borderBottomColor: c.border }]}>
          <Text style={[styles.pickerLabel, { color: c.textSecondary }]}>From</Text>
          <HotpointPicker
            value={fromFilter}
            hotpoints={hotpoints}
            onSelect={setFromFilter}
            placeholder="Any origin"
            triggerStyle={[styles.pickerTrigger, { borderBottomColor: c.border }]}
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Drivers available now</Text>
      {loading ? (
        <Text style={[styles.empty, { color: c.textSecondary }]}>Loading…</Text>
      ) : entries.length === 0 ? (
        <Text style={[styles.empty, { color: c.textSecondary }]}>
          No drivers in drive mode match your filters. Try changing or clearing filters.
        </Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.driver?.id ?? String(Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[c.primary]}
              tintColor={c.primary}
            />
          }
          renderItem={({ item }) => (
            <View style={[styles.entryCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.entryRoute}>
                <View style={styles.entryRouteRow}>
                  <View style={[styles.entryDot, { backgroundColor: c.primary }]} />
                  <Text style={[styles.entryPlace, { color: c.text }]} numberOfLines={1}>
                    {item.from?.name ?? '—'}
                  </Text>
                </View>
                <View style={[styles.entryLine, { backgroundColor: c.border }]} />
                <View style={styles.entryRouteRow}>
                  <View style={[styles.entryDotDest, { backgroundColor: c.primary }]} />
                  <Text style={[styles.entryPlace, { color: c.text }]} numberOfLines={1}>
                    {item.to?.name ?? '—'}
                  </Text>
                </View>
              </View>
              <View style={styles.entryMeta}>
                <Text style={[styles.entryDriver, { color: c.textSecondary }]}>
                  {item.driver?.name ?? 'Driver'}
                </Text>
                <Text style={[styles.entrySeats, { color: c.textSecondary }]}>
                  {item.seatsAvailable} seats • {formatRwf(item.pricePerSeat)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1 },
  filterSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterLabel: { ...typography.caption, marginBottom: spacing.sm },
  pickerRow: { marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1 },
  pickerLabel: { ...typography.caption, marginBottom: spacing.xs },
  pickerTrigger: { borderBottomWidth: 1, paddingVertical: spacing.sm },
  sectionTitle: { ...typography.h3, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  entryCard: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  entryRoute: { marginBottom: spacing.sm },
  entryRouteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  entryDot: { width: 10, height: 10, borderRadius: 5 },
  entryDotDest: { width: 10, height: 10, borderRadius: 5 },
  entryLine: { width: 2, height: 12, marginLeft: 4, marginVertical: 2 },
  entryPlace: { ...typography.body, flex: 1 },
  entryMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryDriver: { ...typography.caption },
  entrySeats: { ...typography.caption },
  empty: { ...typography.body, textAlign: 'center', marginHorizontal: spacing.lg, marginTop: spacing.lg },
});
