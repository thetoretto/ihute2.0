import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  RefreshControl,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Screen, Button, CarRefreshIndicator } from '../../components';
import { buttonHeights, spacing, typography, radii, borderWidths, sizes, cardShadow } from '../../utils/theme';
import { landingHeaderPaddingHorizontal, listBottomPaddingTab } from '../../utils/layout';
import { useThemeColors } from '../../context/ThemeContext';
import { getStatusColorKey, getStatusTintKey } from '../../utils/theme';
import type { Booking } from '../../types';

/** Spec status labels for passenger My Travel: Booked, Scanned, Completed, Canceled. */
function getBookingStatusLabel(booking: Booking): string {
  if (booking.status === 'cancelled') return 'Canceled';
  if (booking.status === 'completed') return 'Completed';
  if (booking.scannedAt) return 'Scanned';
  return 'Booked';
}

function getBookingDisplayStatus(booking: Booking): 'completed' | 'cancelled' | 'scanned' | 'booked' {
  if (booking.status === 'cancelled') return 'cancelled';
  if (booking.status === 'completed') return 'completed';
  if (booking.scannedAt) return 'scanned';
  return 'booked';
}

function formatPastDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(t: string | undefined): string {
  if (!t) return '—';
  if (/^\d{1,2}:\d{2}$/.test(t)) return t;
  const idx = t.indexOf('T');
  if (idx !== -1) return t.slice(idx + 1, idx + 6);
  return t.slice(0, 5);
}

function formatCardDate(b: Booking, isHistory: boolean): string {
  const dateStr = b.trip.departureDate ?? b.createdAt;
  if (!dateStr) return '—';
  if (isHistory) return formatPastDate(dateStr);
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function getPaymentLabel(booking: Booking): string {
  return booking.paymentStatus === 'pending' ? 'Pending' : 'Paid';
}

type FilterTab = 'upcoming' | 'history';

export default function PassengerMyRidesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const c = useThemeColors();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'done'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('upcoming');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ratingsByBooking, setRatingsByBooking] = useState<Record<string, number>>({});
  const [ratingLoadingId, setRatingLoadingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return [];
    return getUserBookings(user.id);
  }, [user?.id]);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await fetchBookings();
      setBookings(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load bookings');
    }
  }, [fetchBookings]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
      void refresh();
    }, [refresh])
  );

  const filteredBookings =
    filter === 'upcoming'
      ? bookings.filter((b) => b.status === 'upcoming' || b.status === 'ongoing')
      : bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');

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
    if (!user) return;
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
    await refresh();
    setRefreshState('done');
    setRefreshing(false);
    setTimeout(() => setRefreshState('idle'), 240);
  };

  const onCancelBooking = async (booking: Booking) => {
    if (!user) return;
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

  const formatUpcomingTime = (b: Booking) => {
    const dateStr = b.trip.departureDate;
    const timeStr = b.trip.departureTime?.slice(0, 5) ?? '';
    if (!dateStr) return timeStr;
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    return isToday ? `Today, ${timeStr}` : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + (timeStr ? ` ${timeStr}` : '');
  };

  return (
    <Screen contentInset={false} style={[styles.container, { backgroundColor: c.appBackground }]}>
      {/* Sticky header: Your Rides + Upcoming | History tabs */}
      <View style={[styles.stickyHeader, { backgroundColor: c.card, borderBottomColor: c.borderLight, paddingTop: insets.top + spacing.md, paddingHorizontal: landingHeaderPaddingHorizontal }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>Your Rides</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity style={styles.tabWrap} onPress={() => setFilter('upcoming')}>
            <Text style={[styles.tabLabel, { color: filter === 'upcoming' ? c.primary : c.textMuted }]}>Upcoming</Text>
            {filter === 'upcoming' && <View style={[styles.tabIndicator, { backgroundColor: c.primary }]} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabWrap} onPress={() => setFilter('history')}>
            <Text style={[styles.tabLabel, { color: filter === 'history' ? c.primary : c.textMuted }]}>History</Text>
            {filter === 'history' && <View style={[styles.tabIndicator, { backgroundColor: c.primary }]} />}
          </TouchableOpacity>
        </View>
      </View>

      {loadError ? (
        <View style={[styles.errorBanner, { backgroundColor: c.surfaceElevated, borderColor: c.error, marginHorizontal: landingHeaderPaddingHorizontal, marginTop: spacing.md }]}>
          <Text style={[styles.errorText, { color: c.error }]}>{loadError}</Text>
          <Button title="Retry" onPress={() => void refresh()} />
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: listBottomPaddingTab }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[c.primary]}
            tintColor={c.primary}
            progressBackgroundColor={c.background}
          />
        }
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconCircle, { backgroundColor: c.surface }]}>
              <Ionicons name="time-outline" size={32} color={c.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No rides yet</Text>
            <Text style={[styles.emptySubtitle, { color: c.textMuted }]}>
              Your {filter === 'upcoming' ? 'Upcoming' : 'History'} trips will appear here.
            </Text>
          </View>
        ) : (
          <View style={[styles.cardList, { paddingHorizontal: landingHeaderPaddingHorizontal, paddingTop: spacing.md }]}>
            {filteredBookings.map((item) => (
              <TripCard
                key={item.id}
                booking={item}
                isExpanded={expandedId === item.id}
                onToggleExpand={() => toggleExpanded(item.id)}
                onViewTicket={() => navigation.navigate('TicketDetail', { bookingId: item.id })}
                onCancel={() => onCancelBooking(item)}
                onRateDriver={(score) => onRateDriver(item, score)}
                rating={ratingsByBooking[item.id]}
                ratingLoading={ratingLoadingId === item.id}
                isHistory={filter === 'history'}
                colors={c}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <CarRefreshIndicator state={refreshState} />
    </Screen>
  );
}

function TripCard({
  booking,
  isExpanded,
  onToggleExpand,
  onViewTicket,
  onCancel,
  onRateDriver,
  rating,
  ratingLoading,
  isHistory,
  colors: c,
}: {
  booking: Booking;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewTicket: () => void;
  onCancel: () => void;
  onRateDriver: (score: number) => void;
  rating: number | undefined;
  ratingLoading: boolean;
  isHistory: boolean;
  colors: Record<string, string>;
}) {
  const total = booking.seats * booking.trip.pricePerSeat;
  const depTime = formatTime(booking.trip.departureTime);
  const arrTime = formatTime(booking.trip.arrivalTime);
  const fromName = booking.trip.departureHotpoint.name;
  const toName = booking.trip.destinationHotpoint.name;
  const dateLabel = formatCardDate(booking, isHistory);
  const refLabel = booking.ticketNumber ?? booking.id.slice(0, 8).toUpperCase();
  const displayStatus = getBookingDisplayStatus(booking);
  const isCompleted = booking.status === 'completed';

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: isExpanded ? c.primary : c.borderLight }, cardShadow]}>
      <TouchableOpacity style={styles.cardMain} onPress={onToggleExpand} activeOpacity={0.9}>
        <View style={styles.cardTopRow}>
          <View style={[styles.statusPill, { backgroundColor: (c[getStatusTintKey(getStatusColorKey(displayStatus))] as string) }]}>
            <Text style={[styles.statusPillText, { color: c[getStatusColorKey(displayStatus)] as string }]}>{getBookingStatusLabel(booking)}</Text>
          </View>
          <View style={[styles.paymentPill, { backgroundColor: c.primaryTint }]}>
            <Ionicons name="checkmark-circle" size={12} color={c.primary} />
            <Text style={[styles.paymentPillText, { color: c.primary }]}>{getPaymentLabel(booking)}</Text>
          </View>
        </View>
        <View style={styles.cardTimesRow}>
          <View style={styles.timesCol}>
            <Text style={[styles.timeText, { color: c.text }]}>{depTime}</Text>
            <View style={[styles.timeLine, { backgroundColor: c.borderLight }]} />
            <Text style={[styles.timeText, { color: c.text }]}>{arrTime}</Text>
          </View>
          <View style={styles.placesCol}>
            <View>
              <Text style={[styles.placeText, { color: c.text }]} numberOfLines={1}>{fromName}</Text>
              <Text style={[styles.dateSubtext, { color: c.textMuted }]}>{dateLabel}</Text>
            </View>
            <Text style={[styles.placeText, { color: c.text }]} numberOfLines={1}>{toName}</Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={[styles.priceText, { color: c.text }]}>{Number(total).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</Text>
            <Text style={[styles.refText, { color: c.textMuted }]}>Ref: {refLabel}</Text>
          </View>
        </View>
        <View style={[styles.driverRow, { borderTopColor: c.borderLight }]}>
          {booking.trip.driver.avatarUri ? (
            <Image source={{ uri: booking.trip.driver.avatarUri }} style={styles.driverAvatar} />
          ) : (
            <View style={[styles.driverAvatar, { backgroundColor: c.primaryTint }]}>
              <Ionicons name="person" size={20} color={c.primary} />
            </View>
          )}
          <View style={styles.driverInfo}>
            <Text style={[styles.driverName, { color: c.text }]} numberOfLines={1}>{booking.trip.driver.name}</Text>
            <Text style={[styles.driverCar, { color: c.textMuted }]} numberOfLines={1}>
              {booking.trip.vehicle ? `${booking.trip.vehicle.make} ${booking.trip.vehicle.model}` : '—'}
            </Text>
          </View>
          {!isCompleted && (
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: c.primaryTint }]} onPress={() => {}}>
              <Text style={[styles.contactBtnText, { color: c.primary }]}>Contact</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onToggleExpand} style={styles.chevronWrap}>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.expanded, { backgroundColor: c.surface ?? c.ghostBg }]}>
          <View style={styles.ridePathSection}>
            <View style={styles.ridePathLabelRow}>
              <Ionicons name="navigate" size={12} color={c.textMuted} />
              <Text style={[styles.ridePathLabel, { color: c.textMuted }]}>Ride Path</Text>
            </View>
            <View style={styles.ridePathRow}>
              <View style={styles.ridePathTrack}>
                <View style={[styles.ridePathDot, { borderColor: c.primary, backgroundColor: c.card }]} />
                <View style={[styles.ridePathDashed, { borderColor: c.borderLight }]} />
                <View style={[styles.ridePathDot, { borderColor: c.primary, backgroundColor: c.card }]} />
              </View>
              <View style={styles.ridePathLabels}>
                <Text style={[styles.ridePathPlace, { color: c.text }]}>{fromName}</Text>
                <Text style={[styles.ridePathPlace, { color: c.text }]}>{toName}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.bookingDetailsCard, { backgroundColor: c.card, borderColor: c.borderLight }]}>
            <View style={styles.bookingDetailRow}>
              <View style={styles.bookingDetailLabelRow}>
                <Ionicons name="receipt-outline" size={14} color={c.textMuted} />
                <Text style={[styles.bookingDetailLabel, { color: c.textMuted }]}>Total Paid</Text>
              </View>
              <Text style={[styles.bookingDetailValue, { color: c.text }]}>{Number(total).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</Text>
            </View>
            <View style={[styles.bookingDetailRow, { marginBottom: 0 }]}>
              <View style={styles.bookingDetailLabelRow}>
                <Ionicons name="person-outline" size={14} color={c.textMuted} />
                <Text style={[styles.bookingDetailLabel, { color: c.textMuted }]}>Passenger</Text>
              </View>
              <Text style={[styles.bookingDetailValue, { color: c.text }]}>You ({booking.seats} seat{booking.seats > 1 ? 's' : ''})</Text>
            </View>
          </View>
          {!isCompleted && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: c.primary }]} onPress={onViewTicket}>
                <Text style={[styles.primaryActionText, { color: c.onPrimary ?? c.text }]}>View Ticket</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: c.borderLight, backgroundColor: c.card }]} onPress={onCancel}>
                <Text style={[styles.cancelBtnText, { color: c.error }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          {isCompleted && (
            <View style={[styles.ratingSection, { backgroundColor: c.surface }]}>
              <Text style={[styles.ratingLabel, { color: c.textMuted }]}>Rate this driver</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <TouchableOpacity
                    key={score}
                    onPress={() => onRateDriver(score)}
                    disabled={ratingLoading || rating != null}
                    style={styles.starBtn}
                  >
                    <Ionicons name={score <= (rating ?? 0) ? 'star' : 'star-outline'} size={22} color={c.primary} />
                  </TouchableOpacity>
                ))}
              </View>
              {rating != null && <Text style={[styles.ratingThanks, { color: c.textMuted }]}>Thanks, you already submitted a rating.</Text>}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeader: {
    borderBottomWidth: 1,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tabWrap: {
    paddingBottom: spacing.sm,
    position: 'relative',
  },
  tabLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  errorBanner: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    gap: spacing.sm,
  },
  errorText: { ...typography.body },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.body, fontWeight: '700', fontSize: 16 },
  emptySubtitle: { ...typography.bodySmall, marginTop: spacing.xs, textAlign: 'center' },
  cardList: { gap: spacing.md, paddingBottom: spacing.md },
  card: {
    borderRadius: radii.xl,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardMain: { padding: spacing.md },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  statusPillText: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  paymentPillText: { ...typography.overline, fontSize: 10, fontWeight: '700' },
  cardTimesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  timesCol: {
    alignItems: 'center',
  },
  timeText: { ...typography.body, fontWeight: '800', fontSize: 18 },
  timeLine: {
    width: 2,
    height: 24,
    marginVertical: spacing.xs,
  },
  placesCol: { flex: 1, minWidth: 0, justifyContent: 'space-between' },
  placeText: { ...typography.body, fontWeight: '600' },
  dateSubtext: { ...typography.overline, fontSize: 10, marginTop: 2 },
  priceCol: { alignItems: 'flex-end' },
  priceText: { ...typography.body, fontWeight: '800', fontSize: 18 },
  refText: { ...typography.overline, fontSize: 10, marginTop: 2 },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: { flex: 1, minWidth: 0 },
  driverName: { ...typography.bodySmall, fontWeight: '700' },
  driverCar: { ...typography.bodySmall, fontSize: 12, marginTop: 2 },
  contactBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  contactBtnText: { ...typography.bodySmall, fontWeight: '700' },
  chevronWrap: { padding: spacing.xs },
  expanded: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  ridePathSection: { marginBottom: spacing.lg },
  ridePathLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  ridePathLabel: {
    ...typography.overline,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ridePathRow: { flexDirection: 'row', alignItems: 'flex-start' },
  ridePathTrack: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  ridePathDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  ridePathDashed: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 2,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
  ridePathLabels: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 0,
    minHeight: 44,
  },
  ridePathPlace: { ...typography.bodySmall, fontWeight: '700' },
  bookingDetailsCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bookingDetailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bookingDetailLabel: { ...typography.bodySmall },
  bookingDetailValue: { ...typography.bodySmall, fontWeight: '700' },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryActionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: { ...typography.body, fontWeight: '700' },
  cancelBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { ...typography.bodySmall, fontWeight: '700' },
  ratingSection: {
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  ratingLabel: { ...typography.bodySmall, fontWeight: '700', marginBottom: spacing.sm },
  starRow: { flexDirection: 'row', gap: spacing.sm },
  starBtn: { padding: spacing.xs },
  ratingThanks: { ...typography.bodySmall, marginTop: spacing.sm },
});
