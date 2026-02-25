import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { RoleToggle, Button, RideCard, Screen, CarRefreshIndicator, Divider, DateTimePicker } from '../../components';
import { useResponsiveThemeContext } from '../../context/ResponsiveThemeContext';
import { useThemeColors } from '../../context/ThemeContext';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';
import { strings } from '../../constants/strings';
import { selectorStyles } from '../../utils/selectorStyles';
import { searchTrips, getHotpoints, getUserBookings } from '../../services/api';
import { getMockStore, updateMockStore } from '../../services/api';
import type { Trip, TripType, Hotpoint, Booking } from '../../types';

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
  const [hotpoints, setHotpoints] = React.useState<Hotpoint[]>([]);
  const [from, setFrom] = React.useState<Hotpoint | null>(null);
  const [to, setTo] = React.useState<Hotpoint | null>(null);
  const [pickerMode, setPickerMode] = React.useState<'from' | 'to' | null>(null);
  const [pickerQuery, setPickerQuery] = React.useState('');
  const [searchValidation, setSearchValidation] = React.useState<string | null>(null);
  const [searchDate, setSearchDate] = React.useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  React.useEffect(() => {
    getHotpoints().then(setHotpoints);
  }, []);

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

  const swapFromTo = () => {
    setFrom(to);
    setTo(from);
    setSearchValidation(null);
  };

  const filteredHotpoints =
    pickerQuery.trim().length > 0
      ? hotpoints.filter(
          (h) =>
            h.name.toLowerCase().includes(pickerQuery.trim().toLowerCase()) ||
            h.country?.toLowerCase().includes(pickerQuery.trim().toLowerCase()) ||
            h.address?.toLowerCase().includes(pickerQuery.trim().toLowerCase())
        )
      : hotpoints;

  const onSelectHotpoint = (h: Hotpoint) => {
    if (pickerMode === 'from') setFrom(h);
    if (pickerMode === 'to') setTo(h);
    setPickerMode(null);
    setPickerQuery('');
    setSearchValidation(null);
  };

  const onSearch = () => {
    if (!from || !to) {
      setSearchValidation('Select departure and destination');
      return;
    }
    if (from.id === to.id) {
      setSearchValidation('Departure and destination cannot be the same');
      return;
    }
    setSearchValidation(null);
    navigation.navigate('SearchResults', {
      fromId: from.id,
      toId: to.id,
      tripType,
      passengerCount: 1,
      date: searchDate ? searchDate.toISOString().slice(0, 10) : undefined,
    });
  };

  const openRecentSearch = (fromId: string, toId: string) => {
    navigation.navigate('SearchResults', {
      fromId,
      toId,
      tripType,
      passengerCount: 1,
    });
  };

  const formatSearchDate = (d: Date | null) => {
    if (!d) return null;
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const displayName = user?.name || strings.common.guest;

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

      {/* Hero card - Ready to travel? */}
      <TouchableOpacity
        style={styles.heroCard}
        onPress={() => navigation.navigate('Search')}
        activeOpacity={0.9}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Ready to travel?</Text>
          <Text style={styles.heroSubtitle}>Find rides with verified drivers at the best prices.</Text>
          <View style={styles.heroBtn}>
            <Text style={styles.heroBtnText}>Find a Ride</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </View>
        <View style={styles.heroBlob} />
      </TouchableOpacity>

      {/* Search inputs - BlaBlaCar style */}
      <View style={[styles.searchCard, { backgroundColor: PASSENGER_BG_LIGHT, borderColor: c.borderLight }]}>
        <TouchableOpacity
          style={styles.searchRow}
          onPress={() => setPickerMode('from')}
          activeOpacity={0.8}
        >
          <Ionicons name="ellipse" size={10} color={c.textMuted} style={styles.searchDot} />
          <Text style={[styles.searchRowText, !from && styles.searchRowPlaceholder, { color: from ? c.text : c.textMuted }]} numberOfLines={1}>
            {from ? (from.country ? `${from.name}, ${from.country}` : from.name) : 'From...'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.searchRow, styles.searchRowLast]}
          onPress={() => setPickerMode('to')}
          activeOpacity={0.8}
        >
          <Ionicons name="location" size={16} color={PASSENGER_BRAND} style={styles.searchDot} />
          <Text style={[styles.searchRowText, !to && styles.searchRowPlaceholder, { color: to ? c.text : c.textMuted }]} numberOfLines={1}>
            {to ? (to.country ? `${to.name}, ${to.country}` : to.name) : 'To...'}
          </Text>
          <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} onPress={(e) => { e.stopPropagation(); swapFromTo(); }} style={styles.swapBtn}>
            <Ionicons name="swap-vertical" size={22} color={PASSENGER_BRAND} />
          </TouchableOpacity>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.searchRow, styles.searchRowLast]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={18} color={c.textMuted} style={styles.searchDot} />
          <Text style={[styles.searchRowText, !searchDate && styles.searchRowPlaceholder, { color: searchDate ? c.text : c.textMuted }]} numberOfLines={1}>
            {formatSearchDate(searchDate) || 'Date (optional)'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
        </TouchableOpacity>
        <DateTimePicker
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
          value={searchDate || new Date()}
          onChange={(d) => setSearchDate(d)}
          mode="date"
          minimumDate={new Date()}
        />
        {searchValidation ? (
          <Text style={[styles.searchValidation, { color: c.error }]}>{searchValidation}</Text>
        ) : null}
        <TouchableOpacity style={styles.searchBtn} onPress={onSearch} activeOpacity={0.85}>
          <Text style={styles.searchBtnText}>Find Rides</Text>
        </TouchableOpacity>
      </View>

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

      <Divider />
      <Text style={[styles.sectionTitle, styles.recentTitle, { color: c.text }]}>Recent searches</Text>
      <TouchableOpacity
        style={[styles.recentRow, { borderBottomColor: c.border }]}
        onPress={() => openRecentSearch('hp3', 'hp2')}
      >
        <Ionicons name="time-outline" size={20} color={c.textSecondary} />
        <View style={styles.recentText}>
          <Text style={[styles.recentPrimary, { color: c.text }]}>Kigali → Rubavu</Text>
          <Text style={[styles.recentSecondary, { color: c.textSecondary }]}>Today</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.recentRow, { borderBottomColor: c.border }]}
        onPress={() => openRecentSearch('hp1', 'hp2')}
      >
        <Ionicons name="time-outline" size={20} color={c.textSecondary} />
        <View style={styles.recentText}>
          <Text style={[styles.recentPrimary, { color: c.text }]}>Kigali → Goma</Text>
          <Text style={[styles.recentSecondary, { color: c.textSecondary }]}>Today</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
      </TouchableOpacity>
      <CarRefreshIndicator state={refreshState} />

      <Modal visible={pickerMode !== null} animationType="slide" transparent>
        <View style={selectorStyles.overlay}>
          <View style={selectorStyles.sheet}>
            <View style={selectorStyles.searchRow}>
              <Ionicons name="search" size={20} color={c.textMuted} />
              <TextInput
                style={selectorStyles.searchInput}
                placeholder="Type city or hotpoint"
                placeholderTextColor={c.textMuted}
                value={pickerQuery}
                onChangeText={setPickerQuery}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredHotpoints}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={selectorStyles.optionRow}
                  onPress={() => onSelectHotpoint(item)}
                >
                  <Ionicons name="location-outline" size={20} color={c.textMuted} />
                  <View style={selectorStyles.optionText}>
                    <Text style={selectorStyles.optionPrimary}>
                      {item.country ? `${item.name}, ${item.country}` : item.name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={selectorStyles.closeButton}
              onPress={() => { setPickerMode(null); setPickerQuery(''); }}
            >
              <Text style={selectorStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: spacing.lg },
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
  heroBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  heroBlob: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  searchCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  searchRowLast: { borderBottomWidth: 0 },
  searchDot: { width: 24, textAlign: 'center' },
  searchRowText: { flex: 1, ...typography.body, fontWeight: '600' },
  searchRowPlaceholder: { fontWeight: '500', color: colors.textMuted },
  swapBtn: { padding: spacing.xs },
  searchValidation: { ...typography.caption, color: colors.error, paddingHorizontal: spacing.sm, paddingTop: spacing.xs },
  searchBtn: {
    backgroundColor: PASSENGER_BRAND,
    marginTop: spacing.sm,
    marginHorizontal: spacing.sm,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  sectionTitle: { ...typography.h3, fontWeight: '800', marginBottom: spacing.sm, fontSize: 18 },
  sectionTitleTop: { marginTop: spacing.md },
  recentTitle: { marginTop: spacing.lg },
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
  modeTextActive: { color: '#fff', fontWeight: '600' },
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
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentText: { flex: 1 },
  recentPrimary: { ...typography.body, color: colors.text },
  recentSecondary: { ...typography.caption, color: colors.textSecondary },
});
