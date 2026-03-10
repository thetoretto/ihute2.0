import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { RoleToggle, Screen, CarRefreshIndicator, LandingHeader } from '../../components';
import { useResponsiveThemeContext } from '../../context/ResponsiveThemeContext';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, typography, radii, sizes, buttonHeights } from '../../utils/theme';
import { landingHeaderPaddingHorizontal, listBottomPaddingTab, listScreenHeaderPaddingVertical } from '../../utils/layout';
import { strings } from '../../constants/strings';
import { searchTrips, getUserBookings, getHotpoints, type SearchTripsSortBy } from '../../services/api';
import { selectorStyles } from '../../utils/selectorStyles';
import { formatRwf } from '../../../../shared/src';
import type { Trip, Booking, Hotpoint } from '../../types';

type ViewMode = 'search' | 'results';
type SortBy = 'earliest' | 'price';

function getHotpointLabel(h: Hotpoint) {
  return h.country ? `${h.name}, ${h.country}` : h.name;
}

export default function PassengerHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { currentRole, switchRole, hasApprovedVehicle } = useRole();
  const responsive = useResponsiveThemeContext();
  const c = useThemeColors();
  const effectiveSpacing = responsive?.spacing ?? spacing;

  const [view, setView] = React.useState<ViewMode>('search');
  const [sortBy, setSortBy] = React.useState<SortBy>('earliest');
  const [showSortModal, setShowSortModal] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);

  const [availableTrips, setAvailableTrips] = React.useState<Trip[]>([]);
  const [completedBookings, setCompletedBookings] = React.useState<Booking[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshState, setRefreshState] = React.useState<'idle' | 'refreshing' | 'done'>('idle');

  const [fromId, setFromId] = React.useState<string | undefined>();
  const [toId, setToId] = React.useState<string | undefined>();
  const [fromLabel, setFromLabel] = React.useState('');
  const [toLabel, setToLabel] = React.useState('');
  const [hotpoints, setHotpoints] = React.useState<Hotpoint[]>([]);
  const [pickerMode, setPickerMode] = React.useState<'from' | 'to' | null>(null);
  const [pickerQuery, setPickerQuery] = React.useState('');

  const loadTrips = React.useCallback(
    async (from?: string, to?: string, sort?: SearchTripsSortBy) => {
      const items = await searchTrips({
        fromId: from ?? fromId,
        toId: to ?? toId,
        sortBy: sort ?? (sortBy === 'price' ? 'price' : 'earliest'),
      });
      return items;
    },
    [fromId, toId, sortBy]
  );

  const loadBookings = React.useCallback(async () => {
    if (user?.id) {
      const items = await getUserBookings(user.id);
      setCompletedBookings(items.filter((b) => b.status === 'completed'));
    }
  }, [user?.id]);

  React.useEffect(() => {
    getHotpoints().then(setHotpoints);
  }, []);

  React.useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  React.useEffect(() => {
    searchTrips({}).then((items) => setAvailableTrips(items.slice(0, 20)));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshState('refreshing');
    if (view === 'results') {
      const items = await loadTrips();
      setAvailableTrips(items);
    }
    await loadBookings();
    setRefreshState('done');
    setRefreshing(false);
    setTimeout(() => setRefreshState('idle'), 240);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const items = await loadTrips();
      setAvailableTrips(items);
      setView('results');
    } finally {
      setIsSearching(false);
    }
  };

  const swapLocations = () => {
    const prevFromId = fromId;
    const prevFromLabel = fromLabel;
    setFromId(toId);
    setFromLabel(toLabel);
    setToId(prevFromId);
    setToLabel(prevFromLabel);
  };

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
    const label = getHotpointLabel(h);
    if (pickerMode === 'from') {
      setFromId(h.id);
      setFromLabel(label);
    }
    if (pickerMode === 'to') {
      setToId(h.id);
      setToLabel(label);
    }
    setPickerMode(null);
    setPickerQuery('');
  };

  const activeDriverCount = React.useMemo(() => {
    const ids = new Set(availableTrips.map((t) => t.driver.id));
    return ids.size;
  }, [availableTrips]);

  const handleSortSelect = (value: SortBy) => {
    setSortBy(value);
    setShowSortModal(false);
    if (view === 'results' && availableTrips.length > 0) {
      const apiSort: SearchTripsSortBy = value === 'price' ? 'price' : 'earliest';
      loadTrips(fromId, toId, apiSort).then(setAvailableTrips);
    }
  };

  // ---- Search view ----
  const searchView = (
    <ScrollView
      style={styles.flex1}
      contentContainerStyle={[styles.searchScrollContent, { paddingBottom: listBottomPaddingTab }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[c.appAccent ?? c.primary]}
          tintColor={c.appAccent ?? c.primary}
          progressBackgroundColor={c.appBackground}
        />
      }
    >
      <LandingHeader title="Your pick of rides at low prices" />
      <View style={[styles.searchBlock, { paddingHorizontal: landingHeaderPaddingHorizontal }]}>
        {/* From / To card */}
        <View style={[styles.inputCard, { backgroundColor: c.card, borderColor: c.borderLight }]}>
          <TouchableOpacity
            style={[styles.inputRow, { borderBottomColor: c.borderLight }]}
            onPress={() => setPickerMode('from')}
          >
            <View style={[styles.inputDot, { borderColor: c.appAccent ?? c.primary }]}>
              <View style={[styles.inputDotInner, { backgroundColor: c.appAccent ?? c.primary }]} />
            </View>
            <Text style={[styles.inputLabel, { color: fromLabel ? c.text : c.textMuted }]} numberOfLines={1}>
              {fromLabel || 'From (e.g. Paris)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.swapBtn, { backgroundColor: c.surface, borderColor: c.buttonSecondaryBg ?? c.border }]} onPress={swapLocations}>
            <Ionicons name="swap-vertical" size={22} color={c.appAccent ?? c.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.inputRow} onPress={() => setPickerMode('to')}>
            <Ionicons name="location" size={22} color={c.appAccent ?? c.primary} />
            <Text style={[styles.inputLabel, { color: toLabel ? c.text : c.textMuted }]} numberOfLines={1}>
              {toLabel || 'To (e.g. Lyon)'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: c.appAccent ?? c.primary }]}
          onPress={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color={c.onAppPrimary ?? c.text} />
          ) : (
            <Text style={[styles.searchBtnText, { color: c.onAppPrimary ?? c.text }]}>Search trips</Text>
          )}
        </TouchableOpacity>

        {/* Community Pulse */}
        <View style={styles.pulseSection}>
          <View style={styles.pulseHeader}>
            <Ionicons name="trending-up" size={18} color={c.appAccent ?? c.primary} />
            <Text style={[styles.pulseSectionTitle, { color: c.appPrimary }]}>Community Pulse</Text>
          </View>

          <View style={styles.pulseGrid}>
            <View style={[styles.pulseCard, { backgroundColor: c.successTint, borderColor: c.success + '40' }]}>
              <View style={styles.pulseCardHeader}>
                <Ionicons name="flash" size={14} color={c.success} />
                <Text style={[styles.pulseCardTag, { color: c.appSuccessDark ?? c.text }]}>Live</Text>
              </View>
              <Text style={[styles.pulseCardValue, { color: c.appPrimary }]}>{activeDriverCount}</Text>
              <Text style={[styles.pulseCardLabel, { color: c.textMuted }]}>Active Drivers</Text>
            </View>
            <View style={[styles.pulseCard, { backgroundColor: c.primaryTint, borderColor: (c.appAccent ?? c.primary) + '30' }]}>
              <View style={styles.pulseCardHeader}>
                <Ionicons name="people" size={14} color={c.appAccent ?? c.primary} />
                <Text style={[styles.pulseCardTag, { color: c.appAccent ?? c.primary }]}>Safe</Text>
              </View>
              <Text style={[styles.pulseCardValue, { color: c.appPrimary }]}>98%</Text>
              <Text style={[styles.pulseCardLabel, { color: c.textMuted }]}>Rating Score</Text>
            </View>
          </View>

          <View style={[styles.pulsePeopleCard, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            <View style={styles.pulseAvatars}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.pulseAvatarRing,
                    { backgroundColor: c.surface, borderColor: c.card, marginLeft: i === 0 ? 0 : -8 },
                  ]}
                >
                  <Ionicons name="person" size={14} color={c.textMuted} />
                </View>
              ))}
            </View>
            <Text style={[styles.pulsePeopleText, { color: c.textMuted }]}>
              <Text style={[styles.pulsePeopleBold, { color: c.appPrimary }]}>
                {completedBookings.length > 0 ? completedBookings.length * 10 : '8.4k'} people
              </Text>
              {' '}traveled with the community in the last 24h.
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.shieldBannerWrap, { paddingHorizontal: landingHeaderPaddingHorizontal }]}>
        <View style={[styles.shieldBanner, { backgroundColor: (c.appAccent ?? c.primary) + '14', borderColor: (c.appAccent ?? c.primary) + '20' }]}>
          <Ionicons name="shield-checkmark" size={24} color={c.appAccent ?? c.primary} />
          <Text style={[styles.shieldBannerText, { color: c.appPrimary }]}>
            Every driver is verified for a safer community journey.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // ---- Results view ----
  const resultsView = (
    <View style={[styles.flex1, { backgroundColor: c.appSurfaceMuted ?? c.surface }]}>
      <View style={[styles.resultsHeader, { backgroundColor: c.card, borderBottomColor: c.borderLight }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            setView('search');
            searchTrips({}).then((items) => setAvailableTrips(items.slice(0, 20)));
          }}
        >
          <Ionicons name="chevron-back" size={22} color={c.appAccent ?? c.primary} />
          <Text style={[styles.backBtnText, { color: c.appAccent ?? c.primary }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.resultsInputRow}>
          <View style={[styles.resultsFromToCard, { backgroundColor: c.appSurfaceMuted ?? c.surface, borderColor: c.borderLight }]}>
            <View style={styles.resultsFromToRow}>
              <View style={[styles.resultsDot, { backgroundColor: c.appAccent ?? c.primary }]} />
              <Text style={[styles.resultsFromToLabel, { color: c.appPrimary }]} numberOfLines={1}>
                {fromLabel || 'From'}
              </Text>
            </View>
            <View style={[styles.resultsDivider, { backgroundColor: c.border }]} />
            <TouchableOpacity style={styles.resultsFromToRow} onPress={() => setPickerMode('to')}>
              <Ionicons name="location" size={12} color={c.appAccent ?? c.primary} />
              <Text style={[styles.resultsFromToLabel, { color: c.appPrimary }]} numberOfLines={1}>
                {toLabel || 'To'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                backgroundColor: sortBy !== 'earliest' ? (c.appAccent ?? c.primary) : (c.appSurfaceMuted ?? c.surface),
                borderColor: c.borderLight,
              },
            ]}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="options-outline" size={20} color={sortBy !== 'earliest' ? (c.onAppPrimary ?? c.text) : c.appPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.flex1}
        contentContainerStyle={[styles.resultsListContent, { paddingBottom: listBottomPaddingTab }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[c.appAccent ?? c.primary]}
            tintColor={c.appAccent ?? c.primary}
            progressBackgroundColor={c.appBackground}
          />
        }
      >
        <View style={styles.resultsListHeader}>
          <Text style={[styles.resultsCount, { color: c.textMuted }]}>{availableTrips.length} journeys found</Text>
          <Text style={[styles.resultsSortLabel, { color: c.appAccent ?? c.primary }]}>{sortBy} first</Text>
        </View>

        {availableTrips.length > 0 ? (
          availableTrips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={[styles.tripCard, { backgroundColor: c.card, borderColor: c.borderLight }]}
              onPress={() => navigation.navigate('RideDetail', { tripId: trip.id })}
              activeOpacity={0.98}
            >
              <View style={styles.tripCardTop}>
                <View style={styles.tripTimeline}>
                  <View style={[styles.timelineLine, { backgroundColor: c.borderLight }]} />
                  <View style={styles.tripTimelineRow}>
                    <View style={[styles.timelineDot, { borderColor: c.border, backgroundColor: c.card }]} />
                    <View>
                      <Text style={[styles.tripTime, { color: c.appPrimary }]}>{trip.departureTime.slice(0, 5)}</Text>
                      <Text style={[styles.tripPlace, { color: c.textMuted }]}>{trip.departureHotpoint.name}</Text>
                    </View>
                  </View>
                  <View style={styles.tripTimelineRow}>
                    <View style={[styles.timelineDot, styles.timelineDotArrival, { borderColor: c.appAccent ?? c.primary, backgroundColor: c.card }]} />
                    <View>
                      <Text style={[styles.tripTime, { color: c.appPrimary }]}>{trip.arrivalTime?.slice(0, 5) ?? '—'}</Text>
                      <Text style={[styles.tripPlace, { color: c.textMuted }]}>{trip.destinationHotpoint.name}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.tripPriceBlock}>
                  <Text style={[styles.tripPrice, { color: c.appPrimary }]}>{formatRwf(trip.pricePerSeat)}</Text>
                  <Text style={[styles.tripInstant, { color: c.success }]}>Instant Booking</Text>
                </View>
              </View>

              <View style={[styles.tripDivider, { backgroundColor: c.borderLight }]} />

              <View style={styles.tripDriverRow}>
                <View style={styles.tripDriverLeft}>
                  <View style={styles.tripDriverAvatarWrap}>
                    {trip.driver.avatarUri ? (
                      <Image source={{ uri: trip.driver.avatarUri }} style={styles.tripDriverAvatar} />
                    ) : (
                      <View style={[styles.tripDriverAvatar, { backgroundColor: c.surface }]}>
                        <Ionicons name="person" size={20} color={c.textMuted} />
                      </View>
                    )}
                    {trip.driver.statusBadge ? (
                      <View style={[styles.verifiedBadge, { backgroundColor: c.appAccent ?? c.primary }]}>
                        <Ionicons name="checkmark-circle" size={12} color={c.onAppPrimary ?? c.text} />
                      </View>
                    ) : null}
                  </View>
                  <View>
                    <Text style={[styles.tripDriverName, { color: c.appPrimary }]}>{trip.driver.name}</Text>
                    <View style={styles.tripDriverRating}>
                      <Ionicons name="star" size={12} color={c.starRating ?? c.warning} />
                      <Text style={[styles.tripDriverRatingText, { color: c.appPrimary }]}>{trip.driver.rating ?? '—'}</Text>
                      <Text style={[styles.tripDriverReviews, { color: c.textMuted }]}>reviews</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.tripChevronWrap, { backgroundColor: c.appSurfaceMuted ?? c.surface }]}>
                  <Ionicons name="chevron-forward" size={20} color={c.appAccent ?? c.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyResults}>
            <View style={[styles.emptyResultsIcon, { backgroundColor: c.surface }]}>
              <Ionicons name="search" size={32} color={c.textMuted} />
            </View>
            <Text style={[styles.emptyResultsTitle, { color: c.appPrimary }]}>No trips found</Text>
            <Text style={[styles.emptyResultsSubtitle, { color: c.textMuted }]}>
              Try changing your route or filters.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <Screen style={[styles.container, { backgroundColor: c.appBackground }]}>
      {user?.roles?.length && user.roles.length > 1 ? (
        <View style={[styles.roleToggleWrap, { paddingHorizontal: landingHeaderPaddingHorizontal }]}>
          <RoleToggle
            currentRole={currentRole}
            onSwitch={switchRole}
            hasApprovedVehicle={hasApprovedVehicle}
            availableRoles={user.roles}
            onNavigateToVehicleGarage={() =>
              (navigation.getParent() as any)?.getParent()?.navigate('VehicleGarage')
            }
          />
        </View>
      ) : null}

      {view === 'search' ? searchView : resultsView}

      <CarRefreshIndicator state={refreshState} />

      {/* Sort modal */}
      <Modal visible={showSortModal} animationType="slide" transparent>
        <TouchableOpacity
          style={[styles.sortOverlay, { backgroundColor: c.overlayModal }]}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        />
        <View style={[styles.sortSheet, { backgroundColor: c.card }]}>
          <View style={styles.sortSheetHeader}>
            <Text style={[styles.sortSheetTitle, { color: c.appPrimary }]}>Sort by</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)} style={[styles.sortSheetClose, { backgroundColor: c.appSurfaceMuted ?? c.surface }]}>
              <Ionicons name="close" size={20} color={c.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.sortOptions}>
            {(
              [
                { id: 'earliest' as const, label: 'Earliest departure', icon: 'time-outline' as const },
                { id: 'price' as const, label: 'Lowest price', icon: 'swap-vertical-outline' as const },
              ] as const
            ).map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.sortOption,
                  {
                    borderColor: sortBy === opt.id ? (c.appAccent ?? c.primary) : c.borderLight,
                    backgroundColor: sortBy === opt.id ? (c.primaryTint ?? c.surface) : (c.appSurfaceMuted ?? c.surface),
                  },
                ]}
                onPress={() => handleSortSelect(opt.id)}
              >
                <View style={styles.sortOptionLeft}>
                  <Ionicons name={opt.icon} size={20} color={sortBy === opt.id ? (c.appAccent ?? c.primary) : c.textMuted} />
                  <Text style={[styles.sortOptionLabel, { color: sortBy === opt.id ? c.appPrimary : c.textSecondary }]}>{opt.label}</Text>
                </View>
                {sortBy === opt.id && <View style={[styles.sortOptionDot, { backgroundColor: c.appAccent ?? c.primary }]} />}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.sortCloseBtn, { backgroundColor: c.appPrimary }]}
            onPress={() => setShowSortModal(false)}
          >
            <Text style={[styles.sortCloseBtnText, { color: c.onAppPrimary ?? c.onAccent }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Location picker modal */}
      <Modal visible={pickerMode !== null} animationType="slide" transparent>
        <View style={[selectorStyles.overlay, { backgroundColor: c.overlayModal }]}>
          <View style={[selectorStyles.sheet, { backgroundColor: c.popupSurface }]}>
            <View style={[selectorStyles.searchRow, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="search" size={20} color={c.textMuted} />
              <TextInput
                style={[selectorStyles.searchInput, { color: c.text }]}
                placeholder={pickerMode === 'from' ? 'Enter starting point' : 'Enter destination'}
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
                  <Ionicons name="location-outline" size={20} color={c.textMuted} />
                  <View style={selectorStyles.optionText}>
                    <Text style={[selectorStyles.optionPrimary, { color: c.text }]}>{getHotpointLabel(item)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[selectorStyles.closeButton, { backgroundColor: c.appPrimary }]}
              onPress={() => {
                setPickerMode(null);
                setPickerQuery('');
              }}
            >
              <Text style={[selectorStyles.closeButtonText, { color: c.onAppPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  roleToggleWrap: { marginBottom: spacing.sm },
  searchScrollContent: { paddingTop: listScreenHeaderPaddingVertical },
  searchBlock: { paddingTop: spacing.lg },
  inputCard: {
    borderRadius: radii.xl + 4,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  inputDot: {
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: radii.smMedium,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputDotInner: {
    width: sizes.timelineDot,
    height: sizes.timelineDot,
    borderRadius: radii.xxs,
  },
  inputLabel: {
    ...typography.bodyBold18,
    flex: 1,
  },
  swapBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 54,
    width: sizes.touchTarget.iconButton,
    height: sizes.touchTarget.iconButton,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  searchBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: buttonHeights.large,
  },
  searchBtnText: {
    ...typography.h3,
    fontWeight: '800',
  },
  pulseSection: { marginTop: spacing.xl },
  pulseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pulseSectionTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  pulseGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pulseCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  pulseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxs,
  },
  pulseCardTag: {
    ...typography.overline,
    fontWeight: '800',
  },
  pulseCardValue: {
    ...typography.bodyBold18,
  },
  pulseCardLabel: {
    ...typography.overline,
    fontWeight: '700',
    marginTop: spacing.xxs,
  },
  pulsePeopleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  pulseAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseAvatarRing: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 2,
    marginLeft: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsePeopleText: {
    ...typography.bodySmall,
    fontWeight: '700',
    flex: 1,
  },
  pulsePeopleBold: { fontWeight: '800' },
  shieldBannerWrap: { paddingTop: spacing.xl, paddingBottom: spacing.lg },
  shieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.panel,
    borderWidth: 1,
    gap: spacing.md,
  },
  shieldBannerText: {
    ...typography.bodySmall,
    fontWeight: '700',
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingTop: listScreenHeaderPaddingVertical,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  backBtnText: {
    ...typography.body,
    fontWeight: '800',
  },
  resultsInputRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  resultsFromToCard: {
    flex: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  resultsFromToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultsDivider: {
    height: 1,
    marginLeft: spacing.md + 8,
    marginVertical: spacing.xxs,
  },
  resultsFromToLabel: {
    ...typography.bodySmall,
    fontWeight: '800',
    flex: 1,
  },
  filterBtn: {
    width: sizes.touchTarget.iconButton,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsListContent: {
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  resultsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginBottom: spacing.lg,
  },
  resultsCount: {
    ...typography.bodySmall,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultsSortLabel: {
    ...typography.bodySmall,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tripCard: {
    borderRadius: radii.xl + 4,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  tripCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  tripTimeline: {
    flex: 1,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 8,
    bottom: 8,
    width: 2,
  },
  tripTimelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  timelineDot: {
    width: spacing.md,
    height: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 2,
  },
  timelineDotArrival: {},
  tripTime: typography.time,
  tripPlace: {
    ...typography.bodySmall,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tripPriceBlock: { alignItems: 'flex-end' },
  tripPrice: typography.totalPrice,
  tripInstant: {
    ...typography.overline,
    fontWeight: '700',
  },
  tripDivider: {
    height: 1,
    marginBottom: spacing.md,
  },
  tripDriverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tripDriverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  tripDriverAvatarWrap: { position: 'relative' },
  tripDriverAvatar: {
    width: sizes.avatar.lg,
    height: sizes.avatar.lg,
    borderRadius: radii.cardLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -spacing.xs,
    bottom: -spacing.xs,
    borderRadius: radii.sm,
    padding: spacing.xxs,
    borderWidth: 2,
  },
  tripDriverName: typography.driverNameLg,
  tripDriverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  tripDriverRatingText: typography.captionBold,
  tripDriverReviews: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  tripChevronWrap: {
    width: sizes.touchTarget.iconButton,
    height: sizes.touchTarget.iconButton,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResults: {
    paddingVertical: spacing.xxl + spacing.xl,
    alignItems: 'center',
    paddingHorizontal: landingHeaderPaddingHorizontal,
  },
  emptyResultsIcon: {
    width: 80,
    height: 80,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyResultsTitle: {
    ...typography.h2,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  emptyResultsSubtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  sortOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sortSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radii.xl + spacing.sm,
    borderTopRightRadius: radii.xl + spacing.sm,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  sortSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  sortSheetTitle: {
    ...typography.h2,
    fontWeight: '800',
  },
  sortSheetClose: {
    width: sizes.touchTarget.iconButton,
    height: sizes.touchTarget.iconButton,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortOptions: { gap: spacing.md },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
  },
  sortOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sortOptionLabel: {
    ...typography.body,
    fontWeight: '700',
  },
  sortOptionDot: {
    width: sizes.timelineDotLg,
    height: sizes.timelineDotLg,
    borderRadius: radii.xs,
  },
  sortCloseBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  sortCloseBtnText: {
    ...typography.body,
    fontWeight: '800',
  },
});
