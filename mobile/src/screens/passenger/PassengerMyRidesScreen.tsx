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
} from '../../services/mockApi';
import {
  EmptyState,
  Screen,
  Button,
  CarRefreshIndicator,
  ExpansionDetailsCard,
  ExpandActionButton,
} from '../../components';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';
import type { Booking } from '../../types';

export default function PassengerMyRidesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ratingsByBooking, setRatingsByBooking] = useState<Record<string, number>>({});
  const [ratingLoadingId, setRatingLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'done'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const loadBookings = React.useCallback(async () => {
    setLoadError(null);
    if (user) {
      try {
        const items = await getUserBookings(user.id);
        setBookings(items);
        const completed = items.filter((item) => item.status === 'completed');
        const ratings = await Promise.all(
          completed.map(async (item) => ({
            bookingId: item.id,
            rating: await getBookingRating(item.id),
          }))
        );
        const map: Record<string, number> = {};
        ratings.forEach((item) => {
          if (item.rating) {
            map[item.bookingId] = item.rating.score;
          }
        });
        setRatingsByBooking(map);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Could not load bookings.');
      }
    }
  }, [user]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useFocusEffect(
    React.useCallback(() => {
      setExpandedId(null);
      setTab('upcoming');
      if (user) {
        void loadBookings();
      }
    }, [loadBookings, user])
  );

  const list = bookings.filter((b) => b.status === tab);

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
    setRefreshing(true);
    setRefreshState('refreshing');
    await loadBookings();
    setRefreshState('done');
    setRefreshing(false);
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
            await loadBookings();
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
          <Button title="Retry" onPress={() => void loadBookings()} />
        </View>
      ) : null}
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
          style={[styles.tab, tab === 'ongoing' && styles.tabActive]}
          onPress={() => setTab('ongoing')}
        >
          <Text style={[styles.tabText, tab === 'ongoing' && styles.tabTextActive]}>
            Ongoing
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
                  {item.trip.departureHotpoint.name} → {item.trip.destinationHotpoint.name}
                </Text>
                <ExpandActionButton
                  expanded={expandedId === item.id}
                  onPress={() => toggleExpanded(item.id)}
                />
              </View>
              <Text style={styles.time}>{item.trip.departureTime}</Text>
              <Text style={styles.driver}>Driver: {item.trip.driver.name}</Text>
              <Text style={styles.seats}>{item.seats} seat(s) • {item.paymentMethod}</Text>
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
                      <Ionicons name="document-text-outline" size={14} color={colors.primary} />
                      <Text style={styles.actionText}>View full ticket</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => void onDownloadTicket(item.id)}
                    >
                      <Ionicons name="download-outline" size={14} color={colors.primary} />
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
                              color={colors.primary}
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
  container: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    paddingTop: spacing.lg,
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
  driver: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
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
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.primaryButtonBorder,
    backgroundColor: colors.primary,
  },
  actionText: {
    ...typography.caption,
    color: colors.onPrimary,
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
    paddingBottom: spacing.xl,
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
