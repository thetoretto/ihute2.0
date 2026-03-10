import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  Screen,
  Button,
  CarRefreshIndicator,
  ExpansionDetailsCard,
  ExpandActionButton,
  LandingHeader,
} from '../../components';
import { buttonHeights, spacing, typography, radii, borderWidths, sizes } from '../../utils/theme';
import { landingHeaderPaddingHorizontal, listBottomPaddingTab, listScreenHeaderPaddingVertical, tightGap } from '../../utils/layout';
import { sharedStyles } from '../../utils/sharedStyles';
import { useThemeColors } from '../../context/ThemeContext';
import type { Booking } from '../../types';

function routeCode(name: string) {
  if (name.length >= 3) return name.slice(0, 3).toUpperCase();
  return name.toUpperCase();
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

export default function PassengerMyRidesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const c = useThemeColors();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'done'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const upcoming = bookings.filter((b) => b.status === 'upcoming');
  const completed = bookings.filter((b) => b.status === 'completed');
  const firstUpcoming = upcoming[0] ?? null;

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
    <Screen
      style={[styles.container, { backgroundColor: c.appBackground }]}
      scroll
      contentContainerStyle={[styles.scrollContent, { paddingBottom: listBottomPaddingTab }]}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[c.primary]}
            tintColor={c.primary}
            progressBackgroundColor={c.background}
          />
        ),
      }}
    >
      {loadError ? (
        <View style={[styles.errorBanner, { backgroundColor: c.surfaceElevated, borderColor: c.error }]}>
          <Text style={[styles.errorText, { color: c.error }]}>{loadError}</Text>
          <Button title="Retry" onPress={() => void refresh()} />
        </View>
      ) : null}

      <LandingHeader title="My Travels" subtitle="Tracking your city hops" />

      {/* Upcoming: one prominent card */}
      <View style={[styles.section, { paddingHorizontal: landingHeaderPaddingHorizontal }]}>
        <Text style={[styles.sectionOverline, { color: c.textMuted }]}>Upcoming</Text>
        {firstUpcoming ? (
          <TouchableOpacity
            style={[styles.upcomingCard, { backgroundColor: c.primary, shadowColor: c.cardShadowColor }]}
            onPress={() => navigation.navigate('TicketDetail', { bookingId: firstUpcoming.id })}
            activeOpacity={0.9}
          >
            <View style={styles.upcomingCardTop}>
              <View style={[styles.confirmedBadge, { backgroundColor: c.onAppPrimarySoft }]}>
                <Text style={[styles.confirmedBadgeText, { color: c.onPrimary ?? c.text }]}>Confirmed</Text>
              </View>
              <Text style={[styles.upcomingTime, { color: c.onPrimary ?? c.text }]}>{formatUpcomingTime(firstUpcoming)}</Text>
            </View>
            <View style={styles.upcomingRouteRow}>
              <View style={styles.routeBlock}>
                <Text style={[styles.routeCode, { color: c.onPrimary ?? c.text }]}>{routeCode(firstUpcoming.trip.departureHotpoint.name)}</Text>
                <Text style={[styles.routeCity, { color: c.onPrimary ?? c.text }]}>{firstUpcoming.trip.departureHotpoint.name}</Text>
              </View>
              <View style={styles.routeDots}>
                <View style={[styles.routeDot, { backgroundColor: c.onPrimary ?? c.text }]} />
                <View style={[styles.routeLine, { borderColor: c.onAppPrimaryMuted }]} />
                <Ionicons name="arrow-forward" size={16} color={c.onPrimary ?? c.text} />
                <View style={[styles.routeLine, { borderColor: c.onAppPrimaryMuted }]} />
                <View style={[styles.routeDot, { backgroundColor: c.onAppPrimaryMuted }]} />
              </View>
              <View style={styles.routeBlock}>
                <Text style={[styles.routeCode, { color: c.onPrimary ?? c.text }]}>{routeCode(firstUpcoming.trip.destinationHotpoint.name)}</Text>
                <Text style={[styles.routeCity, { color: c.onPrimary ?? c.text }]}>{firstUpcoming.trip.destinationHotpoint.name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.upcomingEmpty, { borderColor: c.borderLight }]}>
            <Text style={[styles.upcomingEmptyText, { color: c.textMuted }]}>No upcoming trips</Text>
          </View>
        )}
      </View>

      {/* Past Week */}
      <View style={[styles.section, { paddingHorizontal: landingHeaderPaddingHorizontal }]}>
        <Text style={[styles.sectionOverline, { color: c.textMuted }]}>Past Week</Text>
        {completed.length === 0 ? (
          <View style={[styles.pastEmpty, { borderColor: c.borderLight }]}>
            <Text style={[styles.pastEmptyText, { color: c.textMuted }]}>No past trips yet</Text>
          </View>
        ) : (
          <View style={styles.pastList}>
            {completed.map((item) => {
              const amountTotal = item.seats * item.trip.pricePerSeat;
              const dateLabel = item.trip.departureDate ? formatPastDate(item.trip.departureDate) : (item.createdAt ? formatPastDate(item.createdAt) : '—');
              const isExpanded = expandedId === item.id;
              return (
                <View key={item.id} style={[styles.pastCardWrap, { backgroundColor: c.surface, borderColor: c.borderLight }]}>
                  <View style={styles.pastCardRow}>
                    <View style={[styles.pastIconWrap, { backgroundColor: c.card }]}>
                      <Ionicons name="checkmark-done" size={20} color={c.textMuted} />
                    </View>
                    <TouchableOpacity
                      style={styles.pastContent}
                      onPress={() => toggleExpanded(item.id)}
                    >
                      <Text style={[styles.pastRoute, { color: c.text }]}>
                        {item.trip.departureHotpoint.name} to {item.trip.destinationHotpoint.name}
                      </Text>
                      <Text style={[styles.pastMeta, { color: c.textMuted }]}>
                        {dateLabel} • With {item.trip.driver.name}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.pastPrice, { color: c.text }]}>
                      {Number(amountTotal).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF
                    </Text>
                    <ExpandActionButton expanded={isExpanded} onPress={() => toggleExpanded(item.id)} />
                  </View>
                  {isExpanded ? (
                    <View style={styles.pastExpanded}>
                      <ExpansionDetailsCard
                        tone="passenger"
                        title="Ticket & trip details"
                        rows={[
                          { icon: 'ticket', label: 'Ticket number', value: item.ticketNumber ?? '—' },
                          { icon: 'flag', label: 'Status', value: item.status },
                          { icon: 'cash', label: 'Amount', value: `${Number(amountTotal).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF` },
                        ]}
                      />
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: c.primary, backgroundColor: c.primaryTint }]}
                          onPress={() => navigation.navigate('TicketDetail', { bookingId: item.id })}
                        >
                          <Ionicons name="document-text-outline" size={14} color={c.primary} />
                          <Text style={[styles.actionText, { color: c.text }]}>View ticket</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: c.primary, backgroundColor: c.primaryTint }]}
                          onPress={() => void onDownloadTicket(item.id)}
                        >
                          <Ionicons name="download-outline" size={14} color={c.primary} />
                          <Text style={[styles.actionText, { color: c.text }]}>Download PDF</Text>
                        </TouchableOpacity>
                      </View>
                      {item.status === 'completed' ? (
                        <View style={[styles.ratingCard, { backgroundColor: c.surfaceElevated, borderColor: c.borderLight }]}>
                          <Text style={[styles.ratingTitle, { color: c.textSecondary }]}>Rate this driver</Text>
                          <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((score) => (
                              <TouchableOpacity
                                key={`${item.id}-${score}`}
                                onPress={() => void onRateDriver(item, score)}
                                disabled={ratingLoadingId === item.id || ratingsByBooking[item.id] != null}
                                style={styles.starBtn}
                              >
                                <Ionicons
                                  name={score <= (ratingsByBooking[item.id] ?? 0) ? 'star' : 'star-outline'}
                                  size={18}
                                  color={c.primary}
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                          {ratingsByBooking[item.id] != null && (
                            <Text style={[styles.ratingLocked, { color: c.textMuted }]}>Thanks, you already submitted a rating.</Text>
                          )}
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <CarRefreshIndicator state={refreshState} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: listScreenHeaderPaddingVertical },
  errorBanner: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    gap: spacing.sm,
  },
  errorText: { ...typography.body },
  section: { marginBottom: spacing.xl },
  sectionOverline: {
    ...typography.bodySmall,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.lg,
    paddingLeft: spacing.sm,
  },
  upcomingCard: {
    borderRadius: radii.xlMobile,
    padding: spacing.lg,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  upcomingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  confirmedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
  },
  confirmedBadgeText: {
    ...typography.overline,
    letterSpacing: 1,
  },
  upcomingTime: { ...typography.bodySmall, fontWeight: '700', opacity: 0.9 },
  upcomingRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeBlock: { flex: 1, alignItems: 'center' },
  routeCode: { ...typography.timeLg },
  routeCity: { ...typography.bodySmall, opacity: 0.7, marginTop: tightGap },
  routeDots: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { width: 24, height: 1, borderTopWidth: 1, marginHorizontal: spacing.xs },
  upcomingEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingEmptyText: { ...typography.body },
  pastList: { gap: spacing.md },
  pastCardWrap: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pastCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pastExpanded: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  pastIconWrap: {
    width: sizes.avatar.md,
    height: sizes.avatar.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pastContent: { flex: 1, minWidth: 0 },
  pastRoute: { ...typography.body, fontWeight: '700' },
  pastMeta: { ...typography.bodySmall, marginTop: tightGap },
  pastPrice: { ...typography.bodyBold, fontWeight: '800' },
  actionRow: {
    ...sharedStyles.listRow,
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: buttonHeights.small,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
  },
  actionText: { ...typography.bodySmall, fontWeight: '700' },
  ratingCard: {
    marginTop: spacing.md,
    borderWidth: borderWidths.thin,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  ratingTitle: { ...typography.bodySmall, fontWeight: '700', marginBottom: spacing.sm },
  ratingRow: { flexDirection: 'row', gap: spacing.sm },
  starBtn: { padding: spacing.sm },
  ratingLocked: { ...typography.bodySmall, marginTop: spacing.sm },
  pastEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastEmptyText: { ...typography.body },
});
