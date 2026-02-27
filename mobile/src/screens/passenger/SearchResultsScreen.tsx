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
  Card,
  RideCard,
  Screen,
  CarWheelLoader,
  CarRefreshIndicator,
} from '../../components';
import { searchTrips, getHotpoints } from '../../services/api';
import { spacing, typography, radii, colors } from '../../utils/theme';
import { listBottomPaddingTab, screenContentPadding } from '../../utils/layout';
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
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [filtersSheetVisible, setFiltersSheetVisible] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

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
    if (pickerMode === 'from') {
      setFromId(h.id);
      setFromHotpoint(h);
    }
    if (pickerMode === 'to') {
      setToId(h.id);
      setToHotpoint(h);
    }
    setPickerMode(null);
    setPickerQuery('');
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'earliest', label: 'Earliest Departure' },
    { value: 'price-low', label: 'Lowest Price' },
    { value: 'rating', label: 'Highest Rating' },
  ];

  return (
    <Screen style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sticky header: search card with back + From? / To? + Sort results */}
      <View style={styles.stickyHeaderWrap}>
        <Card variant="elevated" padding="md" style={styles.searchCard}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={c.text} />
          </TouchableOpacity>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[styles.inputBox, { backgroundColor: c.background || c.ghostBg, borderColor: c.borderLight }]}
              onPress={() => setPickerMode('from')}
              activeOpacity={0.8}
            >
              <Ionicons name="location" size={16} color={c.primary} style={styles.inputIcon} />
              <Text style={[styles.inputText, !fromName && styles.inputPlaceholder, { color: fromName ? c.text : c.textMuted }]} numberOfLines={1}>
                {fromName || 'From?'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inputBox, { backgroundColor: c.background || c.ghostBg, borderColor: c.borderLight }]}
              onPress={() => setPickerMode('to')}
              activeOpacity={0.8}
            >
              <Ionicons name="location" size={16} color={c.primary} style={styles.inputIcon} />
              <Text style={[styles.inputText, !toName && styles.inputPlaceholder, { color: toName ? c.text : c.textMuted }]} numberOfLines={1}>
                {toName || 'To?'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.typeRow}>
            {(['all', 'insta', 'scheduled'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setTypeFilter(type)}
                style={[
                  styles.typeChip,
                  { borderColor: c.borderLight, backgroundColor: typeFilter === type ? c.primaryTint : (c.background || c.ghostBg) },
                  typeFilter === type && { borderColor: c.primary },
                ]}
                activeOpacity={0.8}
              >
                {type === 'insta' && <Ionicons name="flash" size={12} color={typeFilter === type ? c.primary : c.textMuted} style={styles.typeChipIcon} />}
                <Text style={[styles.typeChipText, { color: typeFilter === type ? c.primary : c.textMuted }]}>
                  {type === 'all' ? 'All' : type === 'insta' ? 'Instant' : 'Scheduled'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sortRow}>
            <TouchableOpacity onPress={() => setFiltersSheetVisible(true)} style={styles.sortBtn} activeOpacity={0.8}>
              <Ionicons name="options-outline" size={14} color={c.primary} />
              <Text style={[styles.sortBtnText, { color: c.primary }]}>Filters & sort</Text>
            </TouchableOpacity>
            <Text style={[styles.ridesCount, { color: c.textMuted }]}>{filteredAndSortedTrips.length} rides</Text>
          </View>
        </Card>
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
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          filteredAndSortedTrips.length > 0 ? (
            <Text style={[styles.listHeaderLabel, { color: c.textMuted }]}>Select a trip</Text>
          ) : null
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
  container: { flex: 1, backgroundColor: colors.passengerBgLight },
  stickyHeaderWrap: {
    paddingHorizontal: screenContentPadding,
    paddingBottom: spacing.sm,
  },
  searchCard: { marginBottom: 0 },
  backBtn: { padding: spacing.xs, marginBottom: spacing.xs },
  inputRow: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  inputIcon: { marginRight: spacing.sm },
  inputText: { ...typography.bodySmall, fontWeight: '700', flex: 1 },
  inputPlaceholder: { fontWeight: '500' },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  typeChipIcon: { marginRight: 4 },
  typeChipText: { ...typography.caption, fontWeight: '700' },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  sortBtnText: { ...typography.caption, fontWeight: '800' },
  ridesCount: { ...typography.caption, fontWeight: '800', textTransform: 'uppercase', fontSize: 10 },
  listContent: {
    paddingHorizontal: screenContentPadding,
    paddingTop: spacing.md,
    paddingBottom: listBottomPaddingTab,
  },
  listHeaderLabel: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 10,
    marginBottom: spacing.sm,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
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
    width: 40,
    height: 4,
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
    ...typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  filterTypeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.xs },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  filterChipText: { ...typography.bodySmall, fontWeight: '700' },
  filterInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  applyFiltersBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  applyFiltersBtnText: { ...typography.bodySmall, fontWeight: '800' },
  sortOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  sortOptionText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
});
