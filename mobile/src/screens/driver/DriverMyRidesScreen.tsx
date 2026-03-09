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
import { getDriverTripActivities } from '../../services/api';
import {
  EmptyState,
  Screen,
  Button,
  CarRefreshIndicator,
} from '../../components';
import { useTabbedList } from '../../hooks/useTabbedList';
import { spacing, typography, radii, sizes, borderWidths } from '../../utils/theme';
import { useThemeColors } from '../../context/ThemeContext';
import { useDriverTheme } from '../../context/DriverThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { strings } from '../../constants/strings';
import { driverContentHorizontal, listBottomPaddingTab } from '../../utils/layout';
import type { DriverTripActivity } from '../../types';

const TABS = [
  { key: 'recent' as const, label: 'Recent' },
  { key: 'scheduled' as const, label: 'Scheduled' },
  { key: 'monthly' as const, label: 'Monthly' },
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

  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  const tabbed = useTabbedList({
    tabs: TABS,
    initialTab: 'recent',
    fetchData: fetchActivities,
    filterByTab: (a, t) => {
      const tripTime = a.trip.departureTime ? new Date(a.trip.departureDate || new Date()).getTime() : 0;
      if (t === 'recent') return a.trip.status === 'completed' || (a.trip.status === 'active' && tripTime >= oneWeekAgo);
      if (t === 'scheduled') return a.trip.status === 'active';
      if (t === 'monthly') return tripTime >= startOfMonth;
      return true;
    },
    deps: [user?.id],
  });

  const { tab, setTab, list, data: allActivities, error: loadError, refreshing, refresh } = tabbed;
  const driver = useDriverTheme();
  const insets = useSafeAreaInsets();
  const d = driver.colors;

  const weekActivities = allActivities.filter((a) => {
    const depDate = (a.trip as { departureDate?: string })?.departureDate;
    const t = depDate ? new Date(depDate).getTime() : new Date().getTime();
    return t >= oneWeekAgo;
  });
  const weekEarnings = weekActivities.reduce((sum, a) => sum + (a.collectedAmount ?? 0), 0);
  const pointsPlaceholder = (weekEarnings / 50 >= 1000 ? (weekEarnings / 50000).toFixed(1) + 'k' : Math.round(weekEarnings / 50).toString());

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
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
      <View style={[styles.iconBox, { backgroundColor: isComplete ? c.successTint : c.primaryTint }]}>
        <Ionicons
          name={isComplete ? 'checkmark-circle' : 'car'}
          size={20}
          color={isComplete ? c.success : c.primary}
        />
      </View>
    );
  };

  const onCardPress = (item: DriverTripActivity) => {
    navigation.navigate('DriverScanTicket');
  };

  const getActivityStatus = (item: DriverTripActivity): 'EARNED' | 'PAID' | 'VOID' => {
    if (item.trip.status === 'cancelled') return 'VOID';
    if (item.trip.status === 'completed') return 'EARNED';
    return 'PAID';
  };

  return (
    <Screen style={[styles.container, { backgroundColor: c.appBackground }, { paddingHorizontal: 0 }]}>
      {loadError ? (
        <View style={[styles.errorBanner, { backgroundColor: c.surfaceElevated, borderColor: c.error }]}>
          <Text style={[styles.errorText, { color: c.error }]}>{loadError}</Text>
          <Button title="Retry" onPress={() => void refresh()} />
        </View>
      ) : null}

      {/* Activities header (mockup) */}
      <View style={[styles.activitiesHeader, { paddingTop: insets.top + spacing.lg, backgroundColor: d.card, borderBottomColor: c.border }]}>
        <View style={styles.activitiesHeaderRow}>
          <View>
            <Text style={[styles.activitiesTitle, { color: d.primary }]}>Activities</Text>
            <Text style={[styles.activitiesSubtitle, { color: c.textSecondary }]}>History and insights</Text>
          </View>
          <View style={[styles.activitiesHeaderIcon, { backgroundColor: c.ghostBg }]}>
            <Ionicons name="bar-chart-outline" size={20} color={c.textMuted} />
          </View>
        </View>
        <View style={styles.activitiesStatsRow}>
          <View style={[styles.activitiesStatCard, { backgroundColor: c.appSurfaceMuted, borderColor: c.border }]}>
            <Text style={[styles.activitiesStatLabel, { color: c.textSecondary }]}>This Week</Text>
            <Text style={[styles.activitiesStatValue, { color: d.primary }]}>{weekActivities.length} Trips</Text>
          </View>
          <View style={[styles.activitiesStatCard, { backgroundColor: c.appSurfaceMuted, borderColor: c.border }]}>
            <Text style={[styles.activitiesStatLabel, { color: c.textSecondary }]}>Earnings</Text>
            <Text style={[styles.activitiesStatValue, { color: d.instaGreen }]}>RWF {(weekEarnings / 1000).toFixed(0)}k</Text>
          </View>
          <View style={[styles.activitiesStatCard, { backgroundColor: c.appSurfaceMuted, borderColor: c.border }]}>
            <Text style={[styles.activitiesStatLabel, { color: c.textSecondary }]}>Points</Text>
            <Text style={[styles.activitiesStatValue, { color: c.warning }]}>{pointsPlaceholder}</Text>
          </View>
        </View>
      </View>

      {/* Tabs: Recent | Scheduled | Monthly */}
      <View style={[styles.tabsRow, { borderBottomColor: c.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabUnderline, tab === t.key && { borderBottomColor: d.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabUnderlineText, { color: tab === t.key ? d.primary : c.textMuted }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {list.length === 0 ? (
        <EmptyState
          title={tab === 'scheduled' ? 'No scheduled rides' : tab === 'monthly' ? 'No rides this month' : 'No activities yet'}
          subtitle="Publish a ride to get started."
        />
      ) : (
        <FlatList
          key={tab}
          data={list}
          keyExtractor={(item) => item.trip.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPaddingTab }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              colors={[d.primary]}
              tintColor={d.primary}
              progressBackgroundColor={c.surface}
            />
          }
          overScrollMode="always"
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={({ item }) => {
            const status = getActivityStatus(item);
            const isVoid = status === 'VOID';
            return (
              <TouchableOpacity
                style={[styles.activityCard, { backgroundColor: d.card, borderColor: c.border }, isVoid && { opacity: 0.7 }]}
                onPress={() => onCardPress(item)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.activityCardIcon,
                  { backgroundColor: status === 'EARNED' ? d.instaGreenTint : status === 'PAID' ? d.accentTint : c.ghostBg },
                ]}>
                  <Ionicons
                    name={status === 'VOID' ? 'close' : status === 'EARNED' ? 'checkmark' : 'time'}
                    size={24}
                    color={status === 'EARNED' ? d.instaGreen : status === 'PAID' ? d.accent : c.textMuted}
                  />
                </View>
                <View style={styles.activityCardBody}>
                  <View style={styles.activityCardRow}>
                    <Text style={[styles.activityCardTitle, { color: d.primary }]} numberOfLines={1}>
                      {item.trip.departureHotpoint?.name ?? '—'} → {item.trip.destinationHotpoint?.name ?? '—'}
                    </Text>
                    <Text style={[styles.activityCardAmount, { color: isVoid ? c.error : d.primary }]}>
                      RWF {isIncomeVisible ? Number(item.collectedAmount ?? 0).toLocaleString('en-RW', { maximumFractionDigits: 0 }) : '••••••'}
                    </Text>
                  </View>
                  <View style={styles.activityCardMeta}>
                    <Text style={[styles.activityCardMetaText, { color: c.textSecondary }]}>
                      {item.bookedSeats ?? 0} Passengers • {formatTimeAgo(item.trip.departureTime)}
                    </Text>
                    <View style={[
                      styles.activityCardPill,
                      status === 'EARNED' && { backgroundColor: d.instaGreenTint },
                      status === 'PAID' && { backgroundColor: d.accentTint },
                      status === 'VOID' && { backgroundColor: c.ghostBg },
                    ]}>
                      <Text style={[
                        styles.activityCardPillText,
                        status === 'EARNED' && { color: d.instaGreen },
                        status === 'PAID' && { color: d.accent },
                        status === 'VOID' && { color: c.textMuted },
                      ]}>
                        {status}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <CarRefreshIndicator state={refreshState} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRightBtn: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  tabsWrapper: { marginBottom: spacing.sm },
  tabsScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: driverContentHorizontal,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: driverContentHorizontal,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: borderWidths.thin,
  },
  tabPillText: { ...typography.bodySmall, fontWeight: '700' },
  tabPillTextActive: { fontWeight: '800' },
  sectionLabel: {
    ...typography.overline,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginHorizontal: driverContentHorizontal,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    marginBottom: spacing.md,
  },
  iconBox: {
    width: sizes.touchTarget.iconButton,
    height: sizes.touchTarget.iconButton,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { ...typography.body, fontWeight: '700', flex: 1 },
  cardAmount: { ...typography.bodySmall, fontWeight: '800' },
  cardDesc: { ...typography.bodySmall, marginTop: spacing.xs },
  cardTimeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  cardTime: { ...typography.caption10, fontWeight: '600' },
  chevron: { marginLeft: spacing.xs },
  listContent: { paddingHorizontal: driverContentHorizontal, paddingTop: spacing.md },
  errorBanner: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    gap: spacing.sm,
  },
  errorText: { ...typography.body },
  activitiesHeader: {
    paddingHorizontal: driverContentHorizontal,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  activitiesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  activitiesTitle: { ...typography.h1, fontSize: 28, fontWeight: '800', marginBottom: spacing.xs },
  activitiesSubtitle: { fontSize: 14 },
  activitiesHeaderIcon: { width: sizes.touchTarget.iconButton, height: sizes.touchTarget.iconButton, borderRadius: radii.smMedium, alignItems: 'center', justifyContent: 'center' },
  activitiesStatsRow: { flexDirection: 'row', gap: spacing.sm },
  activitiesStatCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  activitiesStatLabel: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', marginBottom: spacing.xxs },
  activitiesStatValue: { fontSize: 14, fontWeight: '800' },
  tabsRow: { flexDirection: 'row', paddingHorizontal: driverContentHorizontal, gap: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.sm, borderBottomWidth: 1 },
  tabUnderline: { paddingBottom: spacing.sm },
  tabUnderlineText: { fontSize: 14, fontWeight: '800' },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md + spacing.xs,
    marginBottom: spacing.md,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
  },
  activityCardIcon: {
    width: sizes.avatar.lg,
    height: sizes.avatar.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityCardBody: { flex: 1, minWidth: 0 },
  activityCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  activityCardTitle: { ...typography.bodySmall, fontWeight: '800' },
  activityCardAmount: { fontSize: 12, fontWeight: '800' },
  activityCardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.xs },
  activityCardMetaText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', flex: 1 },
  activityCardPill: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radii.xs },
  activityCardPillText: { fontSize: 8, fontWeight: '800' },
});
