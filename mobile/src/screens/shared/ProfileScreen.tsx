import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { useRootNavigation } from '../../context/RootNavigationContext';
import { getDriverRatingSummary } from '../../services/api';
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
    <Screen scroll style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={[styles.content, { paddingTop: effectiveSpacing.lg + insets.top, paddingBottom: effectiveSpacing.xl }]}>
      {/* Unified header for all roles */}
      <View style={[styles.headerCard, { paddingVertical: effectiveSpacing.lg, paddingHorizontal: effectiveSpacing.md, backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <TouchableOpacity
          style={[styles.avatar, styles.avatarRing, { borderColor: accent }]}
          onPress={() => rootNavigate('EditProfile')}
          activeOpacity={0.85}
        >
          {user?.avatarUri ? (
            <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.surface }]}>
              <Ionicons name="person" size={48} color={themeColors.textMuted} />
            </View>
          )}
        </TouchableOpacity>
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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{strings.profile.account}</Text>
        <TouchableOpacity
          style={[styles.row, { backgroundColor: themeColors.card }]}
          onPress={() => rootNavigate('EditProfile')}
        >
          <Ionicons name="create-outline" size={24} color={themeColors.textSecondary} />
          <Text style={[styles.rowText, { color: themeColors.text }]}>Edit profile</Text>
          <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>
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
              onPress={() => rootNavigate('DriverActivityListStack')}
            >
              <Ionicons name="stats-chart-outline" size={24} color={themeColors.textSecondary} />
              <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.viewAllActivities}</Text>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, { backgroundColor: themeColors.card }]}
              onPress={() => rootNavigate('VehicleGarage')}
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
  avatar: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
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
});
