import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  RideCard,
  Screen,
  EmptyState,
  CarWheelLoader,
  CarRefreshIndicator,
  DriverPinPulse,
} from '../../components';
import { searchTrips } from '../../services/api';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';

const PASSENGER_BRAND = colors.passengerBrand;
const PASSENGER_DARK = colors.passengerDark;
const PASSENGER_BG_LIGHT = colors.passengerBgLight;
import type { Trip, TripType } from '../../types';

type Params = {
  SearchResults: { fromId?: string; toId?: string; tripType?: TripType; passengerCount?: number; date?: string };
};

type TripCategory = 'all' | 'public' | 'private';

function isPublicTrip(trip: Trip): boolean {
  return trip.driver.roles?.includes('agency') ?? false;
}

export default function SearchResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Params, 'SearchResults'>>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeType, setActiveType] = useState<TripType>(route.params?.tripType || 'insta');
  const [tripCategory, setTripCategory] = useState<TripCategory>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'done'>('idle');
  const [filters, setFilters] = useState<{ maxPrice: number; onlyInstant: boolean; minSeats: number }>({
    maxPrice: 100000,
    onlyInstant: false,
    minSeats: route.params?.passengerCount ?? 1,
  });

  const loadTrips = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }
      const t = await searchTrips({
        fromId: route.params?.fromId,
        toId: route.params?.toId,
        type: activeType,
      });
      let filtered = t.filter(
        (item) =>
          item.pricePerSeat <= filters.maxPrice
          && item.seatsAvailable >= filters.minSeats
          && (!filters.onlyInstant || item.type === 'insta')
      );
      if (tripCategory === 'public') {
        filtered = filtered.filter(isPublicTrip);
      } else if (tripCategory === 'private') {
        filtered = filtered.filter((item) => !isPublicTrip(item));
      }
      setTrips(filtered);
      if (showLoading) {
        setLoading(false);
      }
    },
    [activeType, tripCategory, filters.maxPrice, filters.minSeats, filters.onlyInstant, route.params?.fromId, route.params?.toId]
  );

  useEffect(() => {
    if (route.params?.tripType) {
      setActiveType(route.params.tripType);
    }
  }, [route.params?.tripType]);

  useEffect(() => {
    void loadTrips(true);
  }, [loadTrips]);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshState('refreshing');
    await loadTrips(false);
    setRefreshState('done');
    setRefreshing(false);
    setTimeout(() => setRefreshState('idle'), 240);
  };

  const fromName = trips[0]?.departureHotpoint.name ?? 'From';
  const toName = trips[0]?.destinationHotpoint.name ?? 'To';

  return (
    <Screen style={styles.container}>
      <View style={styles.routeCard}>
        <View style={styles.routeLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={PASSENGER_DARK} />
          </TouchableOpacity>
          <View>
            <Text style={styles.route}>{fromName} → {toName}</Text>
            <Text style={styles.subtitle}>Today, {route.params?.passengerCount ?? 1} Adult</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => {
            setFilters((prev) => ({
              maxPrice: prev.maxPrice === 100000 ? 25000 : 100000,
              minSeats: prev.minSeats === 1 ? Math.max(1, route.params?.passengerCount ?? 1) : 1,
              onlyInstant: !prev.onlyInstant,
            }));
            Alert.alert('Filters applied', 'Mock filters toggled.');
          }}
        >
          <Ionicons name="options-outline" size={16} color={PASSENGER_BRAND} />
          <Text style={styles.filter}>Filter</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeType === 'insta' && styles.tabActive]}
          onPress={() => setActiveType('insta')}
        >
          <Ionicons
            name="flash-outline"
            size={14}
            color={activeType === 'insta' ? '#fff' : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeType === 'insta' && styles.tabTextActive]}>
            Instant
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeType === 'scheduled' && styles.tabActive]}
          onPress={() => setActiveType('scheduled')}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={activeType === 'scheduled' ? '#fff' : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeType === 'scheduled' && styles.tabTextActive]}>
            Scheduled
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.categoryTabs}>
        <TouchableOpacity
          style={[styles.tab, tripCategory === 'all' && styles.tabActive]}
          onPress={() => setTripCategory('all')}
        >
          <Text style={[styles.tabText, tripCategory === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tripCategory === 'public' && styles.tabActive]}
          onPress={() => setTripCategory('public')}
        >
          <Ionicons
            name="bus-outline"
            size={14}
            color={tripCategory === 'public' ? '#fff' : colors.textSecondary}
          />
          <Text style={[styles.tabText, tripCategory === 'public' && styles.tabTextActive]}>Public</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tripCategory === 'private' && styles.tabActive]}
          onPress={() => setTripCategory('private')}
        >
          <Ionicons
            name="car-outline"
            size={14}
            color={tripCategory === 'private' ? '#fff' : colors.textSecondary}
          />
          <Text style={[styles.tabText, tripCategory === 'private' && styles.tabTextActive]}>Private</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.mapCard}>
        <Text style={styles.mapTitle}>Nearby drivers</Text>
        <DriverPinPulse />
      </View>
      <Text style={styles.sectionTitle}>Today</Text>
      <CarWheelLoader visible={loading} />
      {trips.length === 0 && !loading ? (
        <EmptyState
          title="No rides found"
          subtitle="Be the first driver or try different search parameters."
        />
      ) : null}
      <FlatList
        key={`results-${activeType}-${tripCategory}`}
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.surface}
          />
        }
        overScrollMode="always"
        decelerationRate="fast"
        bounces={false}
        alwaysBounceVertical={false}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item }) => (
          <RideCard
            trip={item}
            variant="blablacar"
            onPress={() => navigation.navigate('RideDetail', { tripId: item.id })}
          />
        )}
      />
      <CarRefreshIndicator state={refreshState} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  routeCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: PASSENGER_BG_LIGHT,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  routeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  backBtn: { padding: spacing.xs },
  route: { ...typography.h2, color: PASSENGER_DARK, fontWeight: '800', fontSize: 18 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: buttonHeights.small,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: PASSENGER_BRAND,
    borderWidth: 0,
  },
  filter: { ...typography.bodySmall, color: '#fff', fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: buttonHeights.small,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    backgroundColor: PASSENGER_BG_LIGHT,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  tabActive: {
    backgroundColor: PASSENGER_BRAND,
    borderWidth: 1,
    borderColor: PASSENGER_BRAND,
  },
  tabText: { ...typography.body, color: colors.textSecondary },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  categoryTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: PASSENGER_DARK,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl + 80,
    paddingHorizontal: spacing.lg,
  },
  mapCard: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
