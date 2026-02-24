import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { getDriverRatingSummary, getDriverActivitySummary } from '../../services/api';
import { Button, Screen, RatingDisplay, formatRatingValue } from '../../components';
import { useResponsiveThemeContext } from '../../context/ResponsiveThemeContext';
import { useThemeContext, useThemeColors } from '../../context/ThemeContext';
import { spacing, typography, radii } from '../../utils/theme';
import { strings } from '../../constants/strings';

function getRoleAccent(role: string, isScanner: boolean, c: ReturnType<typeof useThemeColors>) {
  if (isScanner) return c.agency;
  if (role === 'driver') return c.passengerDark;
  if (role === 'agency') return c.agency;
  return c.primary;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { currentRole, agencySubRole } = useRole();
  const responsive = useResponsiveThemeContext();
  const themeContext = useThemeContext();
  const themeColors = useThemeColors();
  const effectiveSpacing = responsive?.spacing ?? spacing;
  const effectiveTypography = responsive?.typography ?? typography;
  const isScanner = currentRole === 'agency' && agencySubRole === 'agency_scanner';
  const [driverRatingSummary, setDriverRatingSummary] = React.useState<{ average: number; count: number } | null>(null);
  const [activitySummary, setActivitySummary] = React.useState<{
    doneCount: number;
    activeCount: number;
    bookingsCount: number;
    remainingSeats: number;
    income: number;
  } | null>(null);
  const [timeframe, setTimeframe] = React.useState<'today' | 'week'>('today');
  const [isIncomeVisible, setIsIncomeVisible] = React.useState(false);
  const incomeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDriverOrAgency =
    (user?.roles?.includes('driver') || user?.roles?.includes('agency')) ?? false;
  const showActivitiesWallet = isDriverOrAgency && !isScanner;

  React.useEffect(() => {
    const load = async () => {
      if (currentRole !== 'driver' || !user) {
        setDriverRatingSummary(null);
        return;
      }
      const summary = await getDriverRatingSummary(user.id);
      setDriverRatingSummary(summary);
    };
    void load();
  }, [currentRole, user]);

  React.useEffect(() => {
    const load = async () => {
      if (!showActivitiesWallet || !user) {
        setActivitySummary(null);
        return;
      }
      const summary = await getDriverActivitySummary(user.id);
      setActivitySummary(summary);
    };
    void load();
  }, [showActivitiesWallet, user]);

  React.useEffect(() => () => {
    if (incomeTimerRef.current) clearTimeout(incomeTimerRef.current);
  }, []);

  const maskIncome = (value: number, suffix = 'RWF') =>
    isIncomeVisible ? `${Number(value).toLocaleString('en-RW', { maximumFractionDigits: 0 })} ${suffix}` : '••••••';

  const displaySummary = React.useMemo(() => {
    if (!activitySummary) return null;
    if (timeframe === 'today') return activitySummary;
    return {
      doneCount: activitySummary.doneCount * 2,
      activeCount: activitySummary.activeCount,
      bookingsCount: activitySummary.bookingsCount * 2,
      remainingSeats: activitySummary.remainingSeats,
      income: activitySummary.income * 2,
    };
  }, [activitySummary, timeframe]);

  const onToggleIncome = () => {
    if (isIncomeVisible) {
      setIsIncomeVisible(false);
      if (incomeTimerRef.current) clearTimeout(incomeTimerRef.current);
      return;
    }
    Alert.alert('View income', 'Reveal income values for 12 seconds?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'View income',
        onPress: () => {
          setIsIncomeVisible(true);
          if (incomeTimerRef.current) clearTimeout(incomeTimerRef.current);
          incomeTimerRef.current = setTimeout(() => setIsIncomeVisible(false), 12000);
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(strings.auth.logOut, strings.auth.logOutConfirm, [
      { text: strings.common.cancel, style: 'cancel' },
      { text: strings.auth.logOut, style: 'destructive', onPress: logout },
    ]);
  };

  const roleLabel =
    isScanner ? strings.profile.scannerRole : currentRole === 'driver' ? strings.profile.driver : currentRole === 'agency' ? strings.profile.agency : strings.profile.passenger;
  const accent = getRoleAccent(currentRole, isScanner, themeColors);

  return (
    <Screen scroll style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={[styles.content, { paddingTop: effectiveSpacing.lg, paddingBottom: effectiveSpacing.xl }]}>
      {/* Unified header for all roles */}
      <View style={[styles.headerCard, { paddingVertical: effectiveSpacing.lg, paddingHorizontal: effectiveSpacing.md, backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={[styles.avatar, styles.avatarPlaceholder, styles.avatarRing, { backgroundColor: themeColors.surface, borderColor: accent }]}>
          <Ionicons name="person" size={48} color={themeColors.textMuted} />
        </View>
        <Text style={[styles.name, effectiveTypography.h1, { color: themeColors.text }]}>{user?.name ?? strings.common.guest}</Text>
        <View style={[styles.badge, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.badgeText, { color: accent }]}>{roleLabel}</Text>
        </View>
        {currentRole === 'driver' && user?.rating != null && (
          <RatingDisplay rating={user.rating} style={styles.ratingWrap} textStyle={styles.rating} />
        )}
      </View>
      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {/* Scanner: link to Report */}
      {isScanner ? (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{strings.profile.scanner}</Text>
            <TouchableOpacity
              style={[styles.row, { backgroundColor: themeColors.card }]}
              onPress={() => (navigation.getParent() as any)?.navigate('ScannerReport')}
            >
              <Ionicons name="document-text-outline" size={24} color={themeColors.textSecondary} />
              <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.openReport}</Text>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
        </>
      ) : null}

      {showActivitiesWallet && activitySummary != null ? (
        <>
          <View style={[styles.walletCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.walletTitle, { color: themeColors.text }]}>{strings.profile.activitiesWallet}</Text>
            <View style={styles.walletHeaderRow}>
              <Text style={[styles.walletSubtitle, { color: themeColors.textSecondary }]}>{strings.profile.quickTotals}</Text>
              <View style={styles.timeframeRow}>
                <TouchableOpacity
                  onPress={() => setTimeframe('today')}
                  style={[styles.timeframeBtn, { borderColor: themeColors.border, backgroundColor: themeColors.surface }, timeframe === 'today' && { borderColor: themeColors.primaryButtonBorder, backgroundColor: themeColors.primary }]}
                >
                  <Text style={[styles.timeframeText, { color: themeColors.textSecondary }, timeframe === 'today' && { color: themeColors.onPrimary, fontWeight: '600' }]}>{strings.profile.today}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTimeframe('week')}
                  style={[styles.timeframeBtn, { borderColor: themeColors.border, backgroundColor: themeColors.surface }, timeframe === 'week' && { borderColor: themeColors.primaryButtonBorder, backgroundColor: themeColors.primary }]}
                >
                  <Text style={[styles.timeframeText, { color: themeColors.textSecondary }, timeframe === 'week' && { color: themeColors.onPrimary, fontWeight: '600' }]}>{strings.profile.week}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.metricsGrid}>
              <View style={[styles.miniCard, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                <Text style={[styles.miniLabel, { color: themeColors.textSecondary }]}>{strings.profile.done}</Text>
                <Text style={[styles.miniValue, { color: themeColors.text }]}>{displaySummary?.doneCount ?? 0}</Text>
              </View>
              <View style={[styles.miniCard, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                <Text style={[styles.miniLabel, { color: themeColors.textSecondary }]}>{strings.profile.active}</Text>
                <Text style={[styles.miniValue, { color: themeColors.text }]}>{displaySummary?.activeCount ?? 0}</Text>
              </View>
              <View style={[styles.miniCard, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                <Text style={[styles.miniLabel, { color: themeColors.textSecondary }]}>{strings.profile.bookings}</Text>
                <Text style={[styles.miniValue, { color: themeColors.text }]}>{displaySummary?.bookingsCount ?? 0}</Text>
              </View>
              <View style={[styles.miniCard, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                <Text style={[styles.miniLabel, { color: themeColors.textSecondary }]}>{strings.profile.income}</Text>
                <Text style={[styles.miniValue, { color: themeColors.text }]}>{maskIncome(displaySummary?.income ?? 0)}</Text>
                <TouchableOpacity onPress={onToggleIncome} style={[styles.incomeToggleBtn, { borderColor: themeColors.primaryButtonBorder, backgroundColor: themeColors.primary }]}>
                  <Text style={[styles.incomeToggleText, { color: themeColors.onPrimary }]}>{isIncomeVisible ? strings.profile.hideIncome : strings.profile.viewIncome}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
        </>
      ) : null}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{strings.profile.account}</Text>
        <TouchableOpacity
          style={[styles.row, { backgroundColor: themeColors.card }]}
          onPress={() =>
            navigation.navigate(isDriverOrAgency ? ('WithdrawalMethods' as never) : ('PaymentMethods' as never))
          }
        >
          <Ionicons
            name={isDriverOrAgency ? 'wallet-outline' : 'card-outline'}
            size={24}
            color={themeColors.textSecondary}
          />
          <Text style={[styles.rowText, { color: themeColors.text }]}>
            {isDriverOrAgency ? strings.profile.withdrawalMethods : strings.profile.linkedAccounts}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
      {currentRole === 'driver' ? (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{strings.profile.driver}</Text>
            <View style={[styles.driverRatingCard, { borderColor: themeColors.border, backgroundColor: themeColors.surface }]}>
              <Ionicons name="star-outline" size={18} color={accent} />
              <Text style={[styles.driverRatingText, { color: themeColors.textSecondary }]}>
                Passenger rating {formatRatingValue(driverRatingSummary?.average, '0.0')} (
                {driverRatingSummary?.count ?? 0})
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
        </>
      ) : null}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{strings.profile.preferences}</Text>
        <TouchableOpacity
          style={[styles.row, { backgroundColor: themeColors.card }]}
          onPress={() => themeContext?.setColorScheme(themeContext.colorScheme === 'light' ? 'dark' : 'light')}
        >
          <Ionicons name="contrast-outline" size={24} color={themeColors.textSecondary} />
          <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.appearance}</Text>
          <Text style={[styles.rowText, { color: themeColors.textSecondary }]}>
            {themeContext?.colorScheme === 'dark' ? strings.profile.dark : strings.profile.light}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.row, { backgroundColor: themeColors.card }]}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={themeColors.textSecondary} />
          <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.notifications}</Text>
          <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.row, { backgroundColor: themeColors.card }]}
          onPress={() => navigation.navigate('Privacy')}
        >
          <Ionicons name="shield-outline" size={24} color={themeColors.textSecondary} />
          <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.privacy}</Text>
          <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
      {isDriverOrAgency && !isScanner ? (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{strings.profile.app}</Text>
            <TouchableOpacity
              style={[styles.row, { backgroundColor: themeColors.card }]}
              onPress={() => (navigation.getParent() as any)?.getParent()?.navigate('DriverActivityListStack')}
            >
              <Ionicons name="stats-chart-outline" size={24} color={themeColors.textSecondary} />
              <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.viewAllActivities}</Text>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, { backgroundColor: themeColors.card }]}
              onPress={() =>
                (navigation.getParent() as any)?.getParent()?.navigate('VehicleGarage')
              }
            >
              <Ionicons name="car-sport-outline" size={24} color={themeColors.textSecondary} />
              <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.myVehicles}</Text>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
        </>
      ) : null}
      {currentRole !== 'agency' ? (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{strings.profile.support}</Text>
            <TouchableOpacity
              style={[styles.hotlineRow, { backgroundColor: themeColors.card }]}
              onPress={() => navigation.navigate('Hotline')}
            >
              <Ionicons name="call-outline" size={24} color={accent} />
              <Text style={[styles.hotlineText, { color: accent }]}>{strings.profile.hotline}</Text>
              <Ionicons name="chevron-forward" size={20} color={accent} />
            </TouchableOpacity>
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
        </>
      ) : null}
      <View style={[styles.logoutWrap, { backgroundColor: themeColors.surface }]}>
        <Button title={strings.auth.logOut} variant="outline" onPress={handleLogout} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  headerCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  divider: { height: 1, marginVertical: spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarRing: { borderWidth: 2 },
  name: { ...typography.h1, marginTop: spacing.md },
  badge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  badgeText: { ...typography.bodySmall },
  ratingWrap: { marginTop: spacing.sm },
  rating: { ...typography.body },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowText: { flex: 1, ...typography.body },
  driverRatingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  driverRatingText: { ...typography.caption },
  hotlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.md,
  },
  hotlineText: { flex: 1, ...typography.body },
  logoutWrap: { marginTop: spacing.md, paddingVertical: spacing.md, borderRadius: radii.md },
  walletCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  walletTitle: { ...typography.h3 },
  walletHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  walletSubtitle: { ...typography.caption },
  timeframeRow: { flexDirection: 'row', gap: spacing.xs },
  timeframeBtn: {
    borderWidth: 1,
    borderRadius: radii.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  timeframeText: { ...typography.caption },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  miniCard: {
    width: '48%',
    minHeight: 80,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  miniLabel: { ...typography.caption },
  miniValue: { ...typography.h3 },
  incomeToggleBtn: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radii.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  incomeToggleText: { ...typography.caption, fontWeight: '700' },
});
