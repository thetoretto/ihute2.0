import React, { useState, useCallback, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { useRootNavigation } from '../../context/RootNavigationContext';
import { getDriverTripActivities, getDriverActivityLog } from '../../services/api';
import {
  Card,
  EmptyState,
  Screen,
  Button,
  CarRefreshIndicator,
} from '../../components';
import { useTabbedList } from '../../hooks/useTabbedList';
import { colors, spacing, typography, radii } from '../../utils/theme';
import { listBottomPaddingDefault } from '../../utils/layout';
import { useThemeColors } from '../../context/ThemeContext';
import type { DriverTripActivity, ActivityLogEntry, ActivityLogEntryKind } from '../../types';

const TABS = [
  { key: 'all' as const, label: 'All' },
  { key: 'upcoming' as const, label: 'Upcoming' },
  { key: 'completed' as const, label: 'Completed' },
  { key: 'log' as const, label: 'Log' },
];

function formatTimeAgo(departureTime: string): string {
  return departureTime || '—';
}

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

export default function DriverMyRidesScreen() {
  const navigation = useNavigation<any>();
  const { rootNavigate } = useRootNavigation();
  const { user } = useAuth();
  const { agencySubRole } = useRole();
  const c = useThemeColors();
  const isScanner = user?.agencySubRole === 'agency_scanner' || agencySubRole === 'agency_scanner';
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'done'>('idle');
  const [isIncomeVisible, setIsIncomeVisible] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!user) return [];
    return getDriverTripActivities(user.id);
  }, [user?.id]);

  const tabbed = useTabbedList({
    tabs: TABS,
    initialTab: 'all',
    fetchData: fetchActivities,
    filterByTab: (a, t) =>
      t === 'log' ? false : t === 'all' || (t === 'upcoming' && a.trip.status === 'active') || (t === 'completed' && a.trip.status === 'completed'),
    deps: [user?.id],
  });

  const { tab, setTab, list, error: loadError, refreshing, refresh } = tabbed;

  const [logEntries, setLogEntries] = useState<ActivityLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const fetchLog = useCallback(async () => {
    if (!user?.id) return;
    setLogError(null);
    setLogLoading(true);
    try {
      const data = await getDriverActivityLog(user.id);
      setLogEntries(data);
    } catch (e) {
      setLogError(e instanceof Error ? e.message : 'Failed to load activity log');
    } finally {
      setLogLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (tab === 'log') void fetchLog();
  }, [tab, fetchLog]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'All Activities',
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Options',
              undefined,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: isIncomeVisible ? 'Hide income' : 'View income',
                  onPress: () => {
                    setIsIncomeVisible((v) => !v);
                    setTimeout(() => refresh(), 100);
                  },
                },
                !isScanner
                  ? {
                      text: 'Scan ticket',
                      onPress: () => navigation.navigate('DriverScanTicket'),
                    }
                  : undefined,
              ].filter(Boolean) as { text: string; style?: 'cancel'; onPress?: () => void }[]
            );
          }}
          style={headerBtnStyle}
          hitSlop={12}
        >
          <Ionicons name="filter-outline" size={20} color={c.dark} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, c.dark, isIncomeVisible, isScanner, refresh]);

  useFocusEffect(
    useCallback(() => {
      setTab('all');
      void refresh();
    }, [setTab, refresh])
  );

  const onRefresh = async () => {
    setRefreshState('refreshing');
    await refresh();
    setRefreshState('done');
    setTimeout(() => setRefreshState('idle'), 240);
  };

  const maskAmount = (value: number) =>
    isIncomeVisible ? `+${Number(value).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF` : '••••••';

  const getActivityIcon = (item: DriverTripActivity) => {
    const isComplete = item.trip.status === 'completed';
    return (
      <View style={[styles.iconBox, { backgroundColor: isComplete ? colors.successTint : c.primaryTint }]}>
        <Ionicons
          name={isComplete ? 'checkmark-circle' : 'car'}
          size={20}
          color={isComplete ? colors.success : c.primary}
        />
      </View>
    );
  };

  const onCardPress = (item: DriverTripActivity) => {
    navigation.navigate('DriverScanTicket');
  };

  const getLogIcon = (kind: ActivityLogEntryKind) => {
    const map: Record<ActivityLogEntryKind, { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string }> = {
      trip_created: { icon: 'car', bg: colors.primaryTint, color: colors.primary },
      booking_created: { icon: 'person-add', bg: colors.primaryTint, color: colors.primary },
      ticket_scanned: { icon: 'checkmark-circle', bg: colors.successTint, color: colors.success },
      car_full: { icon: 'people', bg: colors.primaryTint, color: colors.primary },
      trip_cancelled: { icon: 'close-circle', bg: colors.errorTint, color: colors.error },
      booking_cancelled: { icon: 'close-circle', bg: colors.errorTint, color: colors.error },
      trip_completed: { icon: 'checkmark-done', bg: colors.successTint, color: colors.success },
    };
    const { icon, bg, color } = map[kind];
    return (
      <View style={[styles.iconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
    );
  };

  const renderLogTab = () => {
    if (logLoading && logEntries.length === 0) {
      return (
        <View style={styles.logLoadingWrap}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.logLoadingText, { color: c.textSecondary }]}>Loading activity log…</Text>
        </View>
      );
    }
    if (logError && logEntries.length === 0) {
      return (
        <View style={[styles.errorBanner, { backgroundColor: c.surfaceElevated, borderColor: c.error }]}>
          <Text style={[styles.errorText, { color: c.error }]}>{logError}</Text>
          <Button title="Retry" onPress={() => void fetchLog()} />
        </View>
      );
    }
    if (logEntries.length === 0) {
      return (
        <EmptyState
          title="No activity yet"
          subtitle="Trip and booking events will appear here."
        />
      );
    }
    return (
      <FlatList
        data={logEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, styles.logListContent, { paddingBottom: listBottomPaddingDefault + 72 }]}
        refreshControl={
          <RefreshControl
            refreshing={logLoading}
            onRefresh={() => void fetchLog()}
            colors={[c.primary]}
            tintColor={c.primary}
            progressBackgroundColor={c.surface}
          />
        }
        overScrollMode="always"
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Activity log</Text>
        }
        renderItem={({ item }) => (
          <Card variant="outlined" padding="md" style={styles.logCard}>
            <View style={styles.logRow}>
              {getLogIcon(item.kind)}
              <View style={styles.logBody}>
                <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={[styles.cardDesc, { color: c.textSecondary }]} numberOfLines={1}>{item.subtitle}</Text>
                ) : null}
                <Text style={[styles.cardTime, { color: c.textMuted }]}>{formatLogTime(item.timestamp)}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    );
  };

  return (
    <Screen style={[styles.container, { backgroundColor: c.background }]}>
      {loadError ? (
        <View style={[styles.errorBanner, { backgroundColor: c.surfaceElevated, borderColor: c.error }]}>
          <Text style={[styles.errorText, { color: c.error }]}>{loadError}</Text>
          <Button title="Retry" onPress={() => void refresh()} />
        </View>
      ) : null}

      {/* Pill tabs - reference style */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        style={styles.tabsWrapper}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[
              styles.tabPill,
              { backgroundColor: tab === t.key ? c.dark : c.card, borderColor: c.border },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabPillText,
                { color: tab === t.key ? c.primary : c.textSecondary },
                tab === t.key && styles.tabPillTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tab === 'log' ? (
        renderLogTab()
      ) : list.length === 0 ? (
        <EmptyState
          title={tab === 'upcoming' ? 'No upcoming rides' : tab === 'completed' ? 'No completed rides' : 'No activities yet'}
          subtitle="Publish a ride to get started."
        />
      ) : (
        <FlatList
          key={tab}
          data={list}
          keyExtractor={(item) => item.trip.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPaddingDefault + 72 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              colors={[c.primary]}
              tintColor={c.primary}
              progressBackgroundColor={c.surface}
            />
          }
          overScrollMode="always"
          bounces={false}
          alwaysBounceVertical={false}
          decelerationRate="fast"
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Today</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => onCardPress(item)}
              activeOpacity={0.7}
            >
              {getActivityIcon(item)}
              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
                    {item.trip.departureHotpoint?.name ?? '—'} → {item.trip.destinationHotpoint?.name ?? '—'}
                  </Text>
                  <Text style={[styles.cardAmount, { color: colors.success }]}>
                    {maskAmount(item.collectedAmount)}
                  </Text>
                </View>
                <Text style={[styles.cardDesc, { color: c.textSecondary }]}>
                  {item.bookedSeats} passengers • {item.trip.departureTime}
                </Text>
                <View style={styles.cardTimeRow}>
                  <Ionicons name="time-outline" size={12} color={c.textMuted} />
                  <Text style={[styles.cardTime, { color: c.textMuted }]}>
                    {formatTimeAgo(item.trip.departureTime)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} style={styles.chevron} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB - reference style */}
      {!isScanner && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: c.primary, bottom: listBottomPaddingDefault + 8 }]}
          onPress={() => {
            navigation.goBack();
            setTimeout(() => {
              rootNavigate('Main', { screen: 'DriverPublish', params: { screen: 'PublishRide' } });
            }, 100);
          }}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={26} color={c.onPrimary} />
        </TouchableOpacity>
      )}

      <CarRefreshIndicator state={refreshState} />
    </Screen>
  );
}

const headerBtnStyle = { padding: spacing.sm, marginRight: spacing.xs };

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsWrapper: { marginBottom: spacing.sm },
  tabsScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  tabPillText: { ...typography.bodySmall, fontWeight: '700' },
  tabPillTextActive: { fontWeight: '800' },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { ...typography.body, fontWeight: '700', flex: 1 },
  cardAmount: { ...typography.bodySmall, fontWeight: '800' },
  cardDesc: { ...typography.bodySmall, marginTop: 2 },
  cardTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  cardTime: { ...typography.caption, fontSize: 10, fontWeight: '600' },
  chevron: { marginLeft: spacing.xs },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  errorBanner: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  errorText: { ...typography.body },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logLoadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  logLoadingText: { ...typography.bodySmall },
  logListContent: { paddingTop: spacing.sm },
  logCard: { marginBottom: spacing.md },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logBody: { flex: 1, minWidth: 0, marginLeft: spacing.md },
});
