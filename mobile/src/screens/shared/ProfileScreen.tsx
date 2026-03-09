import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { useRootNavigation } from '../../context/RootNavigationContext';
import { getDriverRatingSummary, getUserBookings, getUserVehicles } from '../../services/api';
import { formatRatingValue, Screen } from '../../components';
import { useResponsiveThemeContext } from '../../context/ResponsiveThemeContext';
import { useThemeContext, useThemeColors } from '../../context/ThemeContext';
import { useDriverTheme } from '../../context/DriverThemeContext';
import { spacing, typography, radii, sizes, colors } from '../../utils/theme';
import { openWhatsAppDispute } from '../../utils/whatsapp';
import { strings } from '../../constants/strings';

function getRoleAccent(role: string, isScanner: boolean, c: ReturnType<typeof useThemeColors>) {
  if (isScanner) return c.agency;
  if (role === 'driver') return c.passengerDark;
  if (role === 'agency') return c.agency;
  return c.primary;
}

/** Single menu row: icon in rounded box, label, optional value, chevron (mockup style). */
function MenuRow({
  icon,
  label,
  value,
  onPress,
  accentColor,
  themeColors,
  iconName,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  onPress: () => void;
  accentColor: string;
  themeColors: ReturnType<typeof useThemeColors>;
  iconName?: keyof typeof Ionicons.glyphMap;
}) {
  const name = iconName ?? icon;
  return (
    <TouchableOpacity
      style={[styles.menuRow, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.menuRowIconBox, { backgroundColor: themeColors.ghostBg }]}>
        <Ionicons name={name} size={20} color={themeColors.textMuted} />
      </View>
      <Text style={[styles.menuRowLabel, { color: themeColors.text }]} numberOfLines={1}>
        {label}
      </Text>
      {value != null && value !== '' ? (
        <Text style={[styles.menuRowValue, { color: accentColor }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { rootNavigate } = useRootNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { currentRole, agencySubRole } = useRole();
  const responsive = useResponsiveThemeContext();
  const themeContext = useThemeContext();
  const themeColors = useThemeColors();
  const effectiveSpacing = responsive?.spacing ?? spacing;
  const effectiveTypography = responsive?.typography ?? typography;
  const isScanner = currentRole === 'agency' && agencySubRole === 'agency_scanner';
  const [driverRatingSummary, setDriverRatingSummary] = React.useState<{ average: number; count: number } | null>(null);
  const [completedRidesCount, setCompletedRidesCount] = React.useState<number>(0);
  const [firstVehicle, setFirstVehicle] = React.useState<{ make: string; model: string; licensePlate: string } | null>(null);

  const isDriverOrAgency =
    (user?.roles?.includes('driver') || user?.roles?.includes('agency')) ?? false;

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
      if (currentRole !== 'driver' || !user) {
        setFirstVehicle(null);
        return;
      }
      const list = await getUserVehicles(user.id);
      const approved = list.filter((v) => v.approvalStatus === 'approved');
      if (approved[0]) {
        setFirstVehicle({ make: approved[0].make, model: approved[0].model, licensePlate: approved[0].licensePlate });
      } else {
        setFirstVehicle(null);
      }
    };
    void load();
  }, [currentRole, user?.id]);

  React.useEffect(() => {
    const load = async () => {
      if (currentRole !== 'passenger' || !user) {
        setCompletedRidesCount(0);
        return;
      }
      const bookings = await getUserBookings(user.id);
      setCompletedRidesCount(bookings.filter((b) => b.status === 'completed').length);
    };
    void load();
  }, [currentRole, user?.id]);

  const handleLogout = () => {
    Alert.alert(strings.auth.logOut, strings.auth.logOutConfirm, [
      { text: strings.common.cancel, style: 'cancel' },
      { text: strings.auth.logOut, style: 'destructive', onPress: logout },
    ]);
  };

  const roleLabel =
    isScanner ? strings.profile.scannerRole : currentRole === 'driver' ? strings.profile.driver : currentRole === 'agency' ? strings.profile.agency : strings.profile.passenger;
  const accent = getRoleAccent(currentRole, isScanner, themeColors);

  const totalTripsStat = currentRole === 'passenger' ? completedRidesCount : (driverRatingSummary?.count ?? 0);
  const statsTotalTrips = totalTripsStat || 0;
  const statsKm = 0; // placeholder until API
  const statsCo2 = '0kg'; // placeholder until API

  const driverTheme = useDriverTheme();
  const isDriverProfile = currentRole === 'driver' && !isScanner;
  const d = driverTheme?.colors;

  if (isDriverProfile && d) {
    const memberYear = (user as { createdAt?: string })?.createdAt ? new Date((user as { createdAt: string }).createdAt).getFullYear() : 2023;
    return (
      <Screen
        scroll
        style={[styles.container, { backgroundColor: themeColors.appBackground }]}
        contentContainerStyle={[styles.content, { paddingTop: 0, paddingBottom: effectiveSpacing.xxl }]}
      >
        <View style={[styles.driverProfileHeader, { backgroundColor: themeColors.card, paddingTop: insets.top + effectiveSpacing.xl, paddingBottom: effectiveSpacing.lg }]}>
          <View style={styles.driverProfileAvatarWrap}>
            <TouchableOpacity style={[styles.driverProfileAvatar, { borderColor: themeColors.card }]} onPress={() => rootNavigate('EditProfile')}>
              {user?.avatarUri ? (
                <Image source={{ uri: user.avatarUri }} style={styles.driverProfileAvatarImg} />
              ) : (
                <View style={[styles.driverProfileAvatarPlaceholder, { backgroundColor: themeColors.surface }]}>
                  <Ionicons name="person" size={48} color={themeColors.textMuted} />
                </View>
              )}
            </TouchableOpacity>
            <View style={[styles.driverProfileVerifiedBadge, { backgroundColor: d.instaGreen }]}>
              <Ionicons name="checkmark" size={16} color={themeColors.onAppPrimary} />
            </View>
          </View>
          <Text style={[styles.driverProfileName, { color: d.primary }]}>{user?.name ?? strings.common.guest}</Text>
          <Text style={[styles.driverProfileMember, { color: themeColors.textMuted }]}>Member since {memberYear}</Text>
        </View>

        <View style={[styles.driverProfileStatsRow, { paddingHorizontal: spacing.lg, marginTop: -24 }]}>
          <TouchableOpacity style={[styles.driverProfileStatCard, styles.driverProfileStatCardPrimary, { backgroundColor: d.primary }]} onPress={() => rootNavigate('VehicleGarage')}>
            <Text style={[styles.driverProfileStatValue, { color: themeColors.onAppPrimary }]}>{firstVehicle ? `${firstVehicle.make} ${firstVehicle.model}` : 'My Vehicle'}</Text>
            <Text style={[styles.driverProfileStatLabel, { color: themeColors.onAppPrimaryMuted }]}>{firstVehicle?.licensePlate ?? 'Add vehicle'}</Text>
          </TouchableOpacity>
          <View style={[styles.driverProfileStatCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}>
            <Text style={[styles.driverProfileStatValue, { color: d.primary }]}>{formatRatingValue(driverRatingSummary?.average ?? user?.rating ?? 0, '0.0')}</Text>
            <Text style={[styles.driverProfileStatLabel, { color: themeColors.textMuted }]}>LIFETIME RATING</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.preferencesCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}>
            <MenuRow icon="settings-outline" iconName="settings-outline" label="Preferences" onPress={() => rootNavigate('EditProfile')} accentColor={d.accent} themeColors={themeColors} />
            <MenuRow iconName="shield-checkmark-outline" icon="shield-checkmark-outline" label="Privacy & Security" onPress={() => navigation.navigate('Privacy')} accentColor={d.accent} themeColors={themeColors} />
            <TouchableOpacity style={[styles.driverProfileLogout, { backgroundColor: themeColors.errorTint }]} onPress={handleLogout} activeOpacity={0.85}>
              <Text style={[styles.driverProfileLogoutText, { color: themeColors.error }]}>{strings.auth.logOut}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionOverline, { color: themeColors.textMuted }]}>{strings.profile.account}</Text>
          <MenuRow iconName="notifications-outline" icon="notifications-outline" label={strings.profile.notificationSettings} onPress={() => navigation.navigate('Notifications')} accentColor={d.accent} themeColors={themeColors} />
          <MenuRow iconName="wallet-outline" icon="wallet-outline" label={strings.profile.withdrawalMethods} onPress={() => rootNavigate('WithdrawalMethods')} accentColor={d.accent} themeColors={themeColors} />
          <MenuRow iconName="car-sport-outline" icon="car-sport-outline" label={strings.profile.myVehicles} onPress={() => rootNavigate('VehicleGarage')} accentColor={d.accent} themeColors={themeColors} />
          <MenuRow iconName="stats-chart-outline" icon="stats-chart-outline" label={strings.profile.viewAllActivities} onPress={() => rootNavigate('DriverActivityListStack')} accentColor={d.accent} themeColors={themeColors} />
          <MenuRow iconName="cash-outline" icon="cash-outline" label={strings.nav.earnings} onPress={() => rootNavigate('Earnings')} accentColor={d.accent} themeColors={themeColors} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      style={[styles.container, { backgroundColor: themeColors.appBackground }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: 0, paddingBottom: effectiveSpacing.xxl },
      ]}
    >
      {/* Header block (mockup: white, rounded bottom, avatar, verified, rating, stats grid) */}
      <View style={[styles.profileHeader, { backgroundColor: themeColors.card, paddingTop: effectiveSpacing.xl + insets.top, paddingBottom: effectiveSpacing.lg }]}>
        <View style={styles.profileHeaderRow}>
          <View style={styles.avatarWrap}>
            <TouchableOpacity
              style={[styles.avatar, styles.avatarRounded, { borderColor: themeColors.card }]}
              onPress={() => rootNavigate('EditProfile')}
              activeOpacity={0.85}
            >
              {user?.avatarUri ? (
                <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.surface }]}>
                  <Ionicons name="person" size={44} color={themeColors.textMuted} />
                </View>
              )}
            </TouchableOpacity>
            <View style={[styles.onlineDot, { backgroundColor: themeColors.success }]} />
          </View>
          <View style={styles.profileHeaderInfo}>
            <Text style={[styles.profileName, effectiveTypography.h2, { color: themeColors.text }]}>
              {user?.name ?? strings.common.guest}
            </Text>
            <Text style={[styles.verifiedLabel, { color: accent }]}>{roleLabel}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={themeColors.starRating ?? themeColors.warning} />
              <Text style={[styles.ratingValue, { color: themeColors.text }]}>
                {formatRatingValue(user?.rating ?? driverRatingSummary?.average ?? 0, '0.00')}
              </Text>
              <Text style={[styles.ridesCount, { color: themeColors.textMuted }]}>
                ({statsTotalTrips} Rides)
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: themeColors.primaryTint ?? themeColors.ghostBg }]}>
            <Text style={[styles.statValue, { color: themeColors.primary }]}>{statsTotalTrips}</Text>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>Total Trips</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: themeColors.successTint ?? themeColors.ghostBg }]}>
            <Text style={[styles.statValue, { color: themeColors.success }]}>{statsKm === 0 ? '—' : `${(statsKm / 1000).toFixed(1)}k`}</Text>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>KM Traveled</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: themeColors.warningTint ?? themeColors.ghostBg }]}>
            <Text style={[styles.statValue, { color: themeColors.warning }]}>{statsCo2}</Text>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>CO2 Saved</Text>
          </View>
        </View>
      </View>

      {/* Preferences (mockup: Account Details, Security & Safety, Log Out) */}
      <View style={styles.section}>
        <Text style={[styles.sectionOverline, { color: themeColors.textMuted }]}>
          Preferences
        </Text>
        <View style={[styles.preferencesCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}>
          <MenuRow
            icon="person-outline"
            iconName="person-outline"
            label="Account Details"
            onPress={() => rootNavigate('EditProfile')}
            accentColor={accent}
            themeColors={themeColors}
          />
          <MenuRow
            iconName="shield-checkmark-outline"
            icon="shield-checkmark-outline"
            label="Security & Safety"
            onPress={() =>
              Alert.alert(
                strings.profile.passwordAndSecurity,
                'To change your password, sign out and use "Forgot password?" on the login screen.',
                [{ text: strings.common.ok }]
              )
            }
            accentColor={accent}
            themeColors={themeColors}
          />
          <TouchableOpacity
            style={[styles.logoutRow, { backgroundColor: themeColors.errorTint ?? themeColors.ghostBg }]}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <View style={[styles.menuRowIconBox, { backgroundColor: themeColors.errorTint ?? themeColors.ghostBg }]}>
              <Ionicons name="log-out-outline" size={20} color={themeColors.error} />
            </View>
            <Text style={[styles.logoutRowLabel, { color: themeColors.error }]}>{strings.auth.logOut}</Text>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* About you */}
      <View style={styles.section}>
        <Text style={[styles.sectionOverline, { color: themeColors.textMuted }]}>
          {strings.profile.aboutYou}
        </Text>
        {isDriverOrAgency && !isScanner ? (
          <MenuRow
            icon="car-sport-outline"
            iconName="car-sport-outline"
            label={strings.profile.vehicle}
            onPress={() => rootNavigate('VehicleGarage')}
            accentColor={accent}
            themeColors={themeColors}
          />
        ) : null}
        {currentRole === 'driver' && (driverRatingSummary != null || (user?.rating != null)) ? (
          <MenuRow
            icon="star-outline"
            iconName="star-outline"
            label={strings.profile.ratingsAndReviews}
            value={formatRatingValue(driverRatingSummary?.average ?? user?.rating ?? 0, '0.0')}
            onPress={() => {}}
            accentColor={accent}
            themeColors={themeColors}
          />
        ) : null}
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={[styles.sectionOverline, { color: themeColors.textMuted }]}>
          {strings.profile.account}
        </Text>
        <MenuRow
          iconName="notifications-outline"
          icon="notifications-outline"
          label={strings.profile.notificationSettings}
          onPress={() => navigation.navigate('Notifications')}
          accentColor={accent}
          themeColors={themeColors}
        />
        <MenuRow
          iconName="shield-checkmark-outline"
          icon="shield-checkmark-outline"
          label={strings.profile.passwordAndSecurity}
          onPress={() =>
            Alert.alert(
              strings.profile.passwordAndSecurity,
              'To change your password, sign out and use "Forgot password?" on the login screen.',
              [{ text: strings.common.ok }]
            )
          }
          accentColor={accent}
          themeColors={themeColors}
        />
        {!isDriverOrAgency ? (
          <MenuRow
            iconName="wallet-outline"
            icon="wallet-outline"
            label={strings.nav.wallet}
            onPress={() => rootNavigate('Wallet')}
            accentColor={accent}
            themeColors={themeColors}
          />
        ) : null}
        <MenuRow
          iconName={isDriverOrAgency ? 'wallet-outline' : 'card-outline'}
          icon="card-outline"
          label={isDriverOrAgency ? strings.profile.withdrawalMethods : strings.profile.linkedAccounts}
          onPress={() =>
            navigation.navigate(isDriverOrAgency ? ('WithdrawalMethods' as never) : ('PaymentMethods' as never))
          }
          accentColor={accent}
          themeColors={themeColors}
        />
        <MenuRow
          iconName="contrast-outline"
          icon="contrast-outline"
          label={strings.profile.appearance}
          value={themeContext?.colorScheme === 'dark' ? strings.profile.dark : strings.profile.light}
          onPress={() => themeContext?.setColorScheme(themeContext.colorScheme === 'light' ? 'dark' : 'light')}
          accentColor={accent}
          themeColors={themeColors}
        />
        <MenuRow
          iconName="shield-outline"
          icon="shield-outline"
          label={strings.profile.privacy}
          onPress={() => navigation.navigate('Privacy')}
          accentColor={accent}
          themeColors={themeColors}
        />
        <MenuRow
          iconName="document-text-outline"
          icon="document-text-outline"
          label={strings.nav.termsOfService}
          onPress={() => rootNavigate('TermsOfService')}
          accentColor={accent}
          themeColors={themeColors}
        />
        <MenuRow
          iconName="help-circle-outline"
          icon="help-circle-outline"
          label={strings.nav.faq}
          onPress={() => rootNavigate('FAQ')}
          accentColor={accent}
          themeColors={themeColors}
        />
        <MenuRow
          iconName="information-circle-outline"
          icon="information-circle-outline"
          label={strings.nav.about}
          onPress={() => rootNavigate('About')}
          accentColor={accent}
          themeColors={themeColors}
        />
      </View>

      {/* App (driver/agency) */}
      {isDriverOrAgency && !isScanner ? (
        <View style={styles.section}>
          <Text style={[styles.sectionOverline, { color: themeColors.textMuted }]}>
            {strings.profile.app}
          </Text>
          <MenuRow
            iconName="stats-chart-outline"
            icon="stats-chart-outline"
            label={strings.profile.viewAllActivities}
            onPress={() => rootNavigate('DriverActivityListStack')}
            accentColor={accent}
            themeColors={themeColors}
          />
          <MenuRow
            iconName="car-sport-outline"
            icon="car-sport-outline"
            label={strings.profile.myVehicles}
            onPress={() => rootNavigate('VehicleGarage')}
            accentColor={accent}
            themeColors={themeColors}
          />
          <MenuRow
            iconName="cash-outline"
            icon="cash-outline"
            label={strings.nav.earnings}
            onPress={() => rootNavigate('Earnings')}
            accentColor={accent}
            themeColors={themeColors}
          />
        </View>
      ) : null}

      {/* Scanner: Report only */}
      {isScanner ? (
        <View style={styles.section}>
          <Text style={[styles.sectionOverline, { color: themeColors.textMuted }]}>
            {strings.profile.scanner}
          </Text>
          <MenuRow
            iconName="document-text-outline"
            icon="document-text-outline"
            label={strings.profile.openReport}
            onPress={() => (navigation.getParent() as any)?.navigate('ScannerReport')}
            accentColor={accent}
            themeColors={themeColors}
          />
        </View>
      ) : null}

      {/* Support (non-agency) */}
      {currentRole !== 'agency' ? (
        <View style={styles.section}>
          <Text style={[styles.sectionOverline, { color: themeColors.textMuted }]}>
            {strings.profile.support}
          </Text>
          <MenuRow
            iconName="call-outline"
            icon="call-outline"
            label={strings.profile.hotline}
            onPress={() => navigation.navigate('Hotline')}
            accentColor={accent}
            themeColors={themeColors}
          />
          <MenuRow
            iconName="logo-whatsapp"
            icon="logo-whatsapp"
            label={strings.profile.disputeViaWhatsApp}
            onPress={() => openWhatsAppDispute()}
            accentColor={accent}
            themeColors={themeColors}
          />
        </View>
      ) : null}

    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  profileHeader: {
    borderBottomLeftRadius: radii.xl + 8,
    borderBottomRightRadius: radii.xl + 8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.cardShadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 96,
    height: 96,
    overflow: 'hidden',
    borderWidth: 4,
  },
  avatarRounded: { borderRadius: radii.xlMobile },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  onlineDot: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: radii.smMedium,
    borderWidth: spacing.xs,
    borderColor: colors.surface,
  },
  profileHeaderInfo: { marginLeft: spacing.lg, flex: 1 },
  profileName: { marginBottom: spacing.xxs },
  verifiedLabel: { ...typography.bodySmall, fontWeight: '700', marginBottom: spacing.xxs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ratingValue: { ...typography.caption, fontWeight: '800' },
  ridesCount: { ...typography.caption, fontSize: 10, fontWeight: '700', marginLeft: spacing.xxs },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  statValue: { ...typography.h2, fontSize: 20, fontWeight: '800' },
  statLabel: { ...typography.caption, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.xxs },
  preferencesCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.sm,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.xs,
  },
  logoutRowLabel: { flex: 1, ...typography.body, fontWeight: '700' },
  section: { marginBottom: spacing.lg },
  sectionOverline: {
    ...typography.overline,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  menuRowIconBox: {
    width: sizes.touchTarget.iconButton,
    height: sizes.touchTarget.iconButton,
    borderRadius: radii.smMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuRowLabel: { flex: 1, ...typography.body, fontWeight: '600' },
  menuRowValue: { ...typography.bodySmall, fontWeight: '700', marginRight: spacing.xs },
  driverProfileHeader: {
    alignItems: 'center',
    borderBottomLeftRadius: spacing.xxl,
    borderBottomRightRadius: spacing.xxl,
  },
  driverProfileAvatarWrap: { position: 'relative', marginBottom: spacing.md },
  driverProfileAvatar: {
    width: 112,
    height: 112,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: spacing.xs,
  },
  driverProfileAvatarImg: { width: '100%', height: '100%' },
  driverProfileAvatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  driverProfileVerifiedBadge: {
    position: 'absolute',
    bottom: -spacing.xs,
    right: -spacing.xs,
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radii.smMedium,
    borderWidth: spacing.xs,
    borderColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverProfileName: { ...typography.h2, fontSize: 24, fontWeight: '800', marginBottom: spacing.xxs },
  driverProfileMember: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  driverProfileStatsRow: { flexDirection: 'row', gap: spacing.md },
  driverProfileStatCard: {
    flex: 1,
    padding: spacing.md + spacing.xs,
    borderRadius: radii.cardLarge ?? 32,
    borderWidth: 1,
  },
  driverProfileStatCardPrimary: { borderWidth: 0 },
  driverProfileStatValue: { ...typography.h2, fontSize: 20, fontWeight: '800', marginBottom: spacing.xxs },
  driverProfileStatLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  driverProfileLogout: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.cardLarge ?? 32,
    alignItems: 'center',
  },
  driverProfileLogoutText: { ...typography.bodySmall, fontWeight: '800' },
});
