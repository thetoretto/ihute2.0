import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import {
  RoleToggle,
  Screen,
  CarRefreshIndicator,
  ExpansionDetailsCard,
  ExpandActionButton,
  formatRatingValue,
  Button,
} from '../../components';
import { getDriverTripActivities, getDriverRatingSummary, getDriverActivitySummary } from '../../services/api';
import { getUnreadDriverNotificationCount, getScannerTicketCount } from '../../services/api';
import { useResponsiveThemeContext } from '../../context/ResponsiveThemeContext';
import { useThemeColors } from '../../context/ThemeContext';
import { colors, spacing, typography, radii, cardShadow } from '../../utils/theme';
import type { DriverTripActivity } from '../../types';

const CARD_RADIUS = 24;

function getGreetingName(displayName: string | null | undefined): string {
  if (!displayName?.trim()) return 'Driver';
  const first = displayName.trim().split(/\s+/)[0];
  return first || 'Driver';
}

export default function DriverHomeScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { currentRole, switchRole, hasApprovedVehicle, agencySubRole } = useRole();
  const responsive = useResponsiveThemeContext();
  const c = useThemeColors();
  const effectiveSpacing = responsive?.spacing ?? spacing;
  const effectiveTypography = responsive?.typography ?? typography;
  const isScanner = currentRole === 'agency' && agencySubRole === 'agency_scanner';
  const [activities, setActivities] = useState<DriverTripActivity[]>([]);
  const [ratingSummary, setRatingSummary] = useState<{ average: number; count: number } | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [isIncomeVisible, setIsIncomeVisible] = useState(false);
  const [driverModeOn, setDriverModeOn] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [scannerTicketCount, setScannerTicketCount] = useState(0);
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'done'>('idle');
  const [activitySummary, setActivitySummary] = useState<{
    doneCount: number;
    activeCount: number;
    bookingsCount: number;
    remainingSeats: number;
    income: number;
  } | null>(null);
  const incomeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    return () => {
      if (incomeTimerRef.current) {
        clearTimeout(incomeTimerRef.current);
      }
    };
  }, []);

  const loadTrips = useCallback(async () => {
    if (!user) return;
    const [items, ratings] = await Promise.all([
      getDriverTripActivities(user.id),
      getDriverRatingSummary(user.id),
    ]);
    setActivities(items);
    setRatingSummary(ratings);
    if (!isScanner) {
      const summary = await getDriverActivitySummary(user.id);
      setActivitySummary(summary);
    } else {
      setActivitySummary(null);
    }
  }, [user, isScanner]);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    if (!user?.id) return;
    getUnreadDriverNotificationCount(user.id).then(setUnreadNotifications);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadTrips();
      if (user?.id) {
        getUnreadDriverNotificationCount(user.id).then(setUnreadNotifications);
      }
      if (isScanner) {
        getScannerTicketCount().then(setScannerTicketCount);
      }
    }, [loadTrips, user?.id, isScanner])
  );

  const toggleExpanded = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setExpandedTripId((prev) => (prev === id ? null : id));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshState('refreshing');
    await loadTrips();
    setRefreshState('done');
    setRefreshing(false);
    setTimeout(() => setRefreshState('idle'), 240);
  };

  const maskIncome = (value: number, suffix = 'RWF') =>
    isIncomeVisible ? `${Number(value).toLocaleString('en-RW', { maximumFractionDigits: 0 })} ${suffix}` : '••••••';

  const handleScannerLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const onToggleIncome = () => {
    if (isIncomeVisible) {
      setIsIncomeVisible(false);
      if (incomeTimerRef.current) {
        clearTimeout(incomeTimerRef.current);
      }
      return;
    }

    const reveal = () => {
      setIsIncomeVisible(true);
      if (incomeTimerRef.current) {
        clearTimeout(incomeTimerRef.current);
      }
      incomeTimerRef.current = setTimeout(() => setIsIncomeVisible(false), 12000);
    };

    Alert.alert('View income', 'Reveal income values for 12 seconds?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'View income', onPress: reveal },
    ]);
  };

  const upcomingActive = activities.filter((a) => a.trip.status === 'active');
  const nextRide = upcomingActive[0];
  const scheduledCount = upcomingActive.length;

  return (
    <Screen
      scroll
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: effectiveSpacing.lg, paddingBottom: effectiveSpacing.xl + 80 }]}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[c.primary]}
            tintColor={c.primary}
            progressBackgroundColor={c.surface}
          />
        ),
      }}
    >
      {/* Header: greeting + avatar */}
      <View style={[styles.headerRow, { marginBottom: effectiveSpacing.md }]}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.greeting, effectiveTypography.h2, { color: c.text }]}>
            {isScanner ? 'Scanner' : currentRole === 'agency' ? 'Agency' : 'Hello, ' + getGreetingName(user?.displayName ?? user?.email ?? '') + '!'}
          </Text>
          <Text style={[styles.subtitle, effectiveTypography.bodySmall, { color: c.textSecondary }]}>
            {isScanner
              ? 'Scan & activities'
              : currentRole === 'agency'
                ? 'Reports and overview'
                : scheduledCount > 0
                  ? `You have ${scheduledCount} ride${scheduledCount === 1 ? '' : 's'} scheduled today`
                  : 'Trips and activities'}
          </Text>
          {!isScanner && (ratingSummary?.count ?? 0) > 0 ? (
            <Text style={[styles.ratingText, { color: currentRole === 'agency' ? c.agency : c.passengerDark }]}>
              Rating {formatRatingValue(ratingSummary?.average, '0.0')} ({ratingSummary?.count ?? 0})
            </Text>
          ) : null}
        </View>
          <View style={styles.avatarWrap}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={[styles.avatar, { borderColor: currentRole === 'agency' ? c.agency : c.passengerDark }]} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentRole === 'agency' ? c.agencyTint : c.primaryTint, borderColor: currentRole === 'agency' ? c.agency : c.passengerDark }]}>
              <Text style={[styles.avatarInitial, { color: c.text }]}>
                {(user?.displayName ?? user?.email ?? 'D').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {!isScanner ? <View style={styles.statusDot} /> : null}
        </View>
        {isScanner ? (
          <TouchableOpacity style={[styles.scannerLogoutBtn, { backgroundColor: c.agencyTint }]} onPress={handleScannerLogout}>
            <Ionicons name="log-out-outline" size={22} color={c.agency} />
            <Text style={[styles.scannerLogoutText, { color: c.agency }]}>Log out</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Hero card: dark bg (driver) / agency (agency), income + pills */}
      {!isScanner && (currentRole === 'driver' || currentRole === 'agency') && activitySummary != null ? (
        <View style={[styles.heroCard, cardShadow, { marginBottom: effectiveSpacing.md, backgroundColor: currentRole === 'agency' ? c.agency : c.passengerDark }]}>
          <View style={styles.heroInner}>
            <Text style={styles.heroLabel}>Today&apos;s summary</Text>
            <Text style={styles.heroAmount}>{maskIncome(activitySummary.income)}</Text>
            <TouchableOpacity onPress={onToggleIncome} style={styles.heroViewBtn}>
              <Text style={styles.heroViewBtnText}>{isIncomeVisible ? 'Hide' : 'View'}</Text>
            </TouchableOpacity>
            <View style={styles.heroPills}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillLabel}>RIDES</Text>
                <Text style={styles.heroPillValue}>{activitySummary.doneCount + activitySummary.activeCount}</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillLabel}>RATING</Text>
                <Text style={styles.heroPillValue}>
                  {formatRatingValue(ratingSummary?.average, '0.0')} <Ionicons name="star" size={10} color="#FBBF24" />
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.heroOrb} />
        </View>
      ) : null}

      {/* Action buttons: Scan, Notifications, Publish */}
      <View style={[styles.actionButtonsRow, { marginBottom: effectiveSpacing.md }]}>
        <TouchableOpacity
          style={[styles.primaryActionBtn, { backgroundColor: currentRole === 'agency' ? c.agency : c.passengerDark }, cardShadow]}
          onPress={() => navigation.navigate('DriverScanTicket')}
          activeOpacity={0.85}
        >
          <Ionicons name="scan-outline" size={22} color={c.onPrimary} />
          <Text style={[styles.primaryActionText, { color: c.onPrimary }]}>Scan</Text>
        </TouchableOpacity>
        {!isScanner ? (
          <>
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { borderColor: c.border }]}
              onPress={() => navigation.navigate('DriverNotifications' as never)}
              activeOpacity={0.85}
            >
              <Ionicons name="notifications-outline" size={20} color={c.text} />
              <Text style={[styles.secondaryActionText, { color: c.text }]}>
                {unreadNotifications > 0 ? (unreadNotifications > 99 ? '99+' : unreadNotifications) : 'Alerts'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { borderColor: c.border }]}
              onPress={() => navigation.navigate('PublishRide')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={20} color={c.text} />
              <Text style={[styles.secondaryActionText, { color: c.text }]}>Publish</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {isScanner ? (
        <View style={[styles.scannerTicketBadge, { backgroundColor: c.primaryTint }]}>
          <Text style={[styles.scannerTicketCount, { color: c.text }]}>Tickets today: {scannerTicketCount}</Text>
        </View>
      ) : null}

      {/* Driver mode card (template-style) */}
      {!isScanner && currentRole === 'driver' ? (
        <>
          <View
            style={[
              styles.driverModeCard,
              { backgroundColor: c.primaryTint, marginBottom: user?.roles?.length && user.roles.length > 1 ? effectiveSpacing.sm : effectiveSpacing.md },
            ]}
          >
            <View style={styles.driverModeLeft}>
              <View style={[styles.driverModeIconWrap, { backgroundColor: c.background }]}>
                <Ionicons name="car-sport" size={20} color={c.primary} />
              </View>
              <View>
                <Text style={[styles.driverModeTitle, { color: c.text }]}>Driver mode</Text>
                <Text style={[styles.driverModeSub, { color: c.textSecondary }]}>Visible to passengers</Text>
              </View>
            </View>
            <Switch
              value={driverModeOn}
              onValueChange={setDriverModeOn}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.background}
            />
          </View>
          {user?.roles?.length && user.roles.length > 1 ? (
            <View style={{ marginBottom: effectiveSpacing.md }}>
              <RoleToggle
                currentRole={currentRole}
                onSwitch={switchRole}
                hasApprovedVehicle={hasApprovedVehicle}
                availableRoles={user.roles}
                onNavigateToVehicleGarage={() => navigation.navigate('VehicleGarage')}
              />
            </View>
          ) : null}
        </>
      ) : null}

      {/* Next ride card (template-style with route line) */}
      {!isScanner && (currentRole === 'driver' || currentRole === 'agency') ? (
        <View style={styles.nextRideSection}>
          <View style={styles.nextRideHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Next ride</Text>
            {nextRide ? (
              <Text style={[styles.nextRideBadge, { color: c.primary }]}>
                {nextRide.trip.departureTime}
              </Text>
            ) : null}
          </View>
          {nextRide ? (
            <View style={[styles.nextRideCard, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}>
              <View style={styles.routeRow}>
                <View style={styles.routeCol}>
                  <View style={styles.routeLine} />
                  <View style={styles.routeItem}>
                    <View style={[styles.routeDot, { borderColor: c.primary }]} />
                    <View>
                      <Text style={[styles.routeLabel, { color: c.textSecondary }]}>From</Text>
                      <Text style={[styles.routeValue, { color: c.text }]} numberOfLines={1}>
                        {nextRide.trip.departureHotpoint?.name ?? '—'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.routeItem}>
                    <View style={[styles.routeDotDest, { borderColor: c.primary }]} />
                    <View>
                      <Text style={[styles.routeLabel, { color: c.textSecondary }]}>To</Text>
                      <Text style={[styles.routeValue, { color: c.text }]} numberOfLines={1}>
                        {nextRide.trip.destinationHotpoint?.name ?? '—'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.nextRidePriceWrap}>
                  <Text style={[styles.nextRidePrice, { color: c.text }]}>{maskIncome(nextRide.collectedAmount)}</Text>
                  <Text style={[styles.nextRidePriceLabel, { color: c.textSecondary }]}>Collected</Text>
                </View>
              </View>
              <View style={[styles.nextRideDivider, { backgroundColor: c.border }]} />
              <View style={styles.nextRideFooter}>
                <View style={styles.passengerPills}>
                  <Text style={[styles.passengerPillText, { color: c.textSecondary }]}>
                    {nextRide.bookingsCount} passenger{nextRide.bookingsCount !== 1 ? 's' : ''} • {nextRide.remainingSeats} seats left
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.startRideBtn, { backgroundColor: c.primary }]}
                  onPress={() => (navigation.getParent() as any)?.getParent()?.navigate('DriverActivityListStack')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.startRideBtnText, { color: c.onPrimary }]}>View ride</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.nextRideCard, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}>
              <Text style={[styles.noNextRide, { color: c.textSecondary }]}>No upcoming ride today</Text>
              <TouchableOpacity
                style={[styles.startRideBtn, { backgroundColor: c.primary, marginTop: spacing.md }]}
                onPress={() => (navigation.getParent() as any)?.getParent()?.navigate('DriverActivityListStack')}
                activeOpacity={0.85}
              >
                <Text style={[styles.startRideBtnText, { color: c.onPrimary }]}>View all activities</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      {/* Today's summary grid (compact, when we have hero we can hide or keep for agency) */}
      {!isScanner && currentRole === 'driver' && activitySummary != null ? (
        <TouchableOpacity
          style={styles.viewAllActivitiesBtn}
          onPress={() => (navigation.getParent() as any)?.getParent()?.navigate('DriverActivityListStack')}
        >
          <Text style={[styles.viewAllActivitiesText, { color: currentRole === 'agency' ? c.agency : c.passengerDark }]}>View all activities</Text>
          <Ionicons name="chevron-forward" size={18} color={currentRole === 'agency' ? c.agency : c.passengerDark} />
        </TouchableOpacity>
      ) : null}

      {currentRole === 'agency' && !isScanner ? (
        <View style={[styles.agencySection, { marginTop: effectiveSpacing.md }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Agency overview</Text>
          <View style={[styles.agencyCard, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}>
            <Text style={[styles.agencyCardText, { color: c.textSecondary }]}>View reports and scan summary</Text>
            <TouchableOpacity
              style={styles.agencyReportBtn}
              onPress={() => (navigation.getParent() as any)?.navigate('AgencyReport')}
            >
              <Ionicons name="document-text-outline" size={22} color={c.agency} />
              <Text style={[styles.agencyReportBtnText, { color: c.agency }]}>Open Report</Text>
              <Ionicons name="chevron-forward" size={18} color={c.agency} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {isScanner ? (
        <>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Activities & recent</Text>
          {activities.length === 0 ? (
            <Text style={[styles.empty, { color: c.textSecondary }]}>No activities yet. Scan tickets to see them here.</Text>
          ) : (
            activities.map((item) => (
              <View
                key={item.trip.id}
                style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}
              >
                <View style={styles.activityHeaderRow}>
                  <Text style={[styles.route, { color: c.text }]}>
                    {item.trip.departureHotpoint?.name} → {item.trip.destinationHotpoint?.name}
                  </Text>
                  <ExpandActionButton
                    expanded={expandedTripId === item.trip.id}
                    onPress={() => toggleExpanded(item.trip.id)}
                  />
                </View>
                <Text style={[styles.time, { color: c.textSecondary }]}>{item.trip.departureTime}</Text>
                <Text style={[styles.meta, { color: c.textSecondary }]}>
                  Booked {item.bookedSeats} • Remaining {item.remainingSeats}
                </Text>
                <Text style={[styles.meta, { color: c.textSecondary }]}>Collected {maskIncome(item.collectedAmount)}</Text>
                {expandedTripId === item.trip.id ? (
                  <ExpansionDetailsCard
                    tone="driver"
                    title="Performance"
                    rows={[
                      { icon: 'people', label: 'Bookings', value: `${item.bookingsCount}` },
                      { icon: 'person-add', label: 'Booked seats', value: `${item.bookedSeats}` },
                      { icon: 'person-remove', label: 'Remaining', value: `${item.remainingSeats}` },
                      {
                        icon: 'cash',
                        label: 'Collected',
                        value: isIncomeVisible ? `${Number(item.collectedAmount).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF` : 'HIDDEN',
                      },
                    ]}
                  />
                ) : null}
              </View>
            ))
          )}
        </>
      ) : null}
      <CarRefreshIndicator state={refreshState} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerTextWrap: { flex: 1 },
  greeting: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary },
  ratingText: { ...typography.caption, color: colors.primary, marginTop: spacing.xs },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...typography.h3, fontSize: 20 },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  heroCard: {
    borderRadius: CARD_RADIUS,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  heroInner: { zIndex: 1 },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  heroAmount: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  heroViewBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 },
  heroViewBtnText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  heroPills: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  heroPill: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  heroPillLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  heroPillValue: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  heroOrb: { position: 'absolute', right: -40, bottom: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' },
  actionButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 100,
    paddingVertical: 14,
    borderRadius: 16,
  },
  primaryActionText: { ...typography.bodySmall, fontWeight: '700' },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryActionText: { ...typography.bodySmall, fontWeight: '600' },
  scannerTicketBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  scannerTicketCount: { ...typography.bodySmall, fontWeight: '600' },
  scannerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  scannerLogoutText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  driverModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 20,
  },
  driverModeLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  driverModeIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  driverModeTitle: { ...typography.bodySmall, fontWeight: '600' },
  driverModeSub: { ...typography.caption, marginTop: 2 },
  nextRideSection: { marginBottom: spacing.lg },
  nextRideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.sm },
  nextRideBadge: { ...typography.caption, fontWeight: '600' },
  sectionTitle: { ...typography.h3, color: colors.text },
  nextRideCard: {
    borderRadius: CARD_RADIUS,
    padding: spacing.lg,
    borderWidth: 1,
  },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  routeCol: { flex: 1, position: 'relative' },
  routeLine: {
    position: 'absolute',
    left: 7,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: colors.border,
  },
  routeItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, zIndex: 1 },
  routeDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.background, borderWidth: 4 },
  routeDotDest: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.background, borderWidth: 4 },
  routeLabel: { ...typography.caption },
  routeValue: { ...typography.bodySmall, fontWeight: '600' },
  nextRidePriceWrap: { alignItems: 'flex-end' },
  nextRidePrice: { ...typography.h2 },
  nextRidePriceLabel: { ...typography.caption },
  nextRideDivider: { height: 1, marginVertical: spacing.md },
  nextRideFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  passengerPills: {},
  passengerPillText: { ...typography.caption },
  startRideBtn: { paddingVertical: 10, paddingHorizontal: spacing.lg, borderRadius: 12, alignSelf: 'flex-end' },
  startRideBtnText: { ...typography.bodySmall, fontWeight: '700' },
  noNextRide: { ...typography.bodySmall, textAlign: 'center' },
  viewAllActivitiesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  viewAllActivitiesText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  agencySection: {},
  agencyCard: {
    padding: spacing.lg,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  agencyCardText: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  agencyReportBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  agencyReportBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  empty: { ...typography.body, color: colors.textSecondary },
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  activityHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  route: { ...typography.body, color: colors.text, flex: 1 },
  time: { ...typography.caption, color: colors.textSecondary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
