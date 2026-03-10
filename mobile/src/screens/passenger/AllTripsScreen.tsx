import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen, CarWheelLoader, CarRefreshIndicator } from '../../components';
import { searchTrips, getHotpoints } from '../../services/api';
import { spacing, typography, radii, sizes } from '../../utils/theme';
import { landingHeaderPaddingHorizontal, listBottomPaddingTab, screenContentStartPaddingTop } from '../../utils/layout';
import { useThemeColors } from '../../context/ThemeContext';
import { selectorStyles } from '../../utils/selectorStyles';
import type { Trip, Hotpoint } from '../../types';

const DEFAULT_FILTERS = {
  maxPrice: 100000,
  minSeats: 1,
};

type TripTypeFilter = 'all' | 'insta' | 'scheduled';
type SortOption = 'earliest' | 'price-low' | 'rating';

function getHotpointLabelById(hotpoints: Hotpoint[], id: string | undefined): string {
  if (!id) return 'Select location';
  const h = hotpoints.find((item) => item.id === id);
  return h ? (h.country ? `${h.name}, ${h.country}` : h.name) : 'Select location';
}

/** Format time for display (HH:mm or ISO slice). */
function formatTime(t: string | undefined): string {
  if (!t) return '—';
  if (/^\d{1,2}:\d{2}$/.test(t)) return t;
  const idx = t.indexOf('T');
  if (idx !== -1) return t.slice(idx + 1, idx + 6);
  return t.slice(0, 5);
}

/** Format duration e.g. "2h 15m". */
function formatDuration(min: number | undefined): string {
  if (min == null || min < 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function AllTripsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ AllTrips: { fromId?: string; toId?: string; passengerCount?: number; date?: string } }, 'AllTrips'>>();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'done'>('idle');
  const [fromId, setFromId] = useState<string | undefined>(route.params?.fromId);
  const [toId, setToId] = useState<string | undefined>(route.params?.toId);
  const [fromHotpoint, setFromHotpoint] = useState<Hotpoint | null>(null);
  const [toHotpoint, setToHotpoint] = useState<Hotpoint | null>(null);
  const [hotpoints, setHotpoints] = useState<Hotpoint[]>([]);
  const [pickerMode, setPickerMode] = useState<'from' | 'to' | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('earliest');
  const [typeFilter, setTypeFilter] = useState<TripTypeFilter>('all');
  const [dateFilter, setDateFilter] = useState<string | undefined>(route.params?.date);
  const [filtersSheetVisible, setFiltersSheetVisible] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [tempParams, setTempParams] = useState<{
    fromId: string | undefined;
    toId: string | undefined;
    date: string | undefined;
    passengers: number;
  }>({ fromId: undefined, toId: undefined, date: undefined, passengers: 1 });

  useEffect(() => {
    getHotpoints().then(setHotpoints);
  }, []);

  useEffect(() => {
    setFromId(route.params?.fromId);
    setToId(route.params?.toId);
    if (route.params?.date) setDateFilter(route.params.date);
  }, [route.params?.fromId, route.params?.toId, route.params?.date]);

  const fromH = fromHotpoint ?? (fromId ? hotpoints.find((h) => h.id === fromId) ?? null : null);
  const toH = toHotpoint ?? (toId ? hotpoints.find((h) => h.id === toId) ?? null : null);
  const fromName = fromH?.name ?? '';
  const toName = toH?.name ?? '';

  const apiSortBy = sortBy === 'price-low' ? 'price' : sortBy;
  const loadTrips = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      const t = await searchTrips({
        fromId,
        toId,
        date: dateFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        passengerCount: filters.minSeats,
        sortBy: apiSortBy,
      });
      const filtered = t.filter((item) => item.pricePerSeat <= filters.maxPrice);
      setTrips(filtered);
      if (showLoading) setLoading(false);
    },
    [dateFilter, filters.maxPrice, filters.minSeats, fromId, toId, typeFilter, apiSortBy]
  );

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
    if (isSearchOpen) {
      setTempParams((prev) => ({
        ...prev,
        [pickerMode === 'from' ? 'fromId' : 'toId']: h.id,
      }));
    } else {
      if (pickerMode === 'from') {
        setFromId(h.id);
        setFromHotpoint(h);
      }
      if (pickerMode === 'to') {
        setToId(h.id);
        setToHotpoint(h);
      }
    }
    setPickerMode(null);
    setPickerQuery('');
  };

  const openEditSearch = () => {
    setTempParams({
      fromId,
      toId,
      date: dateFilter,
      passengers: filters.minSeats,
    });
    setIsSearchOpen(true);
  };

  const applyEditSearch = () => {
    setFromId(tempParams.fromId);
    setToId(tempParams.toId);
    setFromHotpoint(tempParams.fromId ? (hotpoints.find((h) => h.id === tempParams.fromId) ?? null) : null);
    setToHotpoint(tempParams.toId ? (hotpoints.find((h) => h.id === tempParams.toId) ?? null) : null);
    setDateFilter(tempParams.date);
    setFilters((f) => ({ ...f, minSeats: tempParams.passengers }));
    setIsSearchOpen(false);
    loadTrips(true);
  };

  const swapLocations = () => {
    setTempParams((prev) => ({ ...prev, fromId: prev.toId, toId: prev.fromId }));
  };

  const dateLabel = dateFilter
    ? new Date(dateFilter).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Any date';

  return (
    <Screen contentInset={false} style={[styles.container, { backgroundColor: c.appBackground }]}>
      {/* 1. Edit Search full-screen modal (template) */}
      <Modal visible={isSearchOpen} animationType="slide">
        <View style={[styles.editSearchModal, { backgroundColor: c.card, paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.editSearchHeader}>
            <TouchableOpacity onPress={() => setIsSearchOpen(false)} style={styles.editSearchClose} hitSlop={12}>
              <Ionicons name="close" size={28} color={c.primary} />
            </TouchableOpacity>
            <Text style={[styles.editSearchTitle, { color: c.text }]}>EDIT SEARCH</Text>
            <View style={styles.editSearchHeaderSpacer} />
          </View>
          <View style={styles.editSearchBody}>
            <View style={styles.editSearchFromToWrap}>
              <TouchableOpacity
                style={[styles.editSearchInputCard, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }]}
                onPress={() => setPickerMode('from')}
                activeOpacity={0.8}
              >
                <Ionicons name="location" size={20} color={c.primary} style={styles.editSearchInputIcon} />
                <View style={styles.editSearchInputInner}>
                  <Text style={[styles.editSearchLabel, { color: c.textMuted }]}>LEAVING FROM</Text>
                  <Text style={[styles.editSearchValue, { color: c.text }]} numberOfLines={1}>
                    {getHotpointLabelById(hotpoints, tempParams.fromId)}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSearchSwapBtn, { backgroundColor: c.card, borderColor: c.borderLight }]}
                onPress={swapLocations}
              >
                <Ionicons name="swap-vertical" size={16} color={c.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSearchInputCard, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }]}
                onPress={() => setPickerMode('to')}
                activeOpacity={0.8}
              >
                <Ionicons name="location-outline" size={20} color={c.textMuted} style={styles.editSearchInputIcon} />
                <View style={styles.editSearchInputInner}>
                  <Text style={[styles.editSearchLabel, { color: c.textMuted }]}>GOING TO</Text>
                  <Text style={[styles.editSearchValue, { color: c.text }]} numberOfLines={1}>
                    {getHotpointLabelById(hotpoints, tempParams.toId)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.editSearchRow}>
              <View style={[styles.editSearchInputCard, styles.editSearchInputHalf, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }]}>
                <Ionicons name="calendar-outline" size={20} color={c.textMuted} style={styles.editSearchInputIcon} />
                <View style={styles.editSearchInputInner}>
                  <Text style={[styles.editSearchLabel, { color: c.textMuted }]}>WHEN</Text>
                  <TextInput
                    style={[styles.editSearchValue, { color: c.text }]}
                    value={tempParams.date ?? ''}
                    onChangeText={(v) => setTempParams((prev) => ({ ...prev, date: v }))}
                    placeholder="Any date"
                    placeholderTextColor={c.textMuted}
                  />
                </View>
              </View>
              <View style={[styles.editSearchInputCard, styles.editSearchInputHalf, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }]}>
                <Ionicons name="people-outline" size={20} color={c.textMuted} style={styles.editSearchInputIcon} />
                <View style={styles.editSearchInputInner}>
                  <Text style={[styles.editSearchLabel, { color: c.textMuted }]}>WHO</Text>
                  <TextInput
                    style={[styles.editSearchValue, { color: c.text }]}
                    value={String(tempParams.passengers)}
                    onChangeText={(v) => setTempParams((prev) => ({ ...prev, passengers: Math.max(1, parseInt(v, 10) || 1) }))}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.seeResultsBtn, { backgroundColor: c.primary }]}
            onPress={applyEditSearch}
            activeOpacity={0.9}
          >
            <Text style={[styles.seeResultsBtnText, { color: c.onPrimary ?? c.text }]}>See results</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 2. Hotpoint Picker Overlay (template) */}
      <Modal visible={pickerMode !== null} animationType="slide" transparent>
        <View style={[selectorStyles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[selectorStyles.sheet, { backgroundColor: c.card }]}>
            <View style={[selectorStyles.searchRow, { backgroundColor: c.surface }]}>
              <Ionicons name="search" size={18} color={c.textMuted} />
              <TextInput
                style={[selectorStyles.searchInput, { color: c.text }]}
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
                  style={[selectorStyles.optionRow, { borderBottomColor: c.borderLight }]}
                  onPress={() => onSelectHotpoint(item)}
                >
                  <View style={[styles.pickerIconWrap, { backgroundColor: c.surface }]}>
                    <Ionicons name="location-outline" size={18} color={c.textMuted} />
                  </View>
                  <Text style={[selectorStyles.optionPrimary, { color: c.text }]} numberOfLines={1}>
                    {item.name}, {item.country ?? ''}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.pickerCloseBtn, { borderTopColor: c.borderLight }]}
              onPress={() => {
                setPickerMode(null);
                setPickerQuery('');
              }}
            >
              <Text style={[styles.pickerCloseBtnText, { color: c.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Sticky Header: Back, Route, Search (template) */}
      <View style={[styles.stickyHeaderWrap, { backgroundColor: c.card, borderBottomColor: c.borderLight }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={c.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerRouteWrap} onPress={openEditSearch} activeOpacity={0.8}>
            <View style={styles.headerRouteRow}>
              <Text style={[styles.headerRouteFrom, { color: c.text }]} numberOfLines={1}>
                {fromName || 'From'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={c.textMuted} />
              <Text style={[styles.headerRouteTo, { color: c.text }]} numberOfLines={1}>
                {toName || 'To'}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>
              {dateLabel}, {filters.minSeats} passenger{filters.minSeats > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerSearchIconWrap, { backgroundColor: c.primaryTint }]} onPress={openEditSearch}>
            <Ionicons name="search" size={18} color={c.primary} />
          </TouchableOpacity>
        </View>
        {/* Quick filter pills: Earliest, Cheapest, Rating, More */}
        <View style={styles.filterPillsRow}>
          {[
            { label: 'Earliest', value: 'earliest' as SortOption },
            { label: 'Cheapest', value: 'price-low' as SortOption },
            { label: 'Rating', value: 'rating' as SortOption },
          ].map((opt) => {
            const active = sortBy === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setSortBy(opt.value)}
                style={[
                  styles.filterPill,
                  { borderColor: active ? c.primary : c.borderLight, backgroundColor: active ? c.primary : c.card },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, { color: active ? (c.onPrimary ?? c.text) : c.textMuted }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.filterPill, { borderColor: c.borderLight, backgroundColor: c.card }]}
            onPress={() => setFiltersSheetVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={12} color={c.textMuted} />
            <Text style={[styles.filterPillText, { color: c.textMuted }]}>More</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Filter Bottom Sheet (template: Trip Type, Max Price, Min Seats, Apply Filters only) */}
      <Modal visible={filtersSheetVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setFiltersSheetVisible(false)}>
          <View style={[styles.sortOverlay, { backgroundColor: c.overlayModal ?? 'rgba(0,0,0,0.5)' }]} />
        </TouchableWithoutFeedback>
        <View style={[styles.sortSheet, { backgroundColor: c.card }]}>
          <View style={[styles.sortSheetHandle, { backgroundColor: c.border }]} />
          <Text style={[styles.sortSheetTitle, { color: c.text }]}>Filters & Sort</Text>
          <Text style={[styles.filterLabel, { color: c.textMuted }]}>TRIP TYPE</Text>
          <View style={styles.filterTypeRow}>
            {(['all', 'insta', 'scheduled'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setTypeFilter(type)}
                style={[
                  styles.filterChip,
                  { borderColor: typeFilter === type ? c.primary : c.borderLight, borderWidth: 2, backgroundColor: typeFilter === type ? c.primaryTint : c.background },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, { color: typeFilter === type ? c.primary : c.textMuted }]}>
                  {type === 'all' ? 'All' : type === 'insta' ? 'Instant' : 'Scheduled'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.filterInputRow}>
            <View style={styles.filterInputHalf}>
              <Text style={[styles.filterLabelInGrid, { color: c.textMuted }]}>MAX PRICE (RWF)</Text>
              <TextInput
                style={[styles.filterInput, { backgroundColor: c.background, borderColor: c.borderLight, color: c.text }]}
                value={String(filters.maxPrice)}
                onChangeText={(v) => setFilters((f) => ({ ...f, maxPrice: Math.max(0, parseInt(v, 10) || 0) }))}
                keyboardType="number-pad"
                placeholder="e.g. 50000"
              />
            </View>
            <View style={styles.filterInputHalf}>
              <Text style={[styles.filterLabelInGrid, { color: c.textMuted }]}>MIN SEATS</Text>
              <TextInput
                style={[styles.filterInput, { backgroundColor: c.background, borderColor: c.borderLight, color: c.text }]}
                value={String(filters.minSeats)}
                onChangeText={(v) => setFilters((f) => ({ ...f, minSeats: Math.max(1, parseInt(v, 10) || 1) }))}
                keyboardType="number-pad"
                placeholder="1"
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.applyFiltersBtn, { backgroundColor: c.primary }]}
            onPress={() => {
              setFiltersSheetVisible(false);
              loadTrips(true);
            }}
            activeOpacity={0.9}
          >
            <Text style={[styles.applyFiltersBtnText, { color: c.onPrimary ?? c.text }]}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <CarWheelLoader visible={loading} />

      {/* 5. Main content: X rides found, TRENDS, then list or empty (template) */}
      <View style={styles.mainWrap}>
        <View style={styles.listHeaderRow}>
          <Text style={[styles.listHeaderCount, { color: c.textMuted }]}>{trips.length} rides found</Text>
          <TouchableOpacity onPress={() => {}} style={styles.trendsBtn}>
            <Ionicons name="information-circle-outline" size={10} color={c.primary} />
            <Text style={[styles.trendsText, { color: c.primary }]}>TRENDS</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <Ionicons name="car-sport-outline" size={64} color={c.primaryTint ?? c.textMuted} style={styles.loadingIcon} />
            <View style={[styles.loadingBar, { backgroundColor: c.surface }]} />
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconCircle, { backgroundColor: c.surface }]}>
              <Ionicons name="search" size={32} color={c.textMuted} />
            </View>
            <Text style={[styles.emptyText, { color: c.text }]}>No trips found</Text>
            <Text style={[styles.emptySubtitle, { color: c.textMuted }]}>Try changing your filters or search date</Text>
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id}
            style={styles.listScroll}
            contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPaddingTab }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[c.primary]}
                tintColor={c.primary}
                progressBackgroundColor={c.surface}
              />
            }
            overScrollMode="always"
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={({ item }) => (
              <TripCard trip={item} colors={c} onPress={() => navigation.navigate('RideDetail', { tripId: item.id })} />
            )}
          />
        )}
      </View>
      <CarRefreshIndicator state={refreshState} />
    </Screen>
  );
}

/** Template-style trip card: avatar, rating, price, timeline, amenities, seats */
function TripCard({
  trip,
  colors: c,
  onPress,
}: {
  trip: Trip;
  colors: Record<string, string>;
  onPress: () => void;
}) {
  const driverName = trip.driver?.name ?? '—';
  const rating = trip.driver?.rating ?? 0;
  const avatarUri = trip.driver?.avatarUri;
  const depTime = formatTime(trip.departureTime);
  const arrTime = formatTime(trip.arrivalTime);
  const fromPlace = trip.departureHotpoint?.name ?? '—';
  const toPlace = trip.destinationHotpoint?.name ?? '—';
  const duration = formatDuration(trip.durationMinutes);
  const carLabel = trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : '—';
  const isInsta = trip.type === 'insta';
  const seats = trip.seatsAvailable;
  const reviews = '—'; // API has no reviews count
  const amenities: string[] = []; // API has no amenities; template shows AC, Music etc.

  return (
    <TouchableOpacity
      style={[styles.tripCard, { backgroundColor: c.card, borderColor: c.borderLight }]}
      onPress={onPress}
      activeOpacity={0.98}
    >
      {/* Card Header: driver + price */}
      <View style={styles.tripCardHeader}>
        <View style={styles.tripCardDriverRow}>
          <View style={styles.tripCardAvatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.tripCardAvatar} />
            ) : (
              <View style={[styles.tripCardAvatar, { backgroundColor: c.primaryTint }]}>
                <Ionicons name="person" size={20} color={c.primary} />
              </View>
            )}
            {rating >= 4.8 && (
              <View style={[styles.tripCardVerified, { backgroundColor: c.statusSuccess ?? CARD_VERIFIED_BG }]}>
                <Ionicons name="shield-checkmark" size={10} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.tripCardDriverInfo}>
            <Text style={[styles.tripCardDriverName, { color: c.text }]} numberOfLines={1}>{driverName}</Text>
            <View style={[styles.tripCardRatingRow, { backgroundColor: c.surface }]}>
              <Ionicons name="star" size={9} color={c.warning ?? '#EAB308'} style={{ marginRight: 2 }} />
              <Text style={[styles.tripCardRatingText, { color: c.textMuted }]}>{rating} | {reviews}</Text>
            </View>
          </View>
        </View>
        <View style={styles.tripCardPriceCol}>
          <View style={styles.tripCardPriceRow}>
            <Text style={[styles.tripCardPriceLabel, { color: c.textMuted }]}>RWF</Text>
            <Text style={[styles.tripCardPriceValue, { color: c.primary }]}>{trip.pricePerSeat.toLocaleString()}</Text>
          </View>
          {isInsta && (
            <View style={styles.tripCardInstantRow}>
              <Ionicons name="flash" size={9} color={c.warning ?? '#EAB308'} />
              <Text style={[styles.tripCardInstantText, { color: c.warning ?? '#EAB308' }]}>INSTANT</Text>
            </View>
          )}
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.tripCardTimeline}>
        <View style={styles.tripCardDots}>
          <View style={[styles.tripCardDot, { borderColor: c.primary, backgroundColor: c.card }]} />
          <View style={[styles.tripCardLine, { backgroundColor: c.primary }]} />
          <View style={[styles.tripCardDot, { borderColor: c.borderLight, backgroundColor: c.card }]} />
        </View>
        <View style={styles.tripCardTimelineContent}>
          <View style={styles.tripCardTimelineRow}>
            <View style={styles.tripCardTimelineLeft}>
              <Text style={[styles.tripCardTime, { color: c.text }]}>{depTime}</Text>
              <Text style={[styles.tripCardPlace, { color: c.textMuted }]} numberOfLines={1}>{fromPlace}</Text>
            </View>
            <View style={[styles.tripCardRightPill, { backgroundColor: c.surface }]}>
              <Ionicons name="time-outline" size={9} color={c.textMuted} />
              <Text style={[styles.tripCardDurationText, { color: c.textMuted }]}>{duration}</Text>
            </View>
          </View>
          <View style={[styles.tripCardTimelineRow, { marginBottom: 0 }]}>
            <View style={styles.tripCardTimelineLeft}>
              <Text style={[styles.tripCardTime, { color: c.text }]}>{arrTime}</Text>
              <Text style={[styles.tripCardPlace, { color: c.textMuted }]} numberOfLines={1}>{toPlace}</Text>
            </View>
            <View style={[styles.tripCardRightPill, { backgroundColor: 'transparent' }]}>
              <Ionicons name="car-sport-outline" size={10} color={c.textMuted} />
              <Text style={[styles.tripCardCarText, { color: c.textMuted }]}>{carLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer: amenities + seats */}
      <View style={[styles.tripCardFooter, { borderTopColor: c.borderLight }]}>
        <View style={styles.tripCardAmenitiesRow}>
          {amenities.length === 0 ? (
            <Text style={[styles.tripCardAmenityText, { color: c.textMuted }]}>—</Text>
          ) : (
            amenities.map((item, i) => (
              <View key={i} style={[styles.tripCardAmenityPill, { backgroundColor: c.surface }]}>
                <Text style={[styles.tripCardAmenityText, { color: c.textMuted }]}>{item}</Text>
              </View>
            ))
          )}
        </View>
        <Text style={[styles.tripCardSeatsText, { color: c.primary }]}>{seats} seats left</Text>
      </View>
    </TouchableOpacity>
  );
}

const CARD_VERIFIED_BG = '#22C55E';

/** Symmetric spacing: same value for section gaps and balanced padding. */
const SYM = {
  sectionGap: spacing.lg,
  itemGap: spacing.sm,
  cardPadding: spacing.md,
  iconSize: 20,
  headerIconBox: 40,
  pillPaddingV: 6,
  pillPaddingH: spacing.md,
} as const;

const styles = StyleSheet.create({
  container: { flex: 1 },
  // —— Sticky header (symmetric left/right wings) ——
  stickyHeaderWrap: {
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingTop: screenContentStartPaddingTop,
    paddingBottom: SYM.sectionGap,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SYM.itemGap,
    marginBottom: SYM.itemGap,
  },
  backBtn: {
    width: SYM.headerIconBox,
    height: SYM.headerIconBox,
    borderRadius: SYM.headerIconBox / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRouteWrap: { flex: 1, minWidth: 0 },
  headerRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerRouteFrom: { ...typography.body, fontWeight: '700', maxWidth: 88 },
  headerRouteTo: { ...typography.body, fontWeight: '700', maxWidth: 88 },
  headerSubtitle: { ...typography.overline, fontSize: 10, marginTop: 2, textTransform: 'uppercase' },
  headerSearchIconWrap: {
    width: SYM.headerIconBox,
    height: SYM.headerIconBox,
    borderRadius: SYM.headerIconBox / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: SYM.itemGap,
    paddingVertical: spacing.xs,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: SYM.pillPaddingV,
    paddingHorizontal: SYM.pillPaddingH,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  filterPillText: { ...typography.overline, fontSize: 11, fontWeight: '700' },
  // —— Edit Search modal (symmetric header + from/to + when/who) ——
  editSearchModal: {
    flex: 1,
    paddingHorizontal: SYM.sectionGap,
    paddingBottom: SYM.sectionGap,
  },
  editSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SYM.sectionGap * 2,
  },
  editSearchClose: {
    width: SYM.headerIconBox,
    height: SYM.headerIconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSearchTitle: { ...typography.h3, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  editSearchHeaderSpacer: { width: SYM.headerIconBox },
  editSearchBody: { flex: 1 },
  editSearchFromToWrap: { gap: SYM.itemGap, marginBottom: SYM.sectionGap },
  editSearchInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SYM.cardPadding,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  editSearchInputIcon: { marginRight: SYM.cardPadding },
  editSearchInputInner: { flex: 1, minWidth: 0 },
  editSearchLabel: { ...typography.overline, fontSize: 10, marginBottom: 2, letterSpacing: 1 },
  editSearchValue: { ...typography.body, fontWeight: '700' },
  editSearchSwapBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  editSearchRow: { flexDirection: 'row', gap: SYM.sectionGap },
  editSearchInputHalf: { flex: 1 },
  seeResultsBtn: {
    paddingVertical: SYM.sectionGap,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: SYM.sectionGap,
  },
  seeResultsBtnText: { ...typography.h3, fontWeight: '800' },
  // —— Picker (symmetric option row) ——
  pickerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCloseBtn: {
    paddingVertical: SYM.cardPadding,
    paddingHorizontal: SYM.sectionGap,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  pickerCloseBtnText: { ...typography.bodySmall, fontWeight: '700' },
  // —— Filter sheet (symmetric sections + grid) ——
  sortOverlay: { flex: 1 },
  sortSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: SYM.sectionGap,
    paddingTop: SYM.cardPadding,
    paddingBottom: SYM.sectionGap + 24,
  },
  sortSheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: SYM.sectionGap,
  },
  sortSheetTitle: { ...typography.h3, fontWeight: '800', marginBottom: SYM.sectionGap },
  filterLabel: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: SYM.itemGap,
    marginTop: SYM.sectionGap,
    letterSpacing: 0.5,
  },
  filterTypeRow: {
    flexDirection: 'row',
    gap: SYM.itemGap,
    marginBottom: SYM.itemGap,
  },
  filterChip: {
    flex: 1,
    paddingVertical: SYM.cardPadding,
    paddingHorizontal: SYM.sectionGap,
    borderRadius: radii.lg,
  },
  filterChipText: { ...typography.bodySmall, fontWeight: '700' },
  filterInputRow: {
    flexDirection: 'row',
    gap: SYM.sectionGap,
    marginTop: SYM.sectionGap,
  },
  filterInputHalf: { flex: 1 },
  filterLabelInGrid: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: SYM.itemGap,
    letterSpacing: 0.5,
  },
  filterInput: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: SYM.sectionGap,
    paddingVertical: SYM.cardPadding,
    ...typography.bodySmall,
  },
  applyFiltersBtn: {
    marginTop: SYM.sectionGap,
    paddingVertical: SYM.sectionGap,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  applyFiltersBtnText: { ...typography.body, fontWeight: '800' },
  // —— Main content ——
  mainWrap: {
    flex: 1,
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingTop: SYM.itemGap,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SYM.itemGap,
    paddingHorizontal: spacing.xs,
  },
  listHeaderCount: { ...typography.overline, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  trendsBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trendsText: { ...typography.overline, fontSize: 9, fontWeight: '700' },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingIcon: { marginBottom: SYM.cardPadding },
  loadingBar: { width: 128, height: 16, borderRadius: 8, marginTop: SYM.itemGap },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SYM.cardPadding,
  },
  emptyText: { ...typography.body, fontWeight: '700' },
  emptySubtitle: { ...typography.bodySmall, marginTop: spacing.xs },
  listScroll: { flex: 1 },
  listContent: { paddingTop: spacing.xs, gap: SYM.itemGap },
  // —— Trip card (symmetric header, timeline rows, footer) ——
  tripCard: {
    borderRadius: radii.lg,
    padding: SYM.cardPadding,
    borderWidth: 1,
    marginBottom: SYM.itemGap,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SYM.cardPadding,
  },
  tripCardDriverRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tripCardAvatarWrap: { position: 'relative' },
  tripCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripCardVerified: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    padding: 2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  tripCardDriverInfo: { flex: 1, minWidth: 0, justifyContent: 'center' },
  tripCardDriverName: { ...typography.bodySmall, fontWeight: '700', marginBottom: 2 },
  tripCardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tripCardRatingText: { ...typography.overline, fontSize: 10, fontWeight: '700' },
  tripCardPriceCol: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  tripCardPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  tripCardPriceLabel: { ...typography.overline, fontSize: 10, fontWeight: '700' },
  tripCardPriceValue: { ...typography.h3, fontSize: 20, fontWeight: '800' },
  tripCardInstantRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  tripCardInstantText: { ...typography.overline, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  tripCardTimeline: { flexDirection: 'row', gap: SYM.itemGap, marginBottom: SYM.cardPadding },
  tripCardDots: { alignItems: 'center', paddingVertical: 2 },
  tripCardDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1 },
  tripCardLine: { width: 2, flex: 1, minHeight: 20, marginVertical: 2 },
  tripCardTimelineContent: { flex: 1, minWidth: 0 },
  tripCardTimelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SYM.itemGap,
  },
  tripCardTimelineLeft: { flex: 1, minWidth: 0 },
  tripCardTime: { ...typography.bodySmall, fontWeight: '800' },
  tripCardPlace: { ...typography.bodySmall, fontSize: 11, marginTop: 2 },
  tripCardRightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  tripCardDurationText: { ...typography.overline, fontSize: 9, fontWeight: '700' },
  tripCardCarRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tripCardCarText: { ...typography.overline, fontSize: 9, fontWeight: '700' },
  tripCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SYM.cardPadding,
    borderTopWidth: 1,
  },
  tripCardAmenitiesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  tripCardAmenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tripCardAmenityText: { ...typography.overline, fontSize: 9, fontWeight: '700' },
  tripCardSeatsText: { ...typography.overline, fontSize: 10, fontWeight: '800' },
});
