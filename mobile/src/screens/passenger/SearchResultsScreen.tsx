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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  RideCard,
  Screen,
  CarWheelLoader,
  CarRefreshIndicator,
} from '../../components';
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

function getHotpointLabel(h: Hotpoint) {
  return h.country ? `${h.name}, ${h.country}` : h.name;
}

export default function SearchResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ SearchResults: { fromId?: string; toId?: string; passengerCount?: number; date?: string } }, 'SearchResults'>>();
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
  const [tempFromId, setTempFromId] = useState<string | undefined>(undefined);
  const [tempToId, setTempToId] = useState<string | undefined>(undefined);
  const [tempDate, setTempDate] = useState<string | undefined>(undefined);
  const [tempPassengers, setTempPassengers] = useState(1);

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
  const fromName = fromH ? getHotpointLabel(fromH) : '';
  const toName = toH ? getHotpointLabel(toH) : '';

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

  const filteredAndSortedTrips = useMemo(() => [...trips], [trips]);

  const filteredHotpoints =
    pickerQuery.trim().length > 0
      ? hotpoints.filter(
          (h) =>
            h.name.toLowerCase().includes(pickerQuery.trim().toLowerCase()) ||
            h.country?.toLowerCase().includes(pickerQuery.trim().toLowerCase()) ||
            (h.address?.toLowerCase().includes(pickerQuery.trim().toLowerCase()))
        )
      : hotpoints;

  const onSelectHotpoint = (h: Hotpoint) => {
    if (isSearchOpen) {
      if (pickerMode === 'from') setTempFromId(h.id);
      if (pickerMode === 'to') setTempToId(h.id);
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

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'earliest', label: 'Earliest Departure' },
    { value: 'price-low', label: 'Lowest Price' },
    { value: 'rating', label: 'Highest Rating' },
  ];

  const openEditSearch = () => {
    setTempFromId(fromId);
    setTempToId(toId);
    setTempDate(dateFilter);
    setTempPassengers(filters.minSeats);
    setIsSearchOpen(true);
  };

  const applyEditSearch = () => {
    setFromId(tempFromId);
    setToId(tempToId);
    setFromHotpoint(tempFromId ? (hotpoints.find((h) => h.id === tempFromId) ?? null) : null);
    setToHotpoint(tempToId ? (hotpoints.find((h) => h.id === tempToId) ?? null) : null);
    setDateFilter(tempDate);
    setFilters((f) => ({ ...f, minSeats: tempPassengers }));
    setIsSearchOpen(false);
    loadTrips(true);
  };

  const swapLocations = () => {
    setTempFromId(tempToId);
    setTempToId(tempFromId);
  };

  const dateLabel = dateFilter ? new Date(dateFilter).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Any date';
  const passengerLabel = filters.minSeats === 1 ? '1 passenger' : `${filters.minSeats} passengers`;

  return (
    <Screen contentInset={false} style={[styles.container, { backgroundColor: c.appBackground }]}>
      {/* Edit Search full-screen modal (template) */}
      <Modal visible={isSearchOpen} animationType="slide">
        <View style={[styles.editSearchModal, { backgroundColor: c.card, paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.editSearchHeader}>
            <TouchableOpacity onPress={() => setIsSearchOpen(false)} style={styles.editSearchClose} hitSlop={12}>
              <Ionicons name="close" size={28} color={c.primary} />
            </TouchableOpacity>
            <Text style={[styles.editSearchTitle, { color: c.text }]}>Edit Search</Text>
            <View style={styles.editSearchHeaderSpacer} />
          </View>
          <View style={styles.editSearchBody}>
            <View style={styles.editSearchFromToWrap}>
              <View style={styles.editSearchFromTo}>
                <TouchableOpacity
                  style={[styles.editSearchInputCard, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }]}
                  onPress={() => setPickerMode('from')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="location" size={20} color={c.primary} style={styles.editSearchInputIcon} />
                  <View style={styles.editSearchInputInner}>
                    <Text style={[styles.editSearchLabel, { color: c.textMuted }]}>Leaving from</Text>
                    <Text style={[styles.editSearchValue, { color: c.text }]} numberOfLines={1}>
                      {tempFromId ? getHotpointLabel(hotpoints.find((h) => h.id === tempFromId) ?? { id: '', name: '', latitude: 0, longitude: 0 }) : 'Select location'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.editSearchSwapBtnSpacer} />
                <TouchableOpacity
                  style={[styles.editSearchInputCard, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }]}
                  onPress={() => setPickerMode('to')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="location-outline" size={20} color={c.textMuted} style={styles.editSearchInputIcon} />
                  <View style={styles.editSearchInputInner}>
                    <Text style={[styles.editSearchLabel, { color: c.textMuted }]}>Going to</Text>
                    <Text style={[styles.editSearchValue, { color: c.text }]} numberOfLines={1}>
                      {tempToId ? getHotpointLabel(hotpoints.find((h) => h.id === tempToId) ?? { id: '', name: '', latitude: 0, longitude: 0 }) : 'Select location'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.editSearchSwapBtn, { backgroundColor: c.card, borderColor: c.borderLight }]}
                onPress={swapLocations}
              >
                <Ionicons name="swap-vertical" size={18} color={c.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.editSearchRow}>
              <View style={[styles.editSearchInputCard, styles.editSearchInputHalf, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }]}>
                <Ionicons name="calendar-outline" size={20} color={c.textMuted} style={styles.editSearchInputIcon} />
                <View style={styles.editSearchInputInner}>
                  <Text style={[styles.editSearchLabel, { color: c.textMuted }]}>When</Text>
                  <TextInput
                    style={[styles.editSearchValue, { color: c.text }]}
                    value={tempDate ?? ''}
                    onChangeText={setTempDate}
                    placeholder="Any date"
                    placeholderTextColor={c.textMuted}
                  />
                </View>
              </View>
              <View style={[styles.editSearchInputCard, styles.editSearchInputHalf, { backgroundColor: c.surface ?? c.ghostBg, borderColor: c.borderLight }]}>
                <Ionicons name="people-outline" size={20} color={c.textMuted} style={styles.editSearchInputIcon} />
                <View style={styles.editSearchInputInner}>
                  <Text style={[styles.editSearchLabel, { color: c.textMuted }]}>Who</Text>
                  <TextInput
                    style={[styles.editSearchValue, { color: c.text }]}
                    value={String(tempPassengers)}
                    onChangeText={(v) => setTempPassengers(Math.max(1, parseInt(v, 10) || 1))}
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

      {/* Sticky header: Back, From → To, date + passengers, Search (template) */}
      <View style={[styles.stickyHeaderWrap, { backgroundColor: c.card, borderBottomColor: c.borderLight }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={c.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerRouteWrap} onPress={openEditSearch} activeOpacity={0.8}>
            <View style={styles.headerRouteRow}>
              <Text style={[styles.headerRouteFrom, { color: c.text }]} numberOfLines={1}>{fromName || 'From'}</Text>
              <Ionicons name="chevron-forward" size={14} color={c.textMuted} />
              <Text style={[styles.headerRouteTo, { color: c.text }]} numberOfLines={1}>{toName || 'To'}</Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>{dateLabel}, {passengerLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerSearchIconWrap, { backgroundColor: c.primaryTint }]} onPress={openEditSearch}>
            <Ionicons name="search" size={18} color={c.primary} />
          </TouchableOpacity>
        </View>
        {/* Quick filter pills: Earliest, Cheapest, Closest, More */}
        <View style={styles.filterPillsRow}>
          {(['Earliest', 'Cheapest', 'Closest'] as const).map((label) => {
            const value: SortOption = label === 'Earliest' ? 'earliest' : label === 'Cheapest' ? 'price-low' : 'rating';
            const active = sortBy === value;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setSortBy(value)}
                style={[
                  styles.filterPill,
                  { borderColor: active ? c.primary : c.borderLight, backgroundColor: active ? c.primary : c.card },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, { color: active ? (c.onPrimary ?? c.text) : c.textMuted }]}>{label}</Text>
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

      <CarWheelLoader visible={loading} />
      {filteredAndSortedTrips.length === 0 && !loading ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="search" size={48} color={c.textMuted} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: c.text }]}>No trips found</Text>
        </View>
      ) : null}
      <FlatList
        data={filteredAndSortedTrips}
        keyExtractor={(item) => item.id}
        style={[styles.listScroll, { backgroundColor: c.card }]}
        contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPaddingTab }]}
        ListHeaderComponent={
          <View style={styles.listHeaderRow}>
            <Text style={[styles.listHeaderCount, { color: c.textMuted }]}>
              {filteredAndSortedTrips.length} rides found
            </Text>
            <TouchableOpacity onPress={() => {}} style={styles.trendsBtn}>
              <Ionicons name="information-circle-outline" size={10} color={c.primary} />
              <Text style={[styles.trendsText, { color: c.primary }]}>TRENDS</Text>
            </TouchableOpacity>
          </View>
        }
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
          <RideCard
            trip={item}
            variant="searchResults"
            onPress={() => navigation.navigate('RideDetail', { tripId: item.id })}
          />
        )}
      />
      <CarRefreshIndicator state={refreshState} />

      {/* Hotpoint picker modal */}
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
                    <Text style={selectorStyles.optionPrimary}>{getHotpointLabel(item)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={selectorStyles.closeButton}
              onPress={() => {
                setPickerMode(null);
                setPickerQuery('');
              }}
            >
              <Text style={selectorStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Filters & sort bottom sheet */}
      <Modal visible={filtersSheetVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setFiltersSheetVisible(false)}>
          <View style={[styles.sortOverlay, { backgroundColor: c.overlayModal }]} />
        </TouchableWithoutFeedback>
        <View style={[styles.sortSheet, { backgroundColor: c.card }]}>
          <View style={[styles.sortSheetHandle, { backgroundColor: c.border }]} />
          <Text style={[styles.sortSheetTitle, { color: c.text }]}>Filters & sort</Text>
          <Text style={[styles.filterLabel, { color: c.textMuted }]}>Trip type</Text>
          <View style={styles.filterTypeRow}>
            {(['all', 'insta', 'scheduled'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setTypeFilter(type)}
                style={[
                  styles.filterChip,
                  { borderColor: typeFilter === type ? c.primary : c.borderLight, backgroundColor: typeFilter === type ? c.primaryTint : c.background },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, { color: typeFilter === type ? c.primary : c.textMuted }]}>
                  {type === 'all' ? 'All' : type === 'insta' ? 'Instant' : 'Scheduled'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.filterLabel, { color: c.textMuted }]}>Max price (RWF)</Text>
          <TextInput
            style={[styles.filterInput, { backgroundColor: c.background, borderColor: c.borderLight, color: c.text }]}
            value={String(filters.maxPrice)}
            onChangeText={(v) => setFilters((f) => ({ ...f, maxPrice: Math.max(0, parseInt(v, 10) || 0) }))}
            keyboardType="number-pad"
            placeholder="e.g. 50000"
          />
          <Text style={[styles.filterLabel, { color: c.textMuted }]}>Min seats</Text>
          <TextInput
            style={[styles.filterInput, { backgroundColor: c.background, borderColor: c.borderLight, color: c.text }]}
            value={String(filters.minSeats)}
            onChangeText={(v) => setFilters((f) => ({ ...f, minSeats: Math.max(1, parseInt(v, 10) || 1) }))}
            keyboardType="number-pad"
            placeholder="1"
          />
          <Text style={[styles.filterLabel, { color: c.textMuted }]}>Sort by</Text>
          {sortOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.sortOptionBtn,
                { borderColor: sortBy === opt.value ? c.primary : c.borderLight },
                sortBy === opt.value && { backgroundColor: c.primaryTint },
              ]}
              onPress={() => setSortBy(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.sortOptionText, { color: sortBy === opt.value ? c.primary : c.textMuted }]}>{opt.label}</Text>
              {sortBy === opt.value && <Ionicons name="checkmark-circle" size={18} color={c.primary} />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.applyFiltersBtn, { backgroundColor: c.primary }]}
            onPress={() => { setFiltersSheetVisible(false); loadTrips(true); }}
            activeOpacity={0.9}
          >
            <Text style={[styles.applyFiltersBtnText, { color: c.onPrimary ?? c.text }]}>Apply</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Screen>
  );
}

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
  headerRouteFrom: { ...typography.body, fontWeight: '700', maxWidth: 100 },
  headerRouteTo: { ...typography.body, fontWeight: '700', maxWidth: 100 },
  headerSubtitle: { ...typography.overline, fontSize: 10, marginTop: 2 },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  editSearchTitle: { ...typography.h3, fontWeight: '800' },
  editSearchHeaderSpacer: { width: 40 },
  editSearchBody: { flex: 1 },
  editSearchFromToWrap: { position: 'relative', marginBottom: spacing.lg },
  editSearchFromTo: { gap: spacing.sm },
  editSearchSwapBtnSpacer: { height: spacing.sm },
  editSearchInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  editSearchInputIcon: { marginRight: spacing.md },
  editSearchInputInner: { flex: 1, minWidth: 0 },
  editSearchLabel: { ...typography.overline, fontSize: 10, marginBottom: 2 },
  editSearchValue: { ...typography.body, fontWeight: '700' },
  editSearchSwapBtn: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  editSearchRow: { flexDirection: 'row', gap: spacing.md },
  editSearchInputHalf: { flex: 1 },
  seeResultsBtn: {
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  seeResultsBtnText: { ...typography.h3, fontWeight: '800' },
  listScroll: { flex: 1 },
  listContent: {
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingTop: spacing.sm,
  },
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
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: { marginBottom: spacing.md },
  emptyText: { ...typography.body, fontWeight: '700' },
  sortOverlay: {
    flex: 1,
  },
  sortSheet: {
    borderTopLeftRadius: radii.xlMobile,
    borderTopRightRadius: radii.xlMobile,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 24,
  },
  sortSheetHandle: {
    width: sizes.sheetHandle.width,
    height: sizes.sheetHandle.height,
    borderRadius: radii.sm / 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sortSheetTitle: {
    ...typography.h3,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  filterLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  filterTypeRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', marginBottom: spacing.sm },
  filterChip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  filterChipText: { ...typography.bodySmall, fontWeight: '700' },
  filterInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  applyFiltersBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  applyFiltersBtnText: { ...typography.body, fontWeight: '800' },
  sortOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  sortOptionText: {
    ...typography.body,
    fontWeight: '700',
  },
});
