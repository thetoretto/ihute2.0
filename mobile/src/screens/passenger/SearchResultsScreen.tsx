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
import { spacing, typography, radii, colors } from '../../utils/theme';
import { listBottomPaddingTab, screenContentPadding } from '../../utils/layout';
import { useThemeColors } from '../../context/ThemeContext';
import { selectorStyles } from '../../utils/selectorStyles';
import type { Trip, Hotpoint } from '../../types';

const DEFAULT_FILTERS = {
  maxPrice: 100000,
  minSeats: 1,
};

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
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    getHotpoints().then(setHotpoints);
  }, []);

  useEffect(() => {
    setFromId(route.params?.fromId);
    setToId(route.params?.toId);
  }, [route.params?.fromId, route.params?.toId]);

  const fromH = fromHotpoint ?? (fromId ? hotpoints.find((h) => h.id === fromId) ?? null : null);
  const toH = toHotpoint ?? (toId ? hotpoints.find((h) => h.id === toId) ?? null : null);
  const fromName = fromH ? getHotpointLabel(fromH) : '';
  const toName = toH ? getHotpointLabel(toH) : '';

  const loadTrips = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      const t = await searchTrips({ fromId, toId });
      const filtered = t.filter(
        (item) =>
          item.pricePerSeat <= filters.maxPrice &&
          item.seatsAvailable >= filters.minSeats
      );
      setTrips(filtered);
      if (showLoading) setLoading(false);
    },
    [filters.maxPrice, filters.minSeats, fromId, toId]
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

  const filteredAndSortedTrips = useMemo(() => {
    let result = [...trips];
    if (sortBy === 'earliest') {
      result.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.driver.rating ?? 0) - (a.driver.rating ?? 0));
    }
    return result;
  }, [trips, sortBy]);

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
      {/* Sticky header: back + From? / To? + Sort results */}
      <View style={[styles.stickyHeader, { backgroundColor: c.card, borderBottomColor: c.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.inputBox, { backgroundColor: c.background || c.ghostBg }]}
            onPress={() => setPickerMode('from')}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={16} color={c.primary} style={styles.inputIcon} />
            <Text style={[styles.inputText, !fromName && styles.inputPlaceholder, { color: fromName ? c.text : c.textMuted }]} numberOfLines={1}>
              {fromName || 'From?'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.inputBox, { backgroundColor: c.background || c.ghostBg }]}
            onPress={() => setPickerMode('to')}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={16} color={c.primary} style={styles.inputIcon} />
            <Text style={[styles.inputText, !toName && styles.inputPlaceholder, { color: toName ? c.text : c.textMuted }]} numberOfLines={1}>
              {toName || 'To?'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sortRow}>
          <TouchableOpacity
            onPress={() => setSortSheetVisible(true)}
            style={styles.sortBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={14} color={c.primary} />
            <Text style={[styles.sortBtnText, { color: c.primary }]}>Sort results</Text>
          </TouchableOpacity>
          <Text style={[styles.ridesCount, { color: c.textMuted }]}>{filteredAndSortedTrips.length} rides found</Text>
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

      {/* Sort bottom sheet */}
      <Modal visible={sortSheetVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setSortSheetVisible(false)}>
          <View style={[styles.sortOverlay, { backgroundColor: c.overlayModal }]} />
        </TouchableWithoutFeedback>
        <View style={[styles.sortSheet, { backgroundColor: c.card }]}>
          <View style={[styles.sortSheetHandle, { backgroundColor: c.border }]} />
          <Text style={[styles.sortSheetTitle, { color: c.text }]}>Sort by</Text>
          {sortOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.sortOptionBtn,
                { borderColor: sortBy === opt.value ? c.primary : c.borderLight },
                sortBy === opt.value && { backgroundColor: c.primaryTint },
              ]}
              onPress={() => {
                setSortBy(opt.value);
                setSortSheetVisible(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.sortOptionText, { color: sortBy === opt.value ? c.primary : c.textMuted }]}>{opt.label}</Text>
              {sortBy === opt.value && <Ionicons name="checkmark-circle" size={18} color={c.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.passengerBgLight },
  stickyHeader: {
    paddingHorizontal: screenContentPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
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
    paddingVertical: 10,
    borderRadius: 12,
  },
  inputIcon: { marginRight: spacing.sm },
  inputText: { ...typography.bodySmall, fontWeight: '700', flex: 1 },
  inputPlaceholder: { fontWeight: '500' },
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 24,
  },
  sortSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sortSheetTitle: {
    ...typography.h3,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  sortOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  sortOptionText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
});
