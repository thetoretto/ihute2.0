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
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { RoleToggle, Button, RideCard, Screen, CarRefreshIndicator, Divider } from '../../components';
import { useResponsiveThemeContext } from '../../context/ResponsiveThemeContext';
import { useThemeColors } from '../../context/ThemeContext';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';
import { strings } from '../../constants/strings';
import { selectorStyles } from '../../utils/selectorStyles';
import { searchTrips, getHotpoints } from '../../services/mockApi';
import { getMockStore, updateMockStore } from '../../services/mockPersistence';
import type { Trip, TripType, Hotpoint } from '../../types';

export default function PassengerHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { currentRole, switchRole, hasApprovedVehicle } = useRole();
  const responsive = useResponsiveThemeContext();
  const c = useThemeColors();
  const effectiveSpacing = responsive?.spacing ?? spacing;
  const effectiveTypography = responsive?.typography ?? typography;
  const [tripType, setTripType] = React.useState<TripType>('insta');
  const [availableTrips, setAvailableTrips] = React.useState<Trip[]>([]);
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

  React.useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  React.useEffect(() => {
    void updateMockStore({
      passengerPrefs: { tripType },
    });
  }, [tripType]);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshState('refreshing');
    await loadTrips();
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

  return (
    <Screen
      scroll
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: effectiveSpacing.lg, paddingBottom: effectiveSpacing.xl }]}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[c.primary]}
            tintColor={c.primary}
            progressBackgroundColor={c.surface}
          />
        ),
        overScrollMode: 'always',
        bounces: false,
        alwaysBounceVertical: false,
        decelerationRate: 'fast',
      }}
    >
      <View style={[styles.header, { marginBottom: effectiveSpacing.lg }]}>
        <View>
          <Text style={[styles.greeting, effectiveTypography.h2, { color: c.text }]}>{strings.home.greeting(user?.name || strings.common.guest)}</Text>
          <Text style={[styles.tagline, effectiveTypography.bodySmall, { color: c.textSecondary }]}>
            {strings.home.tagline}
          </Text>
        </View>
      </View>
      {user?.roles.length && user.roles.length > 1 ? (
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

      <View style={[styles.searchCard, { backgroundColor: c.card, borderColor: c.border }]}>
        {/* Row 1: Departure + swap */}
        <TouchableOpacity
          style={[styles.cardRow, { borderBottomColor: c.borderLight }]}
          onPress={() => setPickerMode('from')}
          activeOpacity={0.8}
        >
          <Ionicons name="radio-button-on" size={20} color={c.textSecondary} />
          <Text style={[styles.cardRowLabel, { color: c.text }]} numberOfLines={1}>
            {from ? (from.country ? `${from.name}, ${from.country}` : from.name) : 'Departure'}
          </Text>
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={(e) => {
              e.stopPropagation();
              swapFromTo();
            }}
            style={styles.swapBtn}
          >
            <Ionicons name="swap-vertical" size={22} color={c.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
        {/* Row 2: Destination */}
        <TouchableOpacity
          style={[styles.cardRow, { borderBottomColor: c.borderLight }]}
          onPress={() => setPickerMode('to')}
          activeOpacity={0.8}
        >
          <Ionicons name="radio-button-on" size={20} color={c.textSecondary} />
          <Text style={[styles.cardRowLabel, { color: c.text }]} numberOfLines={1}>
            {to ? (to.country ? `${to.name}, ${to.country}` : to.name) : 'Destination'}
          </Text>
        </TouchableOpacity>
        {/* Row 3: Date (optional) */}
        <TouchableOpacity
          style={[styles.cardRow, styles.cardRowLast, { borderBottomColor: c.borderLight }]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={20} color={c.textSecondary} />
          <Text style={[styles.cardRowLabel, !searchDate && styles.cardRowLabelMuted, { color: searchDate ? c.text : c.textMuted }]} numberOfLines={1}>
            {formatSearchDate(searchDate) || 'Date (optional)'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={searchDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(_, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setSearchDate(selectedDate);
            }}
          />
        )}
        {searchValidation ? (
          <Text style={[styles.searchValidation, { color: c.error }]}>{searchValidation}</Text>
        ) : null}
        {/* Row 5: Search button (no separator below) */}
        <View style={styles.searchBtnWrap}>
          <Button title="Search" onPress={onSearch} style={styles.searchBtn} />
        </View>
      </View>

      <Divider />
      <Text style={[styles.sectionTitle, { color: c.text }]}>
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
          variant="compact"
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
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.lg },
  greeting: { ...typography.h2, color: colors.text },
  tagline: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  searchCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  cardRowLabel: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  swapBtn: {
    padding: spacing.xs,
  },
  cardRowLast: {
    borderBottomWidth: 0,
  },
  cardRowLabelMuted: {
    color: colors.textMuted,
  },
  searchValidation: {
    ...typography.caption,
    color: colors.error,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  searchBtnWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  searchBtn: {},
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
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
    borderColor: colors.primaryButtonBorder,
  },
  modeText: { ...typography.bodySmall, color: colors.textSecondary },
  modeTextActive: { color: colors.onPrimary, fontWeight: '600' },
  recentTitle: { marginTop: spacing.lg },
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
