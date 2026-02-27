import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { RoleToggle, RideCard, Screen, CarRefreshIndicator } from '../../components';
import { useResponsiveThemeContext } from '../../context/ResponsiveThemeContext';
import { useThemeColors } from '../../context/ThemeContext';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';
import { listBottomPaddingTab, sectionTitleStyle } from '../../utils/layout';
import { strings } from '../../constants/strings';
import { searchTrips, getUserBookings } from '../../services/api';
import type { Trip, Booking } from '../../types';

export default function PassengerHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { currentRole, switchRole, hasApprovedVehicle } = useRole();
  const responsive = useResponsiveThemeContext();
  const c = useThemeColors();
  const effectiveSpacing = responsive?.spacing ?? spacing;
  const [availableTrips, setAvailableTrips] = React.useState<Trip[]>([]);
  const [upcomingBookings, setUpcomingBookings] = React.useState<Booking[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshState, setRefreshState] = React.useState<'idle' | 'refreshing' | 'done'>('idle');

  const loadTrips = React.useCallback(async () => {
    const items = await searchTrips({});
    setAvailableTrips(items.slice(0, 6));
  }, []);

  const loadBookings = React.useCallback(async () => {
    if (user?.id) {
      const items = await getUserBookings(user.id);
      setUpcomingBookings(items.filter((b) => b.status === 'upcoming'));
    }
  }, [user?.id]);

  React.useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  React.useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshState('refreshing');
    await Promise.all([loadTrips(), loadBookings()]);
    setRefreshState('done');
    setRefreshing(false);
    setTimeout(() => setRefreshState('idle'), 240);
  };

  const displayName = user?.name || strings.common.guest;

  return (
    <Screen
      scroll
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: effectiveSpacing.lg, paddingBottom: listBottomPaddingTab }]}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[c.primary]}
            tintColor={c.primary}
            progressBackgroundColor={c.background}
          />
        ),
        overScrollMode: 'always',
        bounces: false,
        alwaysBounceVertical: false,
        decelerationRate: 'fast',
      }}
    >
      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <View style={[styles.header, { marginBottom: effectiveSpacing.lg }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeLabel}>Welcome back</Text>
          <Text style={[styles.userName, { color: c.text }]}>{displayName}</Text>
        </View>
        <View style={styles.avatarWrap}>
          {user?.avatarUri ? (
            <Image source={{ uri: user.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={28} color={c.textMuted} />
            </View>
          )}
        </View>
      </View>

      {user?.roles?.length && user.roles.length > 1 ? (
        <RoleToggle
          currentRole={currentRole}
          onSwitch={switchRole}
          hasApprovedVehicle={hasApprovedVehicle}
          availableRoles={user.roles}
          onNavigateToVehicleGarage={() =>
            (navigation.getParent() as any)?.getParent()?.navigate('VehicleGarage')
          }
        />
      ) : null}

      {/* Single CTA: Find trips (unified instant + scheduled) */}
      <TouchableOpacity
        style={styles.heroCard}
        onPress={() => navigation.navigate('SearchResults', {})}
        activeOpacity={0.9}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Ready to travel?</Text>
          <Text style={styles.heroSubtitle}>Find instant and scheduled rides with verified drivers.</Text>
          <View style={styles.heroBtn}>
            <Text style={styles.heroBtnText}>Find trips</Text>
            <Ionicons name="arrow-forward" size={16} color={c.onPrimary} />
          </View>
        </View>
        <View style={styles.heroBlob} />
      </TouchableOpacity>

      {/* Upcoming Trips */}
      <Text style={[styles.sectionTitle, { color: c.text }]}>Upcoming Trips</Text>
      {upcomingBookings.length > 0 ? (
        <View style={styles.upcomingList}>
          {upcomingBookings.slice(0, 5).map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.upcomingCard, { backgroundColor: c.card, borderColor: c.borderLight }]}
              onPress={() => navigation.getParent()?.navigate?.('PassengerBookings')}
              activeOpacity={0.9}
            >
              <View style={styles.upcomingLeft}>
                <Text style={styles.upcomingBadge}>Confirmed</Text>
                <Text style={[styles.upcomingRoute, { color: c.text }]}>
                  {b.trip.departureHotpoint.name} → {b.trip.destinationHotpoint.name}
                </Text>
                <Text style={[styles.upcomingMeta, { color: c.textSecondary }]}>
                  {b.trip.departureTime} • with {b.trip.driver.name}
                </Text>
              </View>
              <View style={styles.upcomingChevron}>
                <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={[styles.upcomingEmpty, { borderColor: c.borderLight }]}>
          <Text style={[styles.upcomingEmptyText, { color: c.textSecondary }]}>No bookings yet.</Text>
        </View>
      )}

      {/* Trips (instant + scheduled) */}
      <Text style={[styles.sectionTitle, styles.sectionTitleTop, { color: c.text }]}>
        Trips
      </Text>
      {availableTrips.map((trip) => (
        <RideCard
          key={trip.id}
          trip={trip}
          variant="blablacar"
          onPress={() => navigation.navigate('RideDetail', { tripId: trip.id })}
        />
      ))}

      <CarRefreshIndicator state={refreshState} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: {},
  blob1: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.08,
  },
  blob2: {
    position: 'absolute',
    bottom: 120,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.successLight,
    opacity: 0.08,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {},
  welcomeLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  userName: {
    ...typography.h2,
    fontSize: 26,
    fontWeight: '800',
  },
  avatarWrap: {},
  avatar: { width: 56, height: 56, borderRadius: radii.md },
  avatarPlaceholder: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  heroCard: {
    backgroundColor: colors.dark,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  heroContent: { position: 'relative', zIndex: 1 },
  heroTitle: { ...typography.h2, color: colors.onDarkText, marginBottom: 4 },
  heroSubtitle: { ...typography.bodySmall, color: colors.onDarkTextMuted, marginBottom: spacing.md },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  heroBtnText: { ...typography.bodySmall, fontWeight: '700', color: colors.onPrimary },
  heroBlob: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.decorativeLight,
  },
  sectionTitle: { ...sectionTitleStyle, fontSize: 18 },
  sectionTitleTop: { marginTop: spacing.md },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    minHeight: buttonHeights.medium,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modeText: { ...typography.bodySmall, color: colors.textSecondary },
  modeTextActive: { ...typography.bodySmall, color: colors.dark, fontWeight: '600' },
  upcomingList: { gap: spacing.sm, marginBottom: spacing.md },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  upcomingLeft: { flex: 1 },
  upcomingBadge: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.success,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  upcomingRoute: { ...typography.body, fontWeight: '700' },
  upcomingMeta: { ...typography.caption, marginTop: 2 },
  upcomingChevron: {
    width: 40,
    height: 40,
    borderRadius: radii.button,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  upcomingEmptyText: { ...typography.bodySmall },
});
