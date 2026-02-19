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
import { getDriverTripActivities, getDriverRatingSummary, getDriverActivitySummary } from '../../services/mockApi';
import { getUnreadDriverNotificationCount, getScannerTicketCount } from '../../services/mockPersistence';
import { useResponsiveThemeContext } from '../../context/ResponsiveThemeContext';
import { useThemeColors } from '../../context/ThemeContext';
import { colors, spacing, typography, radii } from '../../utils/theme';
import type { DriverTripActivity } from '../../types';

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

  return (
    <Screen
      scroll
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: effectiveSpacing.lg, paddingBottom: effectiveSpacing.xl }]}
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
      <View style={[styles.headerRow, { marginBottom: effectiveSpacing.lg }]}>
        <View>
          <Text style={[styles.title, effectiveTypography.h2, { color: c.text }]}>
            {isScanner ? 'Scanner' : currentRole === 'agency' ? 'Agency dashboard' : 'Driver dashboard'}
          </Text>
          <Text style={[styles.subtitle, effectiveTypography.bodySmall, { color: c.textSecondary }]}>
            {isScanner ? 'Scan & activities' : currentRole === 'agency' ? 'Reports and overview' : 'Trips and activities'}
          </Text>
          {!isScanner ? (
            <Text style={[styles.ratingText, { color: c.primary }]}>
              Passenger rating {formatRatingValue(ratingSummary?.average, '0.0')} ({ratingSummary?.count ?? 0})
            </Text>
          ) : null}
        </View>
        {isScanner ? (
          <TouchableOpacity style={[styles.scannerLogoutBtn, { backgroundColor: c.primaryTint }]} onPress={handleScannerLogout}>
            <Ionicons name="log-out-outline" size={22} color={c.primary} />
            <Text style={[styles.scannerLogoutText, { color: c.primary }]}>Log out</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.actionButtonsRow}>
        <Button
          title="Scan"
          onPress={() => navigation.navigate('DriverScanTicket')}
          variant="primary"
          size="medium"
          style={styles.primaryActionBtn}
        />
        {!isScanner ? (
          <Button
            title={unreadNotifications > 0 ? `Notifications (${unreadNotifications > 99 ? '99+' : unreadNotifications})` : 'Notifications'}
            onPress={() => navigation.navigate('DriverNotifications' as never)}
            variant="outline"
            size="medium"
            style={styles.secondaryActionBtn}
          />
        ) : null}
        {/* Scanner must never see Publish — no route to PublishRide in ScannerHomeStack. */}
        {!isScanner ? (
          <Button
            title="Publish"
            onPress={() => navigation.navigate('PublishRide')}
            variant="outline"
            size="medium"
            style={styles.secondaryActionBtn}
          />
        ) : null}
      </View>
      {isScanner ? (
        <View style={styles.scannerTicketBadge}>
          <Text style={styles.scannerTicketCount}>Tickets today: {scannerTicketCount}</Text>
        </View>
      ) : null}
      {!isScanner && user?.roles?.length && user.roles.length > 1 ? (
        <RoleToggle
          currentRole={currentRole}
          onSwitch={switchRole}
          hasApprovedVehicle={hasApprovedVehicle}
          availableRoles={user.roles}
          onNavigateToVehicleGarage={() => navigation.navigate('VehicleGarage')}
        />
      ) : null}

      {!isScanner && currentRole === 'driver' && activitySummary != null ? (
        <View style={styles.summarySection}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Today&apos;s summary</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
              <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Done</Text>
              <Text style={[styles.summaryValue, { color: c.text }]}>{activitySummary.doneCount}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
              <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Active</Text>
              <Text style={[styles.summaryValue, { color: c.text }]}>{activitySummary.activeCount}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
              <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Bookings</Text>
              <Text style={[styles.summaryValue, { color: c.text }]}>{activitySummary.bookingsCount}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
              <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Income</Text>
              <Text style={[styles.summaryValue, { color: c.text }]}>{maskIncome(activitySummary.income)}</Text>
              <TouchableOpacity onPress={onToggleIncome} style={styles.incomeToggleBtn}>
                <Text style={styles.incomeToggleText}>{isIncomeVisible ? 'Hide' : 'View'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewAllActivitiesBtn}
            onPress={() => (navigation.getParent() as any)?.getParent()?.navigate('DriverActivityListStack')}
          >
            <Text style={[styles.viewAllActivitiesText, { color: c.primary }]}>View all activities</Text>
            <Ionicons name="chevron-forward" size={18} color={c.primary} />
          </TouchableOpacity>
        </View>
      ) : null}

      {currentRole === 'agency' && !isScanner ? (
        <View style={styles.agencySection}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Agency overview</Text>
          <View style={[styles.agencyCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.agencyCardText, { color: c.textSecondary }]}>View reports and scan summary</Text>
            <TouchableOpacity
              style={styles.agencyReportBtn}
              onPress={() => (navigation.getParent() as any)?.navigate('AgencyReport')}
            >
              <Ionicons name="document-text-outline" size={22} color={c.primary} />
              <Text style={[styles.agencyReportBtnText, { color: c.primary }]}>Open Report</Text>
              <Ionicons name="chevron-forward" size={18} color={c.primary} />
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
                style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
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
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  headerRow: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary },
  ratingText: { ...typography.caption, color: colors.primary, marginTop: spacing.xs },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  primaryActionBtn: {
    flex: 1,
    minWidth: 120,
    ...(Platform.OS === 'android' ? { elevation: 2 } : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 }),
  },
  secondaryActionBtn: {
    flex: 1,
    minWidth: 120,
  },
  scannerTicketBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  scannerTicketCount: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  scannerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  scannerLogoutText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  empty: { ...typography.body, color: colors.textSecondary },
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  route: { ...typography.body, color: colors.text, flex: 1 },
  time: { ...typography.caption, color: colors.textSecondary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  summarySection: { marginBottom: spacing.lg },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryCard: {
    width: '48%',
    minHeight: 80,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  summaryLabel: { ...typography.caption, color: colors.textSecondary },
  summaryValue: { ...typography.h3, color: colors.text },
  incomeToggleBtn: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primaryButtonBorder,
    borderRadius: radii.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary,
  },
  incomeToggleText: { ...typography.caption, color: colors.onPrimary, fontWeight: '700' },
  viewAllActivitiesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  viewAllActivitiesText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  agencySection: { marginBottom: spacing.lg },
  agencyCard: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  agencyCardText: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  agencyReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  agencyReportBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
