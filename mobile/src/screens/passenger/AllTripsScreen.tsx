import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { spacing, typography, radii, sizes, cardShadow } from '../../utils/theme';
import { landingHeaderPaddingHorizontal, listBottomPaddingTab, screenContentStartPaddingTop } from '../../utils/layout';
import { useThemeColors } from '../../context/ThemeContext';
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
        <View style={[styles.editSearchModal, { backgroundColor: c.card, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
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
                style={[styles.editSearchInputCard, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }, styles.editSearchInputCardElevated]}
                onPress={() => setPickerMode('from')}
                activeOpacity={0.8}
              >
                <View style={[styles.editSearchInputIconWrap, { backgroundColor: c.primaryTint }]}>
                  <Ionicons name="location" size={20} color={c.primary} />
                </View>
                <View style={styles.editSearchInputInner}>
                  <Text style={[styles.editSearchLabel, { color: c.textMuted }]}>LEAVING FROM</Text>
                  <Text style={[styles.editSearchValue, { color: c.text }]} numberOfLines={1}>
                    {getHotpointLabelById(hotpoints, tempParams.fromId)}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSearchSwapBtn, { backgroundColor: c.card, borderColor: c.borderLight }, styles.editSearchSwapBtnElevated]}
                onPress={swapLocations}
              >
                <Ionicons name="swap-vertical" size={18} color={c.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSearchInputCard, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }, styles.editSearchInputCardElevated]}
                onPress={() => setPickerMode('to')}
                activeOpacity={0.8}
              >
                <View style={[styles.editSearchInputIconWrap, { backgroundColor: c.surface }]}>
                  <Ionicons name="location-outline" size={20} color={c.textMuted} />
                </View>
                <View style={styles.editSearchInputInner}>
                  <Text style={[styles.editSearchLabel, { color: c.textMuted }]}>GOING TO</Text>
                  <Text style={[styles.editSearchValue, { color: c.text }]} numberOfLines={1}>
                    {getHotpointLabelById(hotpoints, tempParams.toId)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.editSearchRow}>
              <View style={[styles.editSearchInputCard, styles.editSearchInputHalf, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }, styles.editSearchInputCardElevated]}>
                <View style={[styles.editSearchInputIconWrap, { backgroundColor: c.surface }]}>
                  <Ionicons name="calendar-outline" size={20} color={c.textMuted} />
                </View>
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
              <View style={[styles.editSearchInputCard, styles.editSearchInputHalf, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }, styles.editSearchInputCardElevated]}>
                <View style={[styles.editSearchInputIconWrap, { backgroundColor: c.surface }]}>
                  <Ionicons name="people-outline" size={20} color={c.textMuted} />
                </View>
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
            style={[styles.seeResultsBtn, { backgroundColor: c.primary }, styles.seeResultsBtnElevated]}
            onPress={applyEditSearch}
            activeOpacity={0.9}
          >
            <Text style={[styles.seeResultsBtnText, { color: c.onPrimary ?? c.text }]}>See results</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 2. Hotpoint Picker Overlay (template) */}
      <Modal visible={pickerMode !== null} animationType="slide" transparent>
        <View style={[styles.pickerOverlay, { backgroundColor: c.overlayModal ?? 'rgba(0,0,0,0.55)' }]}>
          <View style={[styles.pickerSheet, { backgroundColor: c.card }]}>
            <View style={[styles.pickerSearchRow, { backgroundColor: c.surface, borderColor: c.borderLight }]}>
              <Ionicons name="search" size={18} color={c.textMuted} />
              <TextInput
                style={[styles.pickerSearchInput, { color: c.text }]}
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
              style={styles.pickerList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerOptionRow, { borderColor: c.borderLight }]}
                  onPress={() => onSelectHotpoint(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.pickerIconWrap, { backgroundColor: c.primaryTint }]}>
                    <Ionicons name="location-outline" size={18} color={c.primary} />
                  </View>
                  <Text style={[styles.pickerOptionText, { color: c.text }]} numberOfLines={1}>
                    {item.name}, {item.country ?? ''}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
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
      <View style={[styles.stickyHeaderWrap, { backgroundColor: c.card, borderBottomColor: c.borderLight }, styles.stickyHeaderShadow]}>
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
          <TouchableOpacity style={[styles.headerSearchIconWrap, { backgroundColor: c.primaryTint }, styles.headerSearchIconShadow]} onPress={openEditSearch}>
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
                  active && styles.filterPillActiveShadow,
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
        <View style={[styles.sortSheet, { backgroundColor: c.card }, styles.sortSheetShadow]}>
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
          <Text style={[styles.filterLabel, { color: c.textMuted }]}>MAX PRICE (RWF)</Text>
          <TextInput
            style={[styles.filterInput, { backgroundColor: c.background, borderColor: c.borderLight, color: c.text }]}
            value={String(filters.maxPrice)}
            onChangeText={(v) => setFilters((f) => ({ ...f, maxPrice: Math.max(0, parseInt(v, 10) || 0) }))}
            keyboardType="number-pad"
            placeholder="e.g. 50000"
          />
          <Text style={[styles.filterLabel, { color: c.textMuted }]}>MIN SEATS</Text>
          <TextInput
            style={[styles.filterInput, { backgroundColor: c.background, borderColor: c.borderLight, color: c.text }]}
            value={String(filters.minSeats)}
            onChangeText={(v) => setFilters((f) => ({ ...f, minSeats: Math.max(1, parseInt(v, 10) || 1) }))}
            keyboardType="number-pad"
            placeholder="1"
          />
          <TouchableOpacity
            style={[styles.applyFiltersBtn, { backgroundColor: c.primary }, styles.applyFiltersBtnShadow]}
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
      <View style={[styles.mainWrap, { backgroundColor: c.appBackground }]}>
        <View style={styles.listHeaderRow}>
          <Text style={[styles.listHeaderCount, { color: c.textMuted }]}>{trips.length} rides found</Text>
          <TouchableOpacity onPress={() => {}} style={styles.trendsBtn}>
            <Ionicons name="information-circle-outline" size={12} color={c.primary} />
            <Text style={[styles.trendsText, { color: c.primary }]}>TRENDS</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <View style={[styles.emptyIconCircle, { backgroundColor: c.surface }, styles.loadingIconCircle]}>
              <Ionicons name="car-sport-outline" size={40} color={c.primaryTint ?? c.textMuted} />
            </View>
            <View style={[styles.loadingBar, { backgroundColor: c.surface }]} />
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconCircle, { backgroundColor: c.surface }, styles.emptyIconCircleElevated]}>
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
      style={[styles.tripCard, { backgroundColor: c.card, borderColor: c.borderLight }, styles.tripCardShadow]}
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
            <View>
              <Text style={[styles.tripCardTime, { color: c.text }]}>{depTime}</Text>
              <Text style={[styles.tripCardPlace, { color: c.textMuted }]} numberOfLines={1}>{fromPlace}</Text>
            </View>
            <View style={[styles.tripCardDurationPill, { backgroundColor: c.surface }]}>
              <Ionicons name="time-outline" size={9} color={c.textMuted} />
              <Text style={[styles.tripCardDurationText, { color: c.textMuted }]}>{duration}</Text>
            </View>
          </View>
          <View style={styles.tripCardTimelineRow}>
            <View>
              <Text style={[styles.tripCardTime, { color: c.text }]}>{arrTime}</Text>
              <Text style={[styles.tripCardPlace, { color: c.textMuted }]} numberOfLines={1}>{toPlace}</Text>
            </View>
            <View style={styles.tripCardCarRow}>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeaderWrap: {
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingTop: screenContentStartPaddingTop,
    paddingBottom: spacing.sm,
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
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerRouteWrap: { flex: 1, minWidth: 0 },
  headerRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerRouteFrom: { ...typography.body, fontWeight: '700', maxWidth: 80 },
  headerRouteTo: { ...typography.body, fontWeight: '700', maxWidth: 80 },
  headerSubtitle: { ...typography.overline, fontSize: 10, marginTop: 2, textTransform: 'uppercase' },
  headerSearchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  filterPillText: { ...typography.overline, fontSize: 11, fontWeight: '700' },
  editSearchModal: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  editSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  editSearchClose: { padding: spacing.sm },
  editSearchTitle: { ...typography.h3, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  editSearchHeaderSpacer: { width: 40 },
  editSearchBody: { flex: 1 },
  editSearchFromToWrap: { gap: spacing.sm, marginBottom: spacing.lg },
  editSearchInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  editSearchInputCardElevated: {
    ...cardShadow,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  editSearchInputIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  editSearchInputInner: { flex: 1, minWidth: 0 },
  editSearchLabel: { ...typography.overline, fontSize: 10, marginBottom: 2, letterSpacing: 1 },
  editSearchValue: { ...typography.body, fontWeight: '700' },
  editSearchSwapBtn: {
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSearchSwapBtnElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  editSearchRow: { flexDirection: 'row', gap: spacing.md },
  editSearchInputHalf: { flex: 1 },
  seeResultsBtn: {
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  seeResultsBtnElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  seeResultsBtnText: { ...typography.h3, fontWeight: '800' },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pickerSearchInput: {
    flex: 1,
    ...typography.body,
  },
  pickerList: { maxHeight: 320 },
  pickerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  pickerOptionText: { ...typography.body, fontWeight: '700', flex: 1 },
  pickerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCloseBtn: {
    padding: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  pickerCloseBtnText: { ...typography.bodySmall, fontWeight: '700' },
  stickyHeaderShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  headerSearchIconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  filterPillActiveShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  sortOverlay: { flex: 1 },
  sortSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 24,
  },
  sortSheetShadow: {
    ...cardShadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  sortSheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sortSheetTitle: { ...typography.h3, fontWeight: '800', marginBottom: spacing.lg },
  filterLabel: { ...typography.overline, fontSize: 10, fontWeight: '800', marginBottom: spacing.sm, marginTop: spacing.md, letterSpacing: 0.5 },
  filterTypeRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', marginBottom: spacing.sm },
  filterChip: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  filterChipText: { ...typography.bodySmall, fontWeight: '700' },
  filterInput: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  applyFiltersBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  applyFiltersBtnShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyFiltersBtnText: { ...typography.body, fontWeight: '800' },
  mainWrap: { flex: 1, paddingHorizontal: landingHeaderPaddingHorizontal, paddingTop: spacing.md },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  loadingIconCircle: {
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingIcon: { marginBottom: spacing.md },
  loadingBar: { width: 140, height: 8, borderRadius: 4, marginTop: spacing.sm },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyIconCircleElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyText: { ...typography.body, fontWeight: '700', fontSize: 16 },
  emptySubtitle: { ...typography.bodySmall, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xl },
  listScroll: { flex: 1 },
  listContent: { paddingTop: spacing.sm, gap: spacing.md },
  tripCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  tripCardShadow: {
    ...cardShadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  tripCardDriverRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tripCardAvatarWrap: { position: 'relative' },
  tripCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
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
  tripCardDriverInfo: {},
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
  tripCardPriceCol: { alignItems: 'flex-end' },
  tripCardPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  tripCardPriceLabel: { ...typography.overline, fontSize: 10, fontWeight: '700' },
  tripCardPriceValue: { ...typography.h3, fontSize: 20, fontWeight: '800' },
  tripCardInstantRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  tripCardInstantText: { ...typography.overline, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  tripCardTimeline: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tripCardDots: { alignItems: 'center', paddingVertical: 2 },
  tripCardDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  tripCardLine: { width: 2, flex: 1, minHeight: 24, marginVertical: 2 },
  tripCardTimelineContent: { flex: 1 },
  tripCardTimelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  tripCardTime: { ...typography.bodySmall, fontWeight: '800' },
  tripCardPlace: { ...typography.bodySmall, fontSize: 11, marginTop: 2 },
  tripCardDurationPill: {
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
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  tripCardAmenitiesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
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
