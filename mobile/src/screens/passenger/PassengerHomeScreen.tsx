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
import { getMockStore, updateMockStore } from '../../services/api';
import type { Trip, TripType, Booking } from '../../types';

const PASSENGER_BRAND = colors.passengerBrand;
const PASSENGER_DARK = colors.passengerDark;
const PASSENGER_BG_LIGHT = colors.passengerBgLight;

export default function PassengerHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { currentRole, switchRole, hasApprovedVehicle } = useRole();
  const responsive = useResponsiveThemeContext();
  const c = useThemeColors();
  const effectiveSpacing = responsive?.spacing ?? spacing;
  const [tripType, setTripType] = React.useState<TripType>('insta');
  const [availableTrips, setAvailableTrips] = React.useState<Trip[]>([]);
  const [upcomingBookings, setUpcomingBookings] = React.useState<Booking[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshState, setRefreshState] = React.useState<'idle' | 'refreshing' | 'done'>('idle');

  React.useEffect(() => {
    const hydratePreferences = async () => {
      const store = await getMockStore();
      if (store.passengerPrefs?.tripType) {
        setTripType(store.passengerPrefs.tripType);
      }
    };
    void hydratePreferences();
  }, []);

  const loadTrips = React.useCallback(async () => {
    const items = await searchTrips({ type: tripType });
    setAvailableTrips(items.slice(0, 6));
  }, [tripType]);

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

  React.useEffect(() => {
    void updateMockStore({
      passengerPrefs: { tripType },
    });
  }, [tripType]);

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
            colors={[PASSENGER_BRAND]}
            tintColor={PASSENGER_BRAND}
            progressBackgroundColor={PASSENGER_BG_LIGHT}
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

      {/* Find trips CTA */}
      <TouchableOpacity
        style={styles.heroCard}
        onPress={() => navigation.navigate('SearchResults', {})}
        activeOpacity={0.9}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Ready to travel?</Text>
          <Text style={styles.heroSubtitle}>Find rides with verified drivers at the best prices.</Text>
          <View style={styles.heroBtn}>
            <Text style={styles.heroBtnText}>Find trips</Text>
            <Ionicons name="arrow-forward" size={16} color={PASSENGER_DARK} />
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

      {/* Available now / scheduled toggle + list */}
      <Text style={[styles.sectionTitle, styles.sectionTitleTop, { color: c.text }]}>
        {tripType === 'insta' ? 'Available now' : 'Scheduled available trips'}
      </Text>
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, { backgroundColor: c.surface, borderColor: c.border }, tripType === 'insta' && styles.modeBtnActive]}
          onPress={() => setTripType('insta')}
        >
          <Text style={[styles.modeText, { color: c.textSecondary }, tripType === 'insta' && styles.modeTextActive]}>
            Instant booking
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, { backgroundColor: c.surface, borderColor: c.border }, tripType === 'scheduled' && styles.modeBtnActive]}
          onPress={() => setTripType('scheduled')}
        >
          <Text style={[styles.modeText, { color: c.textSecondary }, tripType === 'scheduled' && styles.modeTextActive]}>
            Scheduled available
          </Text>
        </TouchableOpacity>
      </View>
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
  container: { flex: 1, backgroundColor: '#fff' },
  content: {},
  blob1: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: PASSENGER_BRAND,
    opacity: 0.08,
  },
  blob2: {
    position: 'absolute',
    bottom: 120,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#7DE2D1',
    opacity: 0.08,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {},
  welcomeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: PASSENGER_BRAND,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  userName: {
    ...typography.h2,
    fontSize: 26,
    fontWeight: '800',
  },
  avatarWrap: {},
  avatar: { width: 56, height: 56, borderRadius: 20 },
  avatarPlaceholder: {
    backgroundColor: PASSENGER_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  heroCard: {
    backgroundColor: PASSENGER_DARK,
    borderRadius: 28,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  heroContent: { position: 'relative', zIndex: 1 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: spacing.md },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: PASSENGER_BRAND,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    gap: 8,
  },
  heroBtnText: { fontSize: 14, fontWeight: '700', color: PASSENGER_DARK },
  heroBlob: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: PASSENGER_BRAND,
    borderWidth: 1,
    borderColor: PASSENGER_BRAND,
  },
  modeText: { ...typography.bodySmall, color: colors.textSecondary },
  modeTextActive: { color: PASSENGER_DARK, fontWeight: '600' },
  upcomingList: { gap: spacing.sm, marginBottom: spacing.md },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 24,
    borderWidth: 1,
  },
  upcomingLeft: { flex: 1 },
  upcomingBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.success,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  upcomingRoute: { ...typography.body, fontWeight: '700' },
  upcomingMeta: { ...typography.caption, marginTop: 2 },
  upcomingChevron: { width: 40, height: 40, borderRadius: 20, backgroundColor: PASSENGER_BG_LIGHT, alignItems: 'center', justifyContent: 'center' },
  upcomingEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 28,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  upcomingEmptyText: { ...typography.bodySmall },
});
