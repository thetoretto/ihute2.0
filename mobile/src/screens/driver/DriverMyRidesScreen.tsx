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
import { getDriverTripActivities, updateDriverTripStatus } from '../../services/mockApi';
import {
  EmptyState,
  Screen,
  Button,
  CarRefreshIndicator,
  ExpansionDetailsCard,
  ExpandActionButton,
} from '../../components';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';
import type { DriverTripActivity } from '../../types';

export default function DriverMyRidesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { agencySubRole } = useRole();
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
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Button title="Retry" onPress={() => void loadTrips()} />
        </View>
      ) : null}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('DriverScanTicket')}
        >
          <Text style={styles.actionBtnText}>Scan ticket</Text>
        </TouchableOpacity>
        {!isScanner ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onToggleIncome}>
            <Text style={styles.actionBtnText}>
              {isIncomeVisible ? 'Hide income' : 'View income'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'completed' && styles.tabActive]}
          onPress={() => setTab('completed')}
        >
          <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>
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
              colors={[colors.primary]}
              tintColor={colors.primary}
              progressBackgroundColor={colors.surface}
            />
          }
          overScrollMode="always"
          bounces={false}
          alwaysBounceVertical={false}
          decelerationRate="fast"
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.route}>
                  {item.trip.departureHotpoint?.name} → {item.trip.destinationHotpoint?.name}
                </Text>
                <ExpandActionButton
                  expanded={expandedTripId === item.trip.id}
                  onPress={() => toggleExpanded(item.trip.id)}
                />
              </View>
              <Text style={styles.time}>{item.trip.departureTime}</Text>
              <Text style={styles.price}>
                Collected {maskIncome(item.collectedAmount)} • Booked {item.bookedSeats}
              </Text>
              <Text style={styles.price}>Remaining seats {item.remainingSeats}</Text>
              {!isScanner ? (
                <View style={styles.statusActionRow}>
                  {item.trip.status === 'active' ? (
                    <TouchableOpacity
                      style={styles.statusActionBtn}
                      onPress={() => void onSetTripStatus(item.trip.id, 'completed')}
                    >
                      <Text style={styles.statusActionText}>Mark completed</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.statusActionBtn}
                      onPress={() => void onSetTripStatus(item.trip.id, 'active')}
                    >
                      <Text style={styles.statusActionText}>Mark active</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
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
    borderColor: colors.borderLight,
    borderRadius: radii.button,
    minHeight: buttonHeights.small,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  actionBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.body, color: colors.textSecondary },
  tabTextActive: { color: colors.onPrimary, fontWeight: '600' },
  card: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  route: { ...typography.h3, color: colors.text, flex: 1 },
  time: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  price: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  statusActionRow: { marginTop: spacing.sm, alignItems: 'flex-start' },
  statusActionBtn: {
    borderWidth: 1,
    borderColor: colors.primaryButtonBorder,
    borderRadius: radii.button,
    minHeight: buttonHeights.small,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  statusActionText: { ...typography.caption, color: colors.onPrimary, fontWeight: '600' },
  listContent: { paddingBottom: spacing.xl },
  errorBanner: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.error,
    gap: spacing.sm,
  },
  errorText: { ...typography.body, color: colors.error },
});
