import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
  EmptyState,
  Screen,
  Button,
  CarRefreshIndicator,
  ExpansionDetailsCard,
  ExpandActionButton,
} from '../../components';
import { useTabbedList } from '../../hooks/useTabbedList';
import { buttonHeights, spacing, typography, radii, borderWidths } from '../../utils/theme';
import {
  listBottomPaddingTab,
  cardRadius,
  listScreenHeaderPaddingVertical,
  listScreenHeaderPaddingHorizontal,
  listContentPaddingTop,
  screenContentPadding,
  tightGap,
} from '../../utils/layout';
import { sharedStyles } from '../../utils/sharedStyles';
import { useThemeColors } from '../../context/ThemeContext';
import type { Booking } from '../../types';

const TABS = [
  { key: 'upcoming' as const, label: 'Upcoming' },
  { key: 'ongoing' as const, label: 'Ongoing' },
  { key: 'completed' as const, label: 'Completed' },
  { key: 'cancelled' as const, label: 'Cancelled' },
];

export default function PassengerMyRidesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const c = useThemeColors();
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
    <Screen style={[styles.container, { backgroundColor: c.background }]}>
      {loadError ? (
        <View style={[styles.errorBanner, { backgroundColor: c.surfaceElevated, borderColor: c.error }]}>
          <Text style={[styles.errorText, { color: c.error }]}>{loadError}</Text>
          <Button title="Retry" onPress={() => void refresh()} />
        </View>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        style={styles.tabsWrapper}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[
              styles.tabPill,
              { backgroundColor: tab === t.key ? c.primary : c.background, borderColor: tab === t.key ? c.primary : c.cardBorder },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabPillText,
                { color: tab === t.key ? c.onPrimary : c.textSecondary },
                tab === t.key && styles.tabPillTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {list.length === 0 ? (
        <EmptyState
          title={tab === 'cancelled' ? 'No cancelled rides' : `No ${tab} rides`}
          subtitle={tab === 'cancelled' ? 'Cancelled bookings will appear here.' : 'Book a ride to get started.'}
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
          renderItem={({ item }) => {
            const amountTotal = item.seats * item.trip.pricePerSeat;
            const issuedOrCreated = item.ticketIssuedAt ?? item.createdAt;
            const issuedLabel = item.ticketIssuedAt ? new Date(item.ticketIssuedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : (item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');
            const statusBadgeStyle = item.status === 'upcoming' ? styles.badgeUpcoming : item.status === 'ongoing' ? styles.badgeOngoing : item.status === 'completed' ? styles.badgeCompleted : styles.badgeCancelled;
            const statusBadgeColor = item.status === 'upcoming' ? c.primary : item.status === 'ongoing' ? c.text : item.status === 'completed' ? c.success : c.textMuted;
            return (
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={styles.headerRow}>
                <View style={styles.routeBlock}>
                  <View style={styles.cardFaceRow}>
                    <Text style={[styles.badge, statusBadgeStyle, { color: statusBadgeColor }]}>
                      {item.status === 'upcoming' ? 'Upcoming' : item.status === 'ongoing' ? 'Ongoing' : item.status === 'completed' ? 'Completed' : 'Cancelled'}
                    </Text>
                    <Text style={[styles.ticketNumberFace, { color: c.textMuted }]}>
                      Ticket {item.ticketNumber ?? '—'}
                    </Text>
                  </View>
                  <Text style={[styles.route, { color: c.text }]}>
                    {item.trip.departureHotpoint.name} → {item.trip.destinationHotpoint.name}
                  </Text>
                  <Text style={[styles.time, { color: c.textSecondary }]}>
                    {item.trip.departureDate ? new Date(item.trip.departureDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''} {item.trip.departureTime?.slice(0, 5)} • {item.trip.driver.name}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.paymentBadge, { backgroundColor: c.surfaceElevated || c.surface }]}>
                      <Text style={[styles.paymentBadgeText, { color: c.text }]}>{item.paymentMethod.replace('_', ' ')}</Text>
                    </View>
                    <Text style={[styles.amountFace, { color: c.text }]}>
                      {Number(amountTotal).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF
                    </Text>
                  </View>
                  {issuedOrCreated ? (
                    <Text style={[styles.issuedFace, { color: c.textMuted }]}>Issued {issuedLabel}</Text>
                  ) : null}
                </View>
                <ExpandActionButton
                  expanded={expandedId === item.id}
                  onPress={() => toggleExpanded(item.id)}
                />
              </View>
              {expandedId === item.id ? (
                <>
                  <ExpansionDetailsCard
                    tone="passenger"
                    title="Ticket & trip details"
                    rows={[
                      { icon: 'ticket', label: 'Ticket number', value: item.ticketNumber ?? '—' },
                      { icon: 'calendar-outline', label: 'Issued', value: issuedLabel },
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
                        label: 'Amount',
                        value: `${Number(amountTotal).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF`,
                      },
                      { icon: 'time-outline', label: 'Scanned at', value: '—' },
                      { icon: 'person-outline', label: 'Scanned by', value: '—' },
                    ]}
                  />
                  <View style={styles.actionRow}>
                    {item.status !== 'cancelled' ? (
                      <>
                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: c.primary, backgroundColor: c.primaryTint }]}
                          onPress={() => navigation.navigate('TicketDetail', { bookingId: item.id })}
                        >
                          <Ionicons name="document-text-outline" size={14} color={c.primary} />
                          <Text style={[styles.actionText, { color: c.text }]}>View full ticket</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: c.primary, backgroundColor: c.primaryTint }]}
                          onPress={() => void onDownloadTicket(item.id)}
                        >
                          <Ionicons name="download-outline" size={14} color={c.primary} />
                          <Text style={[styles.actionText, { color: c.text }]}>Download PDF</Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                    {item.status === 'upcoming' ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: c.error, backgroundColor: c.errorTint }]}
                        onPress={() => void onCancelBooking(item)}
                      >
                        <Ionicons name="close-circle-outline" size={14} color={c.error} />
                        <Text style={[styles.actionDangerText, { color: c.error }]}>Cancel booking</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {item.status === 'completed' ? (
                    <View style={[styles.ratingCard, { backgroundColor: c.surfaceElevated, borderColor: c.borderLight }]}>
                      <Text style={[styles.ratingTitle, { color: c.textSecondary }]}>Rate this driver</Text>
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
                        <Text style={[styles.ratingLocked, { color: c.textMuted }]}>Thanks, you already submitted a rating.</Text>
                      ) : null}
                    </View>
                  ) : null}
                </>
              ) : null}
            </View>
          );
          }}
        />
      )}
      <CarRefreshIndicator state={refreshState} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsWrapper: { marginBottom: spacing.sm },
  tabsScroll: {
    flexDirection: 'row',
    paddingTop: listScreenHeaderPaddingVertical,
    paddingHorizontal: listScreenHeaderPaddingHorizontal,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  tabPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.thin,
  },
  tabPillText: { ...typography.bodySmall, fontWeight: '700' },
  tabPillTextActive: { fontWeight: '800' },
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: cardRadius,
    borderWidth: borderWidths.thin,
  },
  headerRow: {
    ...sharedStyles.listRow,
    alignItems: 'flex-start',
  },
  routeBlock: { flex: 1, minWidth: 0 },
  cardFaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  badge: {
    ...typography.overline,
    letterSpacing: 1,
  },
  badgeUpcoming: {},
  badgeOngoing: {},
  badgeCompleted: {},
  badgeCancelled: {},
  ticketNumberFace: { ...typography.caption, fontWeight: '600' },
  route: { ...typography.body, fontWeight: '700' },
  time: { ...typography.bodySmall, fontWeight: '600', marginTop: spacing.xs },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  paymentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: tightGap,
    borderRadius: radii.sm,
  },
  paymentBadgeText: { ...typography.caption, fontWeight: '700' },
  amountFace: { ...typography.bodySmall, fontWeight: '800' },
  issuedFace: { ...typography.caption, marginTop: tightGap },
  seats: { ...typography.bodySmall, fontWeight: '600', marginTop: spacing.xs },
  actionRow: {
    ...sharedStyles.listRow,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: buttonHeights.small,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
  },
  actionText: { ...typography.captionBold },
  actionDangerText: { ...typography.captionBold },
  ratingCard: {
    marginTop: spacing.sm,
    borderWidth: borderWidths.thin,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  ratingTitle: {
    ...typography.captionBold,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  starBtn: {
    padding: spacing.xs,
  },
  ratingLocked: { ...typography.captionBold, marginTop: spacing.xs },
  listContent: {
    paddingHorizontal: screenContentPadding,
    paddingTop: listContentPaddingTop,
    paddingBottom: listBottomPaddingTab,
  },
  errorBanner: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    gap: spacing.sm,
  },
  errorText: { ...typography.body },
});
