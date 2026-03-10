import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getDriverActivityLog } from '../../services/api';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, typography, radii, cardShadow } from '../../utils/theme';
import type { ActivityLogEntry, ActivityLogEntryKind } from '../../types';

function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function kindToIcon(kind: ActivityLogEntryKind): string {
  switch (kind) {
    case 'trip_created': return 'car-outline';
    case 'booking_created': return 'person-add-outline';
    case 'payment_confirmed': return 'card-outline';
    case 'ticket_scanned': return 'scan-outline';
    case 'car_full': return 'people-outline';
    case 'trip_cancelled': return 'close-circle-outline';
    case 'booking_cancelled': return 'person-remove-outline';
    case 'trip_completed': return 'checkmark-circle-outline';
    case 'withdrawal_requested':
    case 'withdrawal_completed':
    case 'withdrawal_failed': return 'wallet-outline';
    case 'account_updated': return 'person-outline';
    default: return 'ellipse-outline';
  }
}

export default function ActivitiesFeedScreen() {
  const { user } = useAuth();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setError(null);
    try {
      const data = await getDriverActivityLog(user.id);
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const renderItem = useCallback(({ item }: { item: ActivityLogEntry }) => {
    const statusKey = item.kind === 'trip_completed' || item.kind === 'payment_confirmed' ? 'statusCompleted'
      : item.kind === 'trip_cancelled' || item.kind === 'booking_cancelled' || item.kind === 'withdrawal_failed' ? 'statusCanceled'
      : item.kind === 'ticket_scanned' ? 'statusInProgress'
      : 'statusPending';
    const iconColor = c[statusKey] as string;
    return (
      <View style={[styles.item, { backgroundColor: c.card, borderColor: c.borderLight }, cardShadow]}>
        <View style={[styles.iconWrap, { backgroundColor: (c[`${statusKey}Tint` as keyof typeof c] as string) || c.primaryTint }]}>
          <Ionicons name={kindToIcon(item.kind)} size={22} color={iconColor} />
        </View>
        <View style={styles.itemBody}>
          <Text style={[styles.itemTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
          {item.subtitle ? (
            <Text style={[styles.itemSubtitle, { color: c.textMuted }]} numberOfLines={1}>{item.subtitle}</Text>
          ) : null}
        </View>
        <Text style={[styles.itemTime, { color: c.textMuted }]}>{formatActivityTime(item.timestamp)}</Text>
      </View>
    );
  }, [c]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.appBackground }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <Screen scroll={false} style={[styles.container, { backgroundColor: c.appBackground }]}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingTop: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.listHeaderTitle, { color: c.text }]}>Recent activity</Text>
            <Text style={[styles.listHeaderSub, { color: c.textMuted }]}>Timeline of your trips and bookings</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyWrap, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            <Ionicons name="pulse-outline" size={40} color={c.textMuted} />
            <Text style={[styles.emptyText, { color: c.textMuted }]}>No activities yet</Text>
            <Text style={[styles.emptySub, { color: c.textMuted }]}>Trips and bookings will appear here</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />
        }
      />
      {error ? (
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: spacing.lg },
  listHeader: { marginBottom: spacing.lg },
  listHeaderTitle: { ...typography.h3, marginBottom: spacing.xxs },
  listHeaderSub: { ...typography.caption },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  iconWrap: { width: 44, height: 44, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: { ...typography.body, fontWeight: '600' },
  itemSubtitle: { ...typography.caption, marginTop: 2 },
  itemTime: { ...typography.caption, marginLeft: spacing.sm },
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, borderRadius: radii.lg, borderWidth: 1 },
  emptyText: { ...typography.body, marginTop: spacing.md },
  emptySub: { ...typography.caption, marginTop: spacing.xs },
  errorWrap: { padding: spacing.md, alignItems: 'center' },
  errorText: { ...typography.bodySmall },
});
