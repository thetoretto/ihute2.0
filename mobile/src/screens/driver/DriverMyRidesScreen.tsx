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
import { getDriverTripActivities, cancelDriverTrip } from '../../services/api';
import {
  EmptyState,
  Screen,
  Button,
  CarRefreshIndicator,
} from '../../components';
import { useTabbedList } from '../../hooks/useTabbedList';
import { spacing, typography, radii, sizes, borderWidths, cardShadow } from '../../utils/theme';
import { useThemeColors } from '../../context/ThemeContext';
import { useDriverTheme } from '../../context/DriverThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { strings } from '../../constants/strings';
import { landingHeaderPaddingHorizontal, listBottomPaddingTab } from '../../utils/layout';
import { getTripStatusLabel } from '../../components/RideCard';
import { getStatusColorKey, getStatusTintKey } from '../../utils/theme';
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
  const { currentRole, agencySubRole } = useRole();
  const c = useThemeColors();
  const isScanner = user?.agencySubRole === 'agency_scanner' || agencySubRole === 'agency_scanner';
  const isAgency = currentRole === 'agency';
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
      if (t === 'recent') return a.trip.status === 'completed' || (a.trip.status === 'active' && tripTime >= oneWeekAgo) || (a.trip.status === 'cancelled' && tripTime >= oneWeekAgo);
      if (t === 'scheduled') return a.trip.status === 'active' || a.trip.status === 'full';
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

  const getStatusLabel = (item: DriverTripActivity) =>
    getTripStatusLabel(item.trip.status, item.bookedSeats > 0);

  const canCancelTrip = (item: DriverTripActivity): boolean => {
    if (item.trip.status !== 'active' && item.trip.status !== 'full') return false;
    if ((item.bookedSeats ?? 0) > 0) return false;
    const depDate = (item.trip as { departureDate?: string }).departureDate || new Date().toISOString().slice(0, 10);
    const depMs = new Date(depDate + 'T' + (item.trip.departureTime || '00:00')).getTime();
    return depMs - Date.now() >= 60 * 60 * 1000;
  };

  const handleCancelTrip = (item: DriverTripActivity) => {
    if (!user?.id) return;
    Alert.alert(
      'Cancel trip',
      'Are you sure you want to cancel this trip?',
      [
        { text: 'Keep trip', style: 'cancel' },
        {
          text: 'Cancel trip',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelDriverTrip(item.trip.id, user.id);
              void refresh();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not cancel trip');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen contentInset={false} style={[styles.container, { backgroundColor: c.appBackground }]}>
      {loadError ? (
        <View style={[styles.errorBanner, { backgroundColor: c.surfaceElevated, borderColor: c.error }]}>
          <Text style={[styles.errorText, { color: c.error }]}>{loadError}</Text>
          <Button title="Retry" onPress={() => void refresh()} />
        </View>
      ) : null}

      {/* My Rides header */}
      <View style={[styles.activitiesHeader, { paddingTop: insets.top + spacing.sm, backgroundColor: c.appBackground, borderBottomColor: c.borderLight }]}>
        <View style={styles.activitiesHeaderRow}>
          <View>
            <Text style={[styles.activitiesTitle, { color: c.text }]}>{strings.nav.myRides}</Text>
            <Text style={[styles.activitiesSubtitle, { color: c.textMuted }]}>History and insights</Text>
          </View>
          <View style={[styles.activitiesHeaderIcon, { backgroundColor: c.card, borderWidth: 1, borderColor: c.borderLight }]}>
            <Ionicons name="bar-chart-outline" size={20} color={c.primary} />
          </View>
        </View>
        <View style={styles.activitiesStatsRow}>
          <View style={[styles.activitiesStatCard, { backgroundColor: c.card, borderColor: c.borderLight }, cardShadow]}>
            <Text style={[styles.activitiesStatLabel, { color: c.textMuted }]}>This Week</Text>
            <Text style={[styles.activitiesStatValue, { color: c.text }]}>{weekActivities.length} Trips</Text>
          </View>
          <View style={[styles.activitiesStatCard, { backgroundColor: c.card, borderColor: c.borderLight }, cardShadow]}>
            <Text style={[styles.activitiesStatLabel, { color: c.textMuted }]}>Earnings</Text>
            <Text style={[styles.activitiesStatValue, { color: c.statusCompleted }]}>RWF {(weekEarnings / 1000).toFixed(0)}k</Text>
          </View>
          <View style={[styles.activitiesStatCard, { backgroundColor: c.card, borderColor: c.borderLight }, cardShadow]}>
            <Text style={[styles.activitiesStatLabel, { color: c.textMuted }]}>Points</Text>
            <Text style={[styles.activitiesStatValue, { color: c.text }]}>{pointsPlaceholder}</Text>
          </View>
        </View>
      </View>

      {/* Tabs: Recent | Scheduled | Monthly */}
      <View style={[styles.tabsRow, { borderBottomColor: c.borderLight }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabUnderline, tab === t.key && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabUnderlineText, { color: tab === t.key ? c.primary : c.textMuted }]}>{t.label}</Text>
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
            const statusKey = getStatusColorKey(item.trip.status, { hasBookings: (item.bookedSeats ?? 0) > 0 });
            const pillBg = c[getStatusTintKey(statusKey)] as string;
            const pillColor = c[statusKey] as string;
            const showCancel = tab === 'scheduled' && canCancelTrip(item);
            return (
              <TouchableOpacity
                style={[styles.activityCard, { backgroundColor: c.card, borderColor: c.borderLight }, cardShadow, isVoid && { opacity: 0.85 }]}
                onPress={() => onCardPress(item)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.activityCardIcon,
                  { backgroundColor: status === 'EARNED' ? c.statusCompletedTint : status === 'PAID' ? c.statusPendingTint : c.ghostBg },
                ]}>
                  <Ionicons
                    name={status === 'VOID' ? 'close' : status === 'EARNED' ? 'checkmark' : 'time'}
                    size={24}
                    color={status === 'EARNED' ? c.statusCompleted : status === 'PAID' ? c.statusPending : c.textMuted}
                  />
                </View>
                <View style={styles.activityCardBody}>
                  <View style={styles.activityCardRow}>
                    <Text style={[styles.activityCardTitle, { color: c.text }]} numberOfLines={1}>
                      {item.trip.departureHotpoint?.name ?? '—'} → {item.trip.destinationHotpoint?.name ?? '—'}
                    </Text>
                    <Text style={[styles.activityCardAmount, { color: isVoid ? c.statusCanceled : c.text }]}>
                      RWF {isIncomeVisible ? Number(item.collectedAmount ?? 0).toLocaleString('en-RW', { maximumFractionDigits: 0 }) : '••••••'}
                    </Text>
                  </View>
                  <View style={styles.activityCardMeta}>
                    <Text style={[styles.activityCardMetaText, { color: c.textSecondary }]}>
                      {item.bookedSeats ?? 0} Passengers • {formatTimeAgo(item.trip.departureTime)}
                      {isAgency && (() => {
                        const total = (item.bookedSeats ?? 0) + (item.remainingSeats ?? 0);
                        const pct = total > 0 ? Math.round(((item.bookedSeats ?? 0) / total) * 100) : 0;
                        return pct > 0 ? ` • ${pct}% full` : '';
                      })()}
                    </Text>
                    <View style={[styles.activityCardPill, { backgroundColor: pillBg }]}>
                      <Text style={[styles.activityCardPillText, { color: pillColor }]}>
                        {getStatusLabel(item)}
                      </Text>
                    </View>
                  </View>
                  {showCancel ? (
                    <TouchableOpacity
                      style={[styles.cancelBtn, { borderColor: c.error }]}
                      onPress={() => handleCancelTrip(item)}
                    >
                      <Text style={[styles.cancelBtnText, { color: c.error }]}>Cancel trip</Text>
                    </TouchableOpacity>
                  ) : null}
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
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: landingHeaderPaddingHorizontal,
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
    marginHorizontal: landingHeaderPaddingHorizontal,
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
  listContent: { paddingHorizontal: landingHeaderPaddingHorizontal, paddingTop: spacing.md },
  errorBanner: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    gap: spacing.sm,
  },
  errorText: { ...typography.body },
  activitiesHeader: {
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  activitiesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  activitiesTitle: { ...typography.h1, fontWeight: '800', marginBottom: spacing.xs },
  activitiesSubtitle: { ...typography.bodySmall },
  activitiesHeaderIcon: { width: sizes.touchTarget.iconButton, height: sizes.touchTarget.iconButton, borderRadius: radii.smMedium, alignItems: 'center', justifyContent: 'center' },
  activitiesStatsRow: { flexDirection: 'row', gap: spacing.sm },
  activitiesStatCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  activitiesStatLabel: { ...typography.caption9, textTransform: 'uppercase', marginBottom: spacing.xxs },
  activitiesStatValue: { ...typography.bodySmall, fontWeight: '800' },
  tabsRow: { flexDirection: 'row', paddingHorizontal: landingHeaderPaddingHorizontal, gap: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.sm, borderBottomWidth: 1 },
  tabUnderline: { paddingBottom: spacing.sm },
  tabUnderlineText: { ...typography.bodySmall, fontWeight: '800' },
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
  activityCardAmount: { ...typography.captionBold },
  activityCardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.xs },
  activityCardMetaText: { ...typography.overline, flex: 1 },
  activityCardPill: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radii.xs },
  activityCardPillText: { ...typography.caption9 },
  cancelBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.xs, borderWidth: 1 },
  cancelBtnText: { ...typography.captionBold },
});
