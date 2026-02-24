import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { getDriverTripActivities, updateDriverTripStatus } from '../../services/api';
import {
  EmptyState,
  Screen,
  Button,
  CarRefreshIndicator,
  ExpansionDetailsCard,
  ExpandActionButton,
} from '../../components';
import { buttonHeights, colors, spacing, typography, radii, cardShadow } from '../../utils/theme';
import { useThemeColors } from '../../context/ThemeContext';
import type { DriverTripActivity } from '../../types';

const CARD_RADIUS = 24;

export default function DriverMyRidesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { agencySubRole } = useRole();
  const c = useThemeColors();
  const isScanner = user?.agencySubRole === 'agency_scanner' || agencySubRole === 'agency_scanner';
  const [activities, setActivities] = useState<DriverTripActivity[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [isIncomeVisible, setIsIncomeVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'done'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const incomeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    return () => {
      if (incomeTimerRef.current) {
        clearTimeout(incomeTimerRef.current);
      }
    };
  }, []);

  const loadTrips = React.useCallback(async () => {
    setLoadError(null);
    if (user) {
      try {
        const items = await getDriverTripActivities(user.id);
        setActivities(items);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Could not load activities.');
      }
    }
  }, [user]);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  useFocusEffect(
    React.useCallback(() => {
      setExpandedTripId(null);
      setTab('upcoming');
      void loadTrips();
    }, [loadTrips])
  );

  const list = activities.filter((a) =>
    tab === 'upcoming' ? a.trip.status === 'active' : a.trip.status === 'completed'
  );

  const toggleExpanded = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setExpandedTripId((prev) => (prev === id ? null : id));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshState('refreshing');
    await loadTrips();
    setRefreshState('done');
    setRefreshing(false);
    setTimeout(() => setRefreshState('idle'), 240);
  };

  const maskIncome = (value: number, suffix = 'RWF') =>
    isIncomeVisible ? `${Number(value).toLocaleString('en-RW', { maximumFractionDigits: 0 })} ${suffix}` : '••••••';

  const onToggleIncome = () => {
    if (isIncomeVisible) {
      setIsIncomeVisible(false);
      if (incomeTimerRef.current) {
        clearTimeout(incomeTimerRef.current);
      }
      return;
    }
    Alert.alert('View income', 'Reveal income values for 12 seconds?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'View income',
        onPress: () => {
          setIsIncomeVisible(true);
          if (incomeTimerRef.current) {
            clearTimeout(incomeTimerRef.current);
          }
          incomeTimerRef.current = setTimeout(() => setIsIncomeVisible(false), 12000);
        },
      },
    ]);
  };

  const onSetTripStatus = async (tripId: string, status: 'active' | 'completed') => {
    if (!user) {
      return;
    }
    try {
      await updateDriverTripStatus({ tripId, driverId: user.id, status });
      await loadTrips();
    } catch (e) {
      Alert.alert('Status update failed', e instanceof Error ? e.message : 'Could not update trip status.');
    }
  };

  return (
    <Screen style={styles.container}>
      {loadError ? (
        <View style={[styles.errorBanner, { backgroundColor: c.surfaceElevated, borderColor: c.error }]}>
          <Text style={[styles.errorText, { color: c.error }]}>{loadError}</Text>
          <Button title="Retry" onPress={() => void loadTrips()} />
        </View>
      ) : null}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: c.primary, borderColor: c.primaryButtonBorder }]}
          onPress={() => navigation.navigate('DriverScanTicket')}
        >
          <Text style={[styles.actionBtnText, { color: c.onPrimary }]}>Scan ticket</Text>
        </TouchableOpacity>
        {!isScanner ? (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.surface, borderColor: c.border }]} onPress={onToggleIncome}>
            <Text style={[styles.actionBtnText, { color: c.primary }]}>
              {isIncomeVisible ? 'Hide income' : 'View income'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'upcoming' && { backgroundColor: c.primary }]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, { color: c.textSecondary }, tab === 'upcoming' && { color: c.onPrimary, fontWeight: '600' }]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'completed' && { backgroundColor: c.primary }]}
          onPress={() => setTab('completed')}
        >
          <Text style={[styles.tabText, { color: c.textSecondary }, tab === 'completed' && { color: c.onPrimary, fontWeight: '600' }]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>
      {list.length === 0 ? (
        <EmptyState
          title={tab === 'upcoming' ? 'No upcoming rides' : 'No completed rides'}
          subtitle="Publish a ride to get started."
        />
      ) : (
        <FlatList
          key={tab}
          data={list}
          keyExtractor={(item) => item.trip.id}
          contentContainerStyle={styles.listContent}
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
          bounces={false}
          alwaysBounceVertical={false}
          decelerationRate="fast"
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}>
              <View style={styles.routeRow}>
                <View style={styles.routeCol}>
                  <View style={[styles.routeLine, { backgroundColor: c.border }]} />
                  <View style={styles.routeItem}>
                    <View style={[styles.routeDot, { borderColor: c.primary }]} />
                    <View style={styles.routeTextWrap}>
                      <Text style={[styles.routeLabel, { color: c.textSecondary }]}>From</Text>
                      <Text style={[styles.routeValue, { color: c.text }]} numberOfLines={1}>
                        {item.trip.departureHotpoint?.name ?? '—'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.routeItem}>
                    <View style={[styles.routeDot, { borderColor: c.primary }]} />
                    <View style={styles.routeTextWrap}>
                      <Text style={[styles.routeLabel, { color: c.textSecondary }]}>To</Text>
                      <Text style={[styles.routeValue, { color: c.text }]} numberOfLines={1}>
                        {item.trip.destinationHotpoint?.name ?? '—'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={[styles.cardPrice, { color: c.text }]}>{maskIncome(item.collectedAmount)}</Text>
                  <Text style={[styles.cardTime, { color: c.textSecondary }]}>{item.trip.departureTime}</Text>
                  <ExpandActionButton
                    expanded={expandedTripId === item.trip.id}
                    onPress={() => toggleExpanded(item.trip.id)}
                  />
                </View>
              </View>
              <View style={[styles.cardDivider, { backgroundColor: c.border }]} />
              <View style={styles.cardFooter}>
                <Text style={[styles.cardFooterText, { color: c.textSecondary }]}>
                  Booked {item.bookedSeats} • Remaining {item.remainingSeats}
                </Text>
                {!isScanner ? (
                  <TouchableOpacity
                    style={[styles.statusActionBtn, { backgroundColor: c.primary }]}
                    onPress={() => void onSetTripStatus(item.trip.id, item.trip.status === 'active' ? 'completed' : 'active')}
                  >
                    <Text style={[styles.statusActionText, { color: c.onPrimary }]}>
                      {item.trip.status === 'active' ? 'Mark completed' : 'Mark active'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {expandedTripId === item.trip.id ? (
                <ExpansionDetailsCard
                  tone="driver"
                  title="Trip analytics"
                  rows={[
                    { icon: 'calendar', label: 'Departure', value: item.trip.departureTime },
                    {
                      icon: 'swap-horizontal',
                      label: 'Trip type',
                      value: item.trip.type === 'insta' ? 'Instant' : 'Scheduled',
                    },
                    {
                      icon: 'flag',
                      label: 'Status',
                      value: item.trip.status.toUpperCase(),
                    },
                    {
                      icon: 'cash',
                      label: 'Collected',
                      value: isIncomeVisible ? `${Number(item.collectedAmount).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF` : 'HIDDEN',
                    },
                  ]}
                />
              ) : null}
            </View>
          )}
        />
      )}
      <CarRefreshIndicator state={refreshState} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: buttonHeights.small,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  actionBtnText: { ...typography.caption, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
  },
  tabText: { ...typography.body },
  card: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  routeCol: { flex: 1, position: 'relative' },
  routeLine: {
    position: 'absolute',
    left: 7,
    top: 10,
    bottom: 10,
    width: 2,
  },
  routeItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, zIndex: 1 },
  routeDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.background, borderWidth: 4 },
  routeTextWrap: { flex: 1 },
  routeLabel: { ...typography.caption },
  routeValue: { ...typography.bodySmall, fontWeight: '600' },
  cardMeta: { alignItems: 'flex-end' },
  cardPrice: { ...typography.h3 },
  cardTime: { ...typography.caption },
  cardDivider: { height: 1, marginVertical: spacing.md },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  cardFooterText: { ...typography.caption },
  statusActionBtn: {
    borderRadius: 12,
    minHeight: buttonHeights.small,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  statusActionText: { ...typography.caption, fontWeight: '600' },
  listContent: { paddingBottom: spacing.xl },
  errorBanner: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
  },
  errorText: { ...typography.body },
});
