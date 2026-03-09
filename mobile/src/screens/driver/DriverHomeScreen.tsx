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
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { useRootNavigation } from '../../context/RootNavigationContext';
import {
  RoleToggle,
  Screen,
  CarRefreshIndicator,
  ExpansionDetailsCard,
  ExpandActionButton,
  formatRatingValue,
  Button,
  HotpointPicker,
  LandingHeader,
} from '../../components';
import {
  getDriverTripActivities,
  getDriverRatingSummary,
  getDriverActivitySummary,
  getDriverDriveModeStatus,
  setDriverDriveMode,
  clearDriverDriveMode,
  getHotpoints,
  getWalletBalance,
} from '../../services/api';
import { getUnreadDriverNotificationCount, getScannerTicketCount } from '../../services/api';
import { useResponsiveThemeContext } from '../../context/ResponsiveThemeContext';
import { useThemeColors } from '../../context/ThemeContext';
import { useDriverTheme } from '../../context/DriverThemeContext';
import { useToast } from '../../context/ToastContext';
import { colors, spacing, typography, radii, sizes, cardShadow, borderWidths } from '../../utils/theme';
import { cardRadius, driverContentHorizontal, layout, listBottomPaddingTab, sectionTitleStyle, tightGap } from '../../utils/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DriverTripActivity, Hotpoint } from '../../types';
import type { DriverDriveModeStatus } from '../../services/api';

function getGreetingName(displayName: string | null | undefined): string {
  if (!displayName?.trim()) return 'Driver';
  const first = displayName.trim().split(/\s+/)[0];
  return first || 'Driver';
}

export default function DriverHomeScreen() {
  const navigation = useNavigation<any>();
  const { rootNavigate } = useRootNavigation();
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
  const [driverModeOn, setDriverModeOn] = useState(false);
  const [driveModeModalVisible, setDriveModeModalVisible] = useState(false);
  const [driveModeFrom, setDriveModeFrom] = useState<Hotpoint | null>(null);
  const [driveModeTo, setDriveModeTo] = useState<Hotpoint | null>(null);
  const [driveModeSeats, setDriveModeSeats] = useState(3);
  const [driveModeCost, setDriveModeCost] = useState('');
  const [hotpoints, setHotpoints] = useState<Hotpoint[]>([]);
  const [driveModeStatus, setDriveModeStatus] = useState<DriverDriveModeStatus | null>(null);
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
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const incomeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const driverTheme = useDriverTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();

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

  useEffect(() => {
    getHotpoints().then(setHotpoints);
  }, []);

  useEffect(() => {
    if (!user?.id || currentRole !== 'driver' || isScanner) return;
    getDriverDriveModeStatus(user.id)
      .then((status) => {
        setDriverModeOn(status.inDriveMode);
        setDriveModeStatus(status.inDriveMode ? status : null);
      })
      .catch(() => {});
  }, [user?.id, currentRole, isScanner]);

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

  useEffect(() => {
    if (!user?.id || currentRole !== 'driver') return;
    getWalletBalance(user.id).then(setWalletBalance);
  }, [user?.id, currentRole]);

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
  const isDriverMockup = currentRole === 'driver' && !isScanner;
  const d = driverTheme?.colors ?? c;

  return (
    <Screen
      scroll={!isDriverMockup}
      style={[styles.container, { backgroundColor: c.appBackground }, isDriverMockup ? { paddingHorizontal: 0 } : null]}
      contentContainerStyle={isDriverMockup ? undefined : [styles.content, { paddingTop: effectiveSpacing.lg, paddingBottom: listBottomPaddingTab }]}
      scrollProps={isDriverMockup ? undefined : {
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
      {isDriverMockup ? (
        <View style={[styles.driverMockupWrapper, { paddingTop: 0 }]}>
          <View style={[styles.driverMockupHeader, { borderBottomColor: c.border }]}>
            <View style={styles.driverHeaderLeft}>
              <Text style={[styles.driverGreeting, { color: d.primary }]}>Hello, {getGreetingName(user?.displayName ?? user?.email ?? '')}!</Text>
              <View style={styles.driverHeaderBadges}>
                <View style={styles.driverTierPill}><Text style={styles.driverTierPillText}>Gold Pro</Text></View>
                <Text style={[styles.driverRatingBadge, { color: c.textSecondary }]}>{formatRatingValue(ratingSummary?.average ?? 0, '0.00')} ★ Rating</Text>
              </View>
            </View>
            <View style={styles.driverHeaderRight}>
              <TouchableOpacity style={styles.driverIconBtn} onPress={() => navigation.navigate('DriverNotifications' as never)}>
                <Ionicons name="notifications-outline" size={20} color={c.textSecondary} />
                {unreadNotifications > 0 ? <View style={styles.driverNotificationDot} /> : null}
              </TouchableOpacity>
              <View style={[styles.driverAvatarWrap, { borderColor: c.card }]}>
                {user?.photoURL ? <Image source={{ uri: user.photoURL }} style={styles.driverAvatar} /> : (
                  <View style={[styles.driverAvatarPlaceholder, { backgroundColor: c.ghostBg }]}>
                    <Text style={[styles.driverAvatarInitial, { color: d.primary }]}>{(user?.displayName ?? user?.email ?? 'D').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <ScrollView
            style={styles.driverMockupScroll}
            contentContainerStyle={[styles.driverMockupScrollContent, { paddingBottom: listBottomPaddingTab }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[c.primary]}
                tintColor={c.primary}
                progressBackgroundColor={c.surface}
              />
            }
          >
          <View style={[styles.driverWalletCard, { backgroundColor: d.card, borderColor: c.border }, cardShadow]}>
            <View style={styles.driverWalletLeft}>
              <View style={[styles.driverWalletIcon, { backgroundColor: d.accentTint }]}><Ionicons name="cash-outline" size={20} color={d.accent} /></View>
              <View>
                <Text style={[styles.driverWalletLabel, { color: c.textSecondary }]}>Current Balance</Text>
                <Text style={[styles.driverWalletAmount, { color: d.primary }]}>RWF {walletBalance.toLocaleString('en-RW', { maximumFractionDigits: 0 })}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.driverWithdrawBtn, { backgroundColor: d.primary }]} onPress={() => rootNavigate('WithdrawalMethods')}>
              <Text style={[styles.driverWithdrawBtnText, { color: d.onPrimary }]}>Withdraw</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.driverInstantModeCard, { backgroundColor: d.card, borderColor: c.border }]}>
            <View style={styles.driverInstantModeLeft}>
              <View style={[styles.driverStatusDot, { backgroundColor: driverModeOn ? d.instaGreen : c.border }]} />
              <View>
                <Text style={[styles.driverInstantModeTitle, { color: d.primary }]}>Instant Mode</Text>
                <Text style={[styles.driverInstantModeSub, { color: c.textSecondary }]}>{driverModeOn ? 'Online • Ready for Insta Trips' : 'Offline • On-demand disabled'}</Text>
              </View>
            </View>
            <Switch value={driverModeOn} onValueChange={(val) => { if (val) setDriveModeModalVisible(true); else if (user?.id) clearDriverDriveMode(user.id).then(() => { setDriverModeOn(false); setDriveModeStatus(null); }).catch(() => setDriverModeOn(false)); else setDriverModeOn(false); }} trackColor={{ false: c.border, true: d.instaGreen }} thumbColor={c.card} />
          </View>
          {driverModeOn && (
            <View style={[styles.driverLiveBlock, { backgroundColor: d.instaGreenTint, borderColor: d.instaGreen }]}>
              <View style={[styles.driverLiveIconWrap, { backgroundColor: d.instaGreen }]}><Ionicons name="search" size={24} color={c.card} /></View>
              <Text style={[styles.driverLiveTitle, { color: c.appSuccessDark }]}>Live & Searching</Text>
              <Text style={[styles.driverLiveSub, { color: c.appSuccessDark }]}>You are visible to riders nearby</Text>
            </View>
          )}
          <View style={styles.driverSection}>
            <Text style={[styles.driverSectionTitle, { color: d.primary }]}>Active Trip</Text>
            {nextRide ? (
              <View style={[styles.driverActiveTripCard, { backgroundColor: d.primary }, cardShadow]}>
                <View style={styles.driverActiveTripTop}>
                  <View style={[styles.driverInProgressPill, { backgroundColor: d.instaGreen }]}><Text style={styles.driverInProgressPillText}>In Progress</Text></View>
                  <View style={styles.driverLiveIndicator}><View style={styles.driverLiveDot} /><Text style={styles.driverLiveLabel}>Live</Text></View>
                </View>
                <View style={styles.driverRouteRow}>
                  <View><Text style={styles.driverRouteCode}>{nextRide.trip.departureHotpoint?.name?.slice(0, 3).toUpperCase() ?? 'KGL'}</Text><Text style={styles.driverRouteCity}>{nextRide.trip.departureHotpoint?.name ?? 'Kigali'}</Text></View>
                  <View style={styles.driverRouteLine}><View style={styles.driverRouteLineInner} /><Ionicons name="flash" size={20} color={d.instaGreen} /><View style={styles.driverRouteLineInner} /></View>
                  <View style={{ alignItems: 'flex-end' }}><Text style={styles.driverRouteCode}>{nextRide.trip.destinationHotpoint?.name?.slice(0, 3).toUpperCase() ?? 'MUS'}</Text><Text style={styles.driverRouteCity}>{nextRide.trip.destinationHotpoint?.name ?? 'Destination'}</Text></View>
                </View>
                <View style={styles.driverPassengerRow}>
                  <View style={styles.driverPassengerLeft}><View style={[styles.driverPassengerAvatar, { borderColor: d.instaGreen }]} /><View><Text style={styles.driverPassengerLabel}>Passenger</Text><Text style={styles.driverPassengerName}>{nextRide.bookingsCount} Booked</Text></View></View>
                  <View><Text style={styles.driverPassengerLabel}>Occupancy</Text><Text style={styles.driverPassengerName}>{nextRide.bookedSeats ?? 0}/{nextRide.trip.seatsAvailable ?? 4} Booked</Text></View>
                </View>
                <TouchableOpacity style={[styles.driverViewRideBtn, { backgroundColor: c.surfaceOverlay }]} onPress={() => rootNavigate('DriverActivityListStack')}><Text style={styles.driverViewRideBtnText}>View ride</Text></TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.driverActiveTripCard, styles.driverActiveTripCardEmpty, { backgroundColor: d.card, borderColor: c.border }]}>
                <Text style={[styles.driverNoActiveTrip, { color: c.textSecondary }]}>No active trip</Text>
                <TouchableOpacity style={[styles.driverViewRideBtn, { backgroundColor: d.primary }]} onPress={() => rootNavigate('DriverActivityListStack')}><Text style={[styles.driverViewRideBtnText, { color: d.onPrimary }]}>View all activities</Text></TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.driverSection}>
            <Text style={[styles.driverSectionTitle, { color: d.primary }]}>Pending Approvals</Text>
            <View style={[styles.driverPendingCard, { backgroundColor: d.card, borderColor: c.border }]}>
              <View style={[styles.driverPendingAvatar, { backgroundColor: d.accentTint }]} />
              <View style={styles.driverPendingBody}><Text style={[styles.driverPendingName, { color: d.primary }]}>Jean Paul</Text><Text style={[styles.driverPendingMeta, { color: c.textSecondary }]}>Request for 1 seat to Musanze</Text></View>
              <View style={styles.driverPendingActions}>
                <TouchableOpacity style={styles.driverApproveBtn} onPress={() => toast?.showToast('Booking Approved!')}><Ionicons name="checkmark" size={20} color={d.success} /></TouchableOpacity>
                <TouchableOpacity style={styles.driverRejectBtn}><Ionicons name="close" size={20} color={c.error} /></TouchableOpacity>
              </View>
            </View>
          </View>
          {user?.roles?.length && user.roles.length > 1 ? <View style={{ marginBottom: effectiveSpacing.md }}><RoleToggle currentRole={currentRole} onSwitch={switchRole} hasApprovedVehicle={hasApprovedVehicle} availableRoles={user.roles} onNavigateToVehicleGarage={() => rootNavigate('VehicleGarage')} /></View> : null}
          </ScrollView>
          <Modal visible={driveModeModalVisible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
              <View style={[styles.driveModeSheet, { backgroundColor: c.appBackground }]}>
                <Text style={[styles.driveModeModalTitle, { color: c.text }]}>Set your route</Text>
                <Text style={[styles.driveModeModalSub, { color: c.textSecondary }]}>From?, To?, Car capacity, Cost (all required)</Text>
                <ScrollView keyboardShouldPersistTaps="handled" style={styles.driveModeModalScroll}>
                  <View style={[styles.routePickerRow, { borderBottomColor: c.border }]}><Text style={[styles.driveModeLabel, { color: c.textSecondary }]}>From?</Text><HotpointPicker value={driveModeFrom} hotpoints={hotpoints} onSelect={setDriveModeFrom} placeholder="From?" triggerStyle={[styles.driveModeTrigger, { borderBottomColor: c.border }]} /></View>
                  <View style={[styles.routePickerRow, { borderBottomColor: c.border }]}><Text style={[styles.driveModeLabel, { color: c.textSecondary }]}>To?</Text><HotpointPicker value={driveModeTo} hotpoints={hotpoints} onSelect={setDriveModeTo} placeholder="To?" triggerStyle={[styles.driveModeTrigger, { borderBottomColor: c.border }]} /></View>
                  <View style={[styles.routePickerRow, { borderBottomColor: c.border }]}><Text style={[styles.driveModeLabel, { color: c.textSecondary }]}>Car capacity</Text><TextInput style={[styles.driveModeInput, { color: c.text, borderColor: c.border }]} placeholder="e.g. 4" placeholderTextColor={c.textSecondary} value={driveModeSeats === 0 ? '' : String(driveModeSeats)} keyboardType="number-pad" onChangeText={(t) => setDriveModeSeats(Math.max(0, parseInt(t, 10) || 0))} /></View>
                  <View style={[styles.routePickerRow, { borderBottomColor: c.border }]}><Text style={[styles.driveModeLabel, { color: c.textSecondary }]}>Cost</Text><TextInput style={[styles.driveModeInput, { color: c.text, borderColor: c.border }]} placeholder="Price per seat (RWF)" placeholderTextColor={c.textSecondary} value={driveModeCost} keyboardType="number-pad" onChangeText={setDriveModeCost} /></View>
                </ScrollView>
                <View style={styles.driveModeModalFooter}>
                  <TouchableOpacity style={[styles.driveModeCancelBtn, { borderColor: c.border }]} onPress={() => setDriveModeModalVisible(false)}><Text style={[styles.driveModeCancelText, { color: c.text }]}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.driveModeSubmitBtn, { backgroundColor: d.primary }]} onPress={async () => { if (!user?.id || !driveModeFrom || !driveModeTo) { Alert.alert('Required', 'Please set From?, To?, Car capacity, and Cost.'); return; } const seats = driveModeSeats >= 1 ? driveModeSeats : 0; const cost = parseInt(driveModeCost, 10); if (seats < 1 || isNaN(cost) || cost < 0) { Alert.alert('Required', 'Car capacity must be at least 1 and Cost must be a valid number.'); return; } try { await setDriverDriveMode({ driverId: user.id, fromId: driveModeFrom.id, toId: driveModeTo.id, seatsAvailable: seats, pricePerSeat: cost }); setDriverModeOn(true); setDriveModeStatus({ inDriveMode: true, from: driveModeFrom, to: driveModeTo, seatsAvailable: seats, pricePerSeat: cost, driver: user, updatedAt: new Date().toISOString() }); setDriveModeModalVisible(false); toast?.showToast('Instant Mode: ON'); } catch (e) { Alert.alert('Error', e instanceof Error ? e.message : 'Could not turn on drive mode.'); } }}><Text style={[styles.driveModeSubmitText, { color: d.onPrimary }]}>Turn on drive mode</Text></TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      ) : (
        <>
      <LandingHeader
        title={isScanner ? 'Scanner' : currentRole === 'agency' ? 'Agency' : 'Hello, ' + getGreetingName(user?.displayName ?? user?.email ?? '') + '!'}
        subtitle={
          isScanner
            ? 'Scan & activities'
            : currentRole === 'agency'
              ? 'Reports and overview'
              : scheduledCount > 0
                ? `You have ${scheduledCount} ride${scheduledCount === 1 ? '' : 's'} scheduled today`
                : 'Trips and activities'
        }
      />
      {/* Avatar row (and scanner logout) below landing header */}
      <View style={[styles.headerRow, { marginBottom: effectiveSpacing.md }]}>
        <View style={styles.headerTextWrap}>
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
                  {formatRatingValue(ratingSummary?.average, '0.0')} <Ionicons name="star" size={10} color={colors.starRating} />
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
              <View style={[styles.driverModeIconWrap, { backgroundColor: c.appBackground }]}>
                <Ionicons name="car-sport" size={20} color={c.primary} />
              </View>
              <View>
                <Text style={[styles.driverModeTitle, { color: c.text }]}>Driver mode</Text>
                <Text style={[styles.driverModeSub, { color: c.textSecondary }]}>
                  {driverModeOn && driveModeStatus && driveModeStatus.inDriveMode
                    ? `I will be here ${driveModeStatus.from?.name ?? '—'} going there ${driveModeStatus.to?.name ?? '—'}`
                    : 'Visible to passengers'}
                </Text>
              </View>
            </View>
            <Switch
              value={driverModeOn}
              onValueChange={(val) => {
                if (val) {
                  setDriveModeModalVisible(true);
                } else {
                  if (user?.id) {
                    clearDriverDriveMode(user.id).then(() => {
                      setDriverModeOn(false);
                      setDriveModeStatus(null);
                    }).catch(() => setDriverModeOn(false));
                  } else {
                    setDriverModeOn(false);
                  }
                }
              }}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.background}
            />
          </View>
          <Modal visible={driveModeModalVisible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
              <View style={[styles.driveModeSheet, { backgroundColor: c.appBackground }]}>
                <Text style={[styles.driveModeModalTitle, { color: c.text }]}>Set your route</Text>
                <Text style={[styles.driveModeModalSub, { color: c.textSecondary }]}>From?, To?, Car capacity, Cost (all required)</Text>
                <ScrollView keyboardShouldPersistTaps="handled" style={styles.driveModeModalScroll}>
                  <View style={[styles.routePickerRow, { borderBottomColor: c.border }]}>
                    <Text style={[styles.driveModeLabel, { color: c.textSecondary }]}>From?</Text>
                    <HotpointPicker
                      value={driveModeFrom}
                      hotpoints={hotpoints}
                      onSelect={setDriveModeFrom}
                      placeholder="From?"
                      triggerStyle={[styles.driveModeTrigger, { borderBottomColor: c.border }]}
                    />
                  </View>
                  <View style={[styles.routePickerRow, { borderBottomColor: c.border }]}>
                    <Text style={[styles.driveModeLabel, { color: c.textSecondary }]}>To?</Text>
                    <HotpointPicker
                      value={driveModeTo}
                      hotpoints={hotpoints}
                      onSelect={setDriveModeTo}
                      placeholder="To?"
                      triggerStyle={[styles.driveModeTrigger, { borderBottomColor: c.border }]}
                    />
                  </View>
                  <View style={[styles.routePickerRow, { borderBottomColor: c.border }]}>
                    <Text style={[styles.driveModeLabel, { color: c.textSecondary }]}>Car capacity</Text>
                    <TextInput
                      style={[styles.driveModeInput, { color: c.text, borderColor: c.border }]}
                      placeholder="e.g. 4"
                      placeholderTextColor={c.textSecondary}
                      value={driveModeSeats === 0 ? '' : String(driveModeSeats)}
                      keyboardType="number-pad"
                      onChangeText={(t) => setDriveModeSeats(Math.max(0, parseInt(t, 10) || 0))}
                    />
                  </View>
                  <View style={[styles.routePickerRow, { borderBottomColor: c.border }]}>
                    <Text style={[styles.driveModeLabel, { color: c.textSecondary }]}>Cost</Text>
                    <TextInput
                      style={[styles.driveModeInput, { color: c.text, borderColor: c.border }]}
                      placeholder="Price per seat (RWF)"
                      placeholderTextColor={c.textSecondary}
                      value={driveModeCost}
                      keyboardType="number-pad"
                      onChangeText={setDriveModeCost}
                    />
                  </View>
                </ScrollView>
                <View style={styles.driveModeModalFooter}>
                  <TouchableOpacity
                    style={[styles.driveModeCancelBtn, { borderColor: c.border }]}
                    onPress={() => setDriveModeModalVisible(false)}
                  >
                    <Text style={[styles.driveModeCancelText, { color: c.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.driveModeSubmitBtn, { backgroundColor: c.primary }]}
                    onPress={async () => {
                      if (!user?.id || !driveModeFrom || !driveModeTo) {
                        Alert.alert('Required', 'Please set From?, To?, Car capacity, and Cost.');
                        return;
                      }
                      const seats = driveModeSeats >= 1 ? driveModeSeats : 0;
                      const cost = parseInt(driveModeCost, 10);
                      if (seats < 1 || isNaN(cost) || cost < 0) {
                        Alert.alert('Required', 'Car capacity must be at least 1 and Cost must be a valid number.');
                        return;
                      }
                      try {
                        await setDriverDriveMode({
                          driverId: user.id,
                          fromId: driveModeFrom.id,
                          toId: driveModeTo.id,
                          seatsAvailable: seats,
                          pricePerSeat: cost,
                        });
                        setDriverModeOn(true);
                        setDriveModeStatus({
                          inDriveMode: true,
                          from: driveModeFrom,
                          to: driveModeTo,
                          seatsAvailable: seats,
                          pricePerSeat: cost,
                          driver: user,
                          updatedAt: new Date().toISOString(),
                        });
                        setDriveModeModalVisible(false);
                      } catch (e) {
                        Alert.alert('Error', e instanceof Error ? e.message : 'Could not turn on drive mode.');
                      }
                    }}
                  >
                    <Text style={[styles.driveModeSubmitText, { color: c.onPrimary }]}>Turn on drive mode</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
          {user?.roles?.length && user.roles.length > 1 ? (
            <View style={{ marginBottom: effectiveSpacing.md }}>
              <RoleToggle
                currentRole={currentRole}
                onSwitch={switchRole}
                hasApprovedVehicle={hasApprovedVehicle}
                availableRoles={user.roles}
                onNavigateToVehicleGarage={() => rootNavigate('VehicleGarage')}
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
                  onPress={() => rootNavigate('DriverActivityListStack')}
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
                onPress={() => rootNavigate('DriverActivityListStack')}
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
          onPress={() => rootNavigate('DriverActivityListStack')}
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
        </>
      )}
      <CarRefreshIndicator state={refreshState} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {},
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
  avatar: { width: sizes.avatar.lg, height: sizes.avatar.lg, borderRadius: sizes.avatar.lg / 2, borderWidth: borderWidths.medium },
  avatarPlaceholder: { width: sizes.avatar.lg, height: sizes.avatar.lg, borderRadius: sizes.avatar.lg / 2, borderWidth: borderWidths.medium, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: typography.time,
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: sizes.timelineDotLg,
    height: sizes.timelineDotLg,
    borderRadius: radii.xs,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  heroCard: {
    borderRadius: cardRadius,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  heroInner: { zIndex: 1 },
  heroLabel: { ...typography.caption, color: colors.onDarkTextMuted, marginBottom: spacing.xs },
  heroAmount: { ...typography.h1, color: colors.onDarkText, marginBottom: spacing.sm },
  heroViewBtn: { alignSelf: 'flex-start', paddingVertical: spacing.smDense, paddingHorizontal: spacing.sm, backgroundColor: colors.surfaceOnDark, borderRadius: radii.md },
  heroViewBtnText: { ...typography.caption, fontWeight: '600', color: colors.onDarkText },
  heroPills: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  heroPill: { flex: 1, backgroundColor: colors.surfaceOnDarkSubtle, borderRadius: radii.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, alignItems: 'center' },
  heroPillLabel: { ...typography.caption10, fontWeight: '600', color: colors.onDarkTextMuted, letterSpacing: 0.5 },
  heroPillValue: { ...typography.bodySmall, fontWeight: '700', color: colors.onDarkText },
  heroOrb: { position: 'absolute', right: -spacing.xl, bottom: -spacing.xl, width: spacing.xl * 5, height: spacing.xl * 5, borderRadius: (spacing.xl * 5) / 2, backgroundColor: colors.surfaceOnDarkOrb },
  actionButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 100,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  primaryActionText: { ...typography.bodySmall, fontWeight: '700' },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  secondaryActionText: { ...typography.bodySmall, fontWeight: '600' },
  scannerTicketBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
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
    borderRadius: radii.button,
  },
  driverModeLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  driverModeIconWrap: { width: sizes.touchTarget.iconButton, height: sizes.touchTarget.iconButton, borderRadius: radii.button, alignItems: 'center', justifyContent: 'center' },
  driverModeTitle: { ...typography.bodySmall, fontWeight: '600' },
  driverModeSub: { ...typography.caption, marginTop: tightGap },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlayModal,
  },
  driveModeSheet: {
    borderTopLeftRadius: radii.button,
    borderTopRightRadius: radii.button,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  driveModeModalTitle: { ...typography.h3, marginBottom: spacing.xs },
  driveModeModalSub: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  driveModeModalScroll: { maxHeight: 320 },
  routePickerRow: { marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1 },
  driveModeLabel: { ...typography.caption, marginBottom: spacing.xs },
  driveModeTrigger: { borderBottomWidth: 1, paddingVertical: spacing.sm },
  driveModeInput: {
    borderWidth: 1,
    borderRadius: radii.smMedium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  driveModeModalFooter: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  driveModeCancelBtn: { flex: 1, paddingVertical: spacing.sm + spacing.xs, borderRadius: radii.smMedium, borderWidth: 1, alignItems: 'center' },
  driveModeCancelText: { ...typography.bodySmall, fontWeight: '600' },
  driveModeSubmitBtn: { flex: 1, paddingVertical: spacing.sm + spacing.xs, borderRadius: radii.smMedium, alignItems: 'center' },
  driveModeSubmitText: { ...typography.bodySmall, fontWeight: '700' },
  nextRideSection: { marginBottom: spacing.lg },
  nextRideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.sm },
  nextRideBadge: { ...typography.caption, fontWeight: '600' },
  sectionTitle: { ...sectionTitleStyle },
  nextRideCard: {
    borderRadius: cardRadius,
    padding: spacing.lg,
    borderWidth: 1,
  },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  routeCol: { flex: 1, position: 'relative' },
  routeLine: {
    position: 'absolute',
    left: 7,
    top: spacing.sm + 2,
    bottom: spacing.sm + 2,
    width: borderWidths.medium,
    backgroundColor: colors.border,
  },
  routeItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, zIndex: 1 },
  routeDot: { width: sizes.timelineDotLg + 4, height: sizes.timelineDotLg + 4, borderRadius: radii.sm, backgroundColor: colors.background, borderWidth: spacing.xs },
  routeDotDest: { width: sizes.timelineDotLg + 4, height: sizes.timelineDotLg + 4, borderRadius: radii.sm, backgroundColor: colors.background, borderWidth: spacing.xs },
  routeLabel: { ...typography.caption },
  routeValue: { ...typography.bodySmall, fontWeight: '600' },
  nextRidePriceWrap: { alignItems: 'flex-end' },
  nextRidePrice: { ...typography.h2 },
  nextRidePriceLabel: { ...typography.caption },
  nextRideDivider: { height: 1, marginVertical: spacing.md },
  nextRideFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  passengerPills: {},
  passengerPillText: { ...typography.caption },
  startRideBtn: { paddingVertical: spacing.sm + tightGap, paddingHorizontal: spacing.lg, borderRadius: radii.smMedium, alignSelf: 'flex-end' },
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
    borderRadius: cardRadius,
    borderWidth: 1,
  },
  agencyCardText: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  agencyReportBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  agencyReportBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  empty: { ...typography.body, color: colors.textSecondary },
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: cardRadius,
    borderWidth: 1,
  },
  activityHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  route: { ...typography.body, color: colors.text, flex: 1 },
  time: { ...typography.caption, color: colors.textSecondary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  // Driver mockup
  driverMockupWrapper: { flex: 1 },
  driverMockupScroll: { flex: 1 },
  driverMockupScrollContent: { paddingHorizontal: driverContentHorizontal, paddingTop: spacing.md },
  driverMockupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: driverContentHorizontal,
    paddingVertical: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
  },
  driverHeaderLeft: {},
  driverGreeting: { ...typography.h2, fontSize: 24, fontWeight: '800' },
  driverHeaderBadges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  driverTierPill: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, backgroundColor: colors.warningTint, borderRadius: radii.xxs },
  driverTierPillText: { fontSize: 9, fontWeight: '800', color: colors.warning, textTransform: 'uppercase' },
  driverRatingBadge: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  driverHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  driverIconBtn: { width: sizes.touchTarget.min, height: sizes.touchTarget.min, borderRadius: radii.lg, backgroundColor: colors.ghostBg, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  driverNotificationDot: { position: 'absolute', top: spacing.smMd, right: spacing.smMd, width: sizes.timelineDot, height: sizes.timelineDot, borderRadius: radii.xxs, backgroundColor: colors.error, borderWidth: 2, borderColor: colors.card },
  driverAvatarWrap: { width: sizes.touchTarget.min, height: sizes.touchTarget.min, borderRadius: radii.lg, overflow: 'hidden', borderWidth: 2 },
  driverAvatar: { width: '100%', height: '100%' },
  driverAvatarPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  driverAvatarInitial: { ...typography.h3 },
  driverWalletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
  },
  driverWalletLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  driverWalletIcon: { width: sizes.touchTarget.iconButton, height: sizes.touchTarget.iconButton, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  driverWalletLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  driverWalletAmount: { ...typography.bodyBold18, fontSize: 18 },
  driverWithdrawBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.button },
  driverWithdrawBtnText: { fontSize: 10, fontWeight: '800', color: colors.onAppPrimary },
  driverInstantModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md + spacing.xs,
    marginBottom: spacing.md,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
  },
  driverInstantModeLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  driverStatusDot: { width: sizes.timelineDotLg, height: sizes.timelineDotLg, borderRadius: radii.xs },
  driverInstantModeTitle: { ...typography.bodySmall, fontWeight: '800' },
  driverInstantModeSub: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  driverLiveBlock: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    alignItems: 'center',
  },
  driverLiveIconWrap: { width: sizes.avatar.lg, height: sizes.avatar.lg, borderRadius: radii.cardLarge, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  driverLiveTitle: { ...typography.bodySmall, fontWeight: '800', marginBottom: spacing.xs },
  driverLiveSub: { fontSize: 12, fontWeight: '700' },
  driverSection: { marginBottom: spacing.lg },
  driverSectionTitle: { ...typography.bodyBold18, marginBottom: spacing.md },
  driverActiveTripCard: {
    borderRadius: radii.cardXLarge,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  driverActiveTripCardEmpty: { borderWidth: 1, alignItems: 'center', paddingVertical: spacing.xl },
  driverActiveTripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  driverInProgressPill: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.full },
  driverInProgressPillText: { fontSize: 10, fontWeight: '700', color: colors.onAppPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  driverLiveIndicator: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  driverLiveDot: { width: sizes.timelineDot, height: sizes.timelineDot, borderRadius: radii.xxs, backgroundColor: colors.error },
  driverLiveLabel: { fontSize: 12, fontWeight: '700', color: colors.onAppPrimaryMuted },
  driverRouteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  driverRouteLine: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  driverRouteLineInner: { flex: 1, height: 1, backgroundColor: colors.onAppPrimarySoft },
  driverRouteCode: { fontSize: 22, fontWeight: '800', color: colors.onAppPrimary },
  driverRouteCity: { fontSize: 10, fontWeight: '700', color: colors.onAppPrimaryMuted, textTransform: 'uppercase' },
  driverPassengerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceOverlay, borderRadius: radii.lg, padding: spacing.md },
  driverPassengerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  driverPassengerAvatar: { width: sizes.touchTarget.iconButton, height: sizes.touchTarget.iconButton, borderRadius: radii.xl, borderWidth: 2 },
  driverPassengerLabel: { fontSize: 10, fontWeight: '700', color: colors.onAppPrimaryMuted, textTransform: 'uppercase' },
  driverPassengerName: { fontSize: 12, fontWeight: '800', color: colors.onAppPrimary },
  driverViewRideBtn: { marginTop: spacing.md, paddingVertical: spacing.sm + spacing.xs, paddingHorizontal: spacing.lg, borderRadius: radii.button, alignSelf: 'stretch', alignItems: 'center' },
  driverViewRideBtnText: { fontSize: 12, fontWeight: '800', color: colors.onAppPrimary },
  driverNoActiveTrip: { ...typography.bodySmall, marginBottom: spacing.md },
  driverPendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    gap: spacing.md,
  },
  driverPendingAvatar: { width: sizes.avatar.lg, height: sizes.avatar.lg, borderRadius: radii.lg },
  driverPendingBody: { flex: 1 },
  driverPendingName: { ...typography.bodySmall, fontWeight: '700' },
  driverPendingMeta: { fontSize: 10, color: colors.textSecondary },
  driverPendingActions: { flexDirection: 'row', gap: spacing.sm },
  driverApproveBtn: { padding: spacing.sm, backgroundColor: colors.successTint, borderRadius: radii.button },
  driverRejectBtn: { padding: spacing.sm, backgroundColor: colors.errorTint, borderRadius: radii.button },
});
