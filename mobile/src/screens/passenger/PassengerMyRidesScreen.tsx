import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import {
  getBookingRating,
  shareTicketPdf,
  getUserBookings,
  rateDriverFromBooking,
  cancelBooking,
} from '../../services/api';
import {
  EmptyState,
  Screen,
  Button,
  CarRefreshIndicator,
  ExpansionDetailsCard,
  ExpandActionButton,
} from '../../components';
import { useTabbedList } from '../../hooks/useTabbedList';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';
import { listBottomPaddingTab, cardRadius } from '../../utils/layout';
import { useResponsiveTheme } from '../../utils/responsiveTheme';
import { useThemeColors } from '../../context/ThemeContext';
import type { Booking } from '../../types';

const TABS = [
  { key: 'upcoming' as const, label: 'Upcoming' },
  { key: 'ongoing' as const, label: 'Ongoing' },
  { key: 'completed' as const, label: 'Completed' },
];

export default function PassengerMyRidesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const c = useThemeColors();
  const responsiveTheme = useResponsiveTheme();
  const rs = responsiveTheme.spacing;
  const rTypography = responsiveTheme.typography;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ratingsByBooking, setRatingsByBooking] = useState<Record<string, number>>({});
  const [ratingLoadingId, setRatingLoadingId] = useState<string | null>(null);
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'done'>('idle');

  const fetchBookings = useCallback(async () => {
    if (!user) return [];
    return getUserBookings(user.id);
  }, [user?.id]);

  const tabbed = useTabbedList({
    tabs: TABS,
    initialTab: 'upcoming',
    fetchData: fetchBookings,
    filterByTab: (b, t) => b.status === t,
    deps: [user?.id],
  });

  const { tab, setTab, list, data: bookings, error: loadError, refreshing, refresh, setError } = tabbed;

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    const completed = bookings.filter((b) => b.status === 'completed');
    if (completed.length === 0) return;
    let cancelled = false;
    Promise.all(
      completed.map(async (item) => ({
        bookingId: item.id,
        rating: await getBookingRating(item.id),
      }))
    ).then((ratings) => {
      if (cancelled) return;
      const map: Record<string, number> = {};
      ratings.forEach((item) => {
        if (item.rating) {
          map[item.bookingId] = item.rating.score;
        }
      });
      setRatingsByBooking(map);
    });
    return () => {
      cancelled = true;
    };
  }, [bookings]);

  useFocusEffect(
    useCallback(() => {
      setExpandedId(null);
      setTab('upcoming');
      void refresh();
    }, [setTab, refresh])
  );

  const toggleExpanded = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const onDownloadTicket = async (bookingId: string) => {
    try {
      await shareTicketPdf(bookingId);
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : 'Could not generate ticket.');
    }
  };

  const onRateDriver = async (booking: Booking, score: number) => {
    if (!user) {
      return;
    }
    try {
      setRatingLoadingId(booking.id);
      await rateDriverFromBooking({
        bookingId: booking.id,
        passengerId: user.id,
        score,
      });
      setRatingsByBooking((prev) => ({ ...prev, [booking.id]: score }));
    } catch (e) {
      Alert.alert('Rating failed', e instanceof Error ? e.message : 'Could not submit rating.');
    } finally {
      setRatingLoadingId(null);
    }
  };

  const onRefresh = async () => {
    setRefreshState('refreshing');
    await refresh();
    setRefreshState('done');
    setTimeout(() => setRefreshState('idle'), 240);
  };

  const onCancelBooking = async (booking: Booking) => {
    if (!user) {
      return;
    }
    Alert.alert(
      'Cancel booking',
      'Do you want to cancel this upcoming booking? Cancellations are free until 2 hours before departure. Refunds (if any) follow our refund policy.',
      [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(booking.id, user.id);
            await refresh();
          } catch (e) {
            Alert.alert('Cancellation failed', e instanceof Error ? e.message : 'Could not cancel booking.');
          }
        },
      },
      ]
    );
  };

  return (
    <Screen style={styles.container}>
      {loadError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Button title="Retry" onPress={() => void refresh()} />
        </View>
      ) : null}
      <View style={[styles.tabs, { paddingTop: rs.lg, paddingHorizontal: rs.lg, gap: rs.sm, marginBottom: rs.sm }]}>
        <TouchableOpacity
          style={[styles.tab, { paddingVertical: rs.sm + 2, paddingHorizontal: rs.sm }, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, rTypography.bodySmall, tab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { paddingVertical: rs.sm + 2, paddingHorizontal: rs.sm }, tab === 'ongoing' && styles.tabActive]}
          onPress={() => setTab('ongoing')}
        >
          <Text style={[styles.tabText, rTypography.bodySmall, tab === 'ongoing' && styles.tabTextActive]}>
            Ongoing
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { paddingVertical: rs.sm + 2, paddingHorizontal: rs.sm }, tab === 'completed' && styles.tabActive]}
          onPress={() => setTab('completed')}
        >
          <Text style={[styles.tabText, rTypography.bodySmall, tab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>
      {list.length === 0 ? (
        <EmptyState
          title={`No ${tab} rides`}
          subtitle="Book a ride to get started."
        />
      ) : (
        <FlatList
          key={tab}
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              colors={[c.primary]}
              tintColor={c.primary}
              progressBackgroundColor={c.background}
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
                <View style={styles.routeBlock}>
                  <Text style={styles.badge}>
                    {item.status === 'upcoming' ? 'Confirmed' : item.status === 'ongoing' ? 'Ongoing' : 'Completed'}
                  </Text>
                  <Text style={styles.route}>
                    {item.trip.departureHotpoint.name} → {item.trip.destinationHotpoint.name}
                  </Text>
                  <Text style={styles.time}>{item.trip.departureTime} • with {item.trip.driver.name}</Text>
                </View>
                <ExpandActionButton
                  expanded={expandedId === item.id}
                  onPress={() => toggleExpanded(item.id)}
                />
              </View>
              <Text style={styles.seats}>{item.seats} seat(s) • {item.paymentMethod.replace('_', ' ')}</Text>
              {expandedId === item.id ? (
                <>
                  <ExpansionDetailsCard
                    tone="passenger"
                    title="Trip details"
                    rows={[
                      { icon: 'flag', label: 'Status', value: item.status.toUpperCase() },
                      {
                        icon: 'swap-horizontal',
                        label: 'Trip type',
                        value: item.trip.type === 'insta' ? 'Instant' : 'Scheduled',
                      },
                      {
                        icon: 'card',
                        label: 'Payment',
                        value: item.paymentMethod.replace('_', ' '),
                      },
                      {
                        icon: 'cash',
                        label: 'Seat price',
                        value: `${Number(item.trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF`,
                      },
                      {
                        icon: 'ticket',
                        label: 'Ticket',
                        value: item.ticketNumber ?? 'Generated on booking',
                      },
                    ]}
                  />
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => navigation.navigate('TicketDetail', { bookingId: item.id })}
                    >
                      <Ionicons name="document-text-outline" size={14} color={c.primary} />
                      <Text style={styles.actionText}>View full ticket</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => void onDownloadTicket(item.id)}
                    >
                      <Ionicons name="download-outline" size={14} color={c.primary} />
                      <Text style={styles.actionText}>Download PDF</Text>
                    </TouchableOpacity>
                    {item.status === 'upcoming' ? (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => void onCancelBooking(item)}
                      >
                        <Ionicons name="close-circle-outline" size={14} color={colors.error} />
                        <Text style={styles.actionDangerText}>Cancel booking</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {item.status === 'completed' ? (
                    <View style={styles.ratingCard}>
                      <Text style={styles.ratingTitle}>Rate this driver</Text>
                      <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((score) => (
                          <TouchableOpacity
                            key={`${item.id}-rating-${score}`}
                            onPress={() => void onRateDriver(item, score)}
                            disabled={ratingLoadingId === item.id || ratingsByBooking[item.id] != null}
                            style={styles.starBtn}
                          >
                            <Ionicons
                              name={
                                score <= (ratingsByBooking[item.id] ?? 0)
                                  ? 'star'
                                  : 'star-outline'
                              }
                              size={18}
                              color={c.primary}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      {ratingsByBooking[item.id] != null ? (
                        <Text style={styles.ratingLocked}>Thanks, you already submitted a rating.</Text>
                      ) : null}
                    </View>
                  ) : null}
                </>
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
  container: { flex: 1, backgroundColor: colors.surface },
  tabs: {
    flexDirection: 'row',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { ...typography.bodySmall, color: colors.dark, fontWeight: '600' },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  routeBlock: { flex: 1, minWidth: 0 },
  badge: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.success,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  route: { ...typography.body, color: colors.dark, fontWeight: '700' },
  time: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  seats: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: buttonHeights.small,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  actionText: {
    ...typography.caption,
    color: colors.dark,
    fontWeight: '600',
  },
  actionDangerText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  ratingCard: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  ratingTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  starBtn: {
    padding: spacing.xs,
  },
  ratingLocked: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  listContent: {
    paddingBottom: listBottomPaddingTab,
    paddingHorizontal: 0,
  },
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
