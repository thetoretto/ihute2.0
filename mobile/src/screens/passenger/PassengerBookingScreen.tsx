import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethodIcons, Screen } from '../../components';
import { getTrip, getTripsStore, bookTrip, createDeposit, getPaymentStatus, createPaymentIntent } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, typography, radii, buttonHeights, cardShadow, cardShadowStrong, sizes, borderWidths } from '../../utils/theme';
import { landingHeaderPaddingHorizontal, listScreenHeaderPaddingVertical, tightGap, scrollStepBottomPadding } from '../../utils/layout';
import { formatRwf } from '../../../../shared/src';
import type { Trip, PaymentMethod } from '../../types';

type Params = {
  PassengerBooking: { tripId: string };
};

/**
 * Seat layout by vehicle capacity (max 30). Symmetric grid.
 * 2+2: rows of 4 (coach/minibus when vehicle capacity > 14).
 * 1+2: rows of 3 – one left, two right (shuttle).
 * @param seatsToShow number of seat cells to show (e.g. trip.seatsAvailable)
 * @param vehicleCapacity optional total vehicle seats (for layout shape; e.g. trip.vehicle?.seats)
 */
function getSeatLayoutSymmetric(seatsToShow: number, vehicleCapacity?: number): number[][] {
  const capacity = Math.min(30, Math.max(1, seatsToShow));
  const total = vehicleCapacity ?? capacity;
  const perRow = total > 14 ? 4 : 3; // 2+2 vs 1+2
  const layout: number[][] = [];
  let placed = 0;
  while (placed < capacity) {
    const row: number[] = [];
    for (let i = 0; i < perRow && placed < capacity; i++) {
      row.push(1);
      placed++;
    }
    layout.push(row);
  }
  return layout;
}

/** Flatten layout to list of bookable seat ids (s-1, s-2, ...). */
function getBookableSeatIds(layout: number[][]): string[] {
  const ids: string[] = [];
  let counter = 1;
  for (const row of layout) {
    for (const cell of row) {
      if (cell === 1) ids.push(`s-${counter++}`);
    }
  }
  return ids;
}

export default function PassengerBookingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Params, 'PassengerBooking'>>();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { user, isProfileComplete } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [step, setStep] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [fullCarToggle, setFullCarToggle] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const store = getTripsStore();
    const t = store.find((x) => x.id === route.params.tripId);
    if (t) {
      setTrip(t);
      return;
    }
    getTrip(route.params.tripId).then((fetched) => {
      if (fetched) setTrip(fetched);
    });
  }, [route.params.tripId]);

  const layout = useMemo(
    () => (trip ? getSeatLayoutSymmetric(trip.seatsAvailable, trip.vehicle?.seats) : []),
    [trip]
  );
  const bookableSeatIds = useMemo(() => getBookableSeatIds(layout), [layout]);

  const toggleSeat = (seatId: string) => {
    if (fullCarToggle) return;
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const effectiveSeatCount = fullCarToggle && trip ? trip.seatsAvailable : selectedSeats.length;
  const totalPrice = useMemo(() => {
    if (!trip) return 0;
    return effectiveSeatCount * trip.pricePerSeat;
  }, [trip, effectiveSeatCount]);
  const isFullCarBooking = fullCarToggle || (trip != null && selectedSeats.length >= trip.seatsAvailable);

  const requireProfile = (): boolean => {
    if (!user) return false;
    if (!isProfileComplete) {
      Alert.alert(
        'Complete your profile',
        'You need to complete your profile before you can book.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to profile', onPress: () => (navigation.getParent() as any)?.navigate('PassengerProfile') },
        ]
      );
      return false;
    }
    return true;
  };

  const navigateToTicket = (bookingId: string) => {
    navigation.replace('TicketDetail', { bookingId });
  };

  const handleCompletePayment = async () => {
    if (!trip || !user || paymentMethod == null || (fullCarToggle ? false : selectedSeats.length === 0) || isBooking) return;
    if (!requireProfile()) return;
    const seats = fullCarToggle ? trip.seatsAvailable : selectedSeats.length;
    if (seats <= 0) return;
    try {
      setIsBooking(true);
      const booking = await bookTrip({
        tripId: trip.id,
        passenger: user,
        seats,
        paymentMethod,
        isFullCar: fullCarToggle || seats >= trip.seatsAvailable,
      });

      if (paymentMethod === 'cash') {
        Alert.alert(
          'Booking created',
          'Pay the driver when you board. The driver will confirm your ticket after collecting cash.',
          [{ text: 'View ticket', onPress: () => navigateToTicket(booking.id) }]
        );
        return;
      }

      if (paymentMethod === 'card') {
        try {
          await createPaymentIntent(booking.id);
        } catch {
          // Intent may already exist
        }
        Alert.alert(
          'Booking created',
          'Complete card payment on our website, or your booking will be confirmed when the driver processes it.',
          [{ text: 'View ticket', onPress: () => navigateToTicket(booking.id) }]
        );
        return;
      }

      if (paymentMethod === 'mobile_money') {
        const phone = user.phone?.trim();
        if (!phone) {
          Alert.alert('Phone required', 'Add your phone number in profile to use Mobile Money.');
          return;
        }
        const { depositId } = await createDeposit(booking.id, phone);
        Alert.alert(
          'Check your phone',
          'You will receive a prompt on your phone to complete payment. We will confirm when payment is received.',
          [{ text: 'OK' }]
        );
        const poll = async () => {
          const result = await getPaymentStatus({ depositId, bookingId: booking.id });
          if (result.status === 'succeeded') {
            Alert.alert('Payment received', 'Your booking is confirmed.', [
              { text: 'View ticket', onPress: () => navigateToTicket(booking.id) },
            ]);
            return;
          }
          if (result.status === 'failed') {
            Alert.alert('Payment failed', 'Mobile Money payment did not complete. You can try again or choose another payment method.');
            return;
          }
          setTimeout(poll, 2500);
        };
        setTimeout(poll, 2500);
        return;
      }

      Alert.alert(
        'Booking confirmed',
        'Your ticket has been generated.',
        [
          { text: 'View ticket', onPress: () => navigateToTicket(booking.id) },
          { text: 'My rides', onPress: () => navigation.getParent()?.navigate?.('PassengerBookings') },
        ]
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not complete booking');
    } finally {
      setIsBooking(false);
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  if (!trip) {
    return (
      <Screen contentInset={false} style={styles.center}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading trip...</Text>
      </Screen>
    );
  }

  const departureDate = trip.departureDate
    ? new Date(trip.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Today';

  const renderSeatMap = () => {
    let seatCounter = 1;
    return (
      <View style={[styles.seatMapContainer, { backgroundColor: c.card, borderColor: c.borderLight }, cardShadow]}>
        <View style={[styles.windshield, { backgroundColor: c.textMuted }]} />
        {layout.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.seatRow}>
            {row.map((seatType, seatIndex) => {
              if (seatType === 0) {
                return (
                  <View key={`d-${rowIndex}-${seatIndex}`} style={styles.driverCell}>
                    <Ionicons name="car-sport-outline" size={24} color={c.textMuted} />
                  </View>
                );
              }
              const seatId = `s-${seatCounter++}`;
              const isSelected = selectedSeats.includes(seatId);
              return (
                <TouchableOpacity
                  key={seatId}
                  onPress={() => toggleSeat(seatId)}
                  style={[
                    styles.seatBtn,
                    { borderColor: c.border, backgroundColor: c.surface },
                    isSelected && { backgroundColor: c.primary, borderColor: c.primary },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-outline" size={22} color={isSelected ? c.text : c.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={[styles.rearMarker, { backgroundColor: c.border }]} />
      </View>
    );
  };

  const stepLabels = ['Trip', 'Seats', 'Payment'] as const;

  return (
    <View style={[styles.container, { backgroundColor: c.appBackground }]}>
      {/* Header: card-style to match RideDetail */}
      <View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.borderLight, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={goBack}
          style={[styles.headerBtn, step === 1 && styles.headerBtnInvisible]}
          disabled={step === 1}
          hitSlop={12}
          accessibilityLabel="Go back"
        >
          <View style={[styles.headerBtnInner, { backgroundColor: c.background || c.ghostBg }]}>
            <Ionicons name="chevron-back" size={20} color={c.text} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>
          {step === 1 && 'Review trip'}
          {step === 2 && 'Choose seats'}
          {step === 3 && 'Confirm booking'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step indicator */}
      <View style={[styles.stepperWrap, { borderBottomColor: c.borderLight }]}>
        <View style={styles.stepperRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperDot,
                  { backgroundColor: step >= s ? c.primary : c.border },
                  step === s && styles.stepperDotActive,
                ]}
              />
              {s < 3 && <View style={[styles.stepperLine, { backgroundColor: step > s ? c.primary : c.border }]} />}
            </View>
          ))}
        </View>
        <View style={styles.stepperLabels}>
          {stepLabels.map((label, i) => (
            <Text key={label} style={[styles.stepperLabel, { color: step >= i + 1 ? c.text : c.textMuted }]}>
              {label}
            </Text>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Route timeline (match RideDetail) + vehicle */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.timelineSection}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineDotsWrap}>
                  <View style={[styles.timelineDashed, { borderColor: c.border }]} />
                  <View style={[styles.timelineDot, styles.timelineDotTop, { backgroundColor: c.primary, borderColor: c.card }]} />
                  <View style={[styles.timelineDot, styles.timelineDotBottom, { backgroundColor: c.primary, borderColor: c.card }]} />
                </View>
                <View style={styles.timelineLabels}>
                  <View style={styles.timelineItem}>
                    <Text style={[styles.timelineTime, { color: c.text }]}>{trip.departureTime?.slice(0, 5) || '—'}</Text>
                    <Text style={[styles.timelinePlace, { color: c.textMuted }]}>{trip.departureHotpoint.name}</Text>
                  </View>
                  <View style={styles.timelineItem}>
                    <Text style={[styles.timelineTime, { color: c.text }]}>{trip.arrivalTime?.slice(0, 5) || '—'}</Text>
                    <Text style={[styles.timelinePlace, { color: c.textMuted }]}>{trip.destinationHotpoint.name}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.timelinePriceWrap}>
                <Text style={[styles.timelinePrice, { color: c.primary }]}>{formatRwf(trip.pricePerSeat)}</Text>
                <Text style={[styles.perSeatLabel, { color: c.textMuted }]}>Per seat</Text>
              </View>
            </View>
            <View style={[styles.timelineMeta, { backgroundColor: c.background || c.ghostBg }]}>
              <Text style={[styles.timelineMetaText, { color: c.text }]}>{departureDate} • {trip.seatsAvailable} seats</Text>
            </View>

            <View style={styles.vehicleSection}>
              <View style={styles.vehicleSectionHeader}>
                <Text style={[styles.vehicleSectionTitle, { color: c.text }]}>Vehicle</Text>
              </View>
              <TouchableOpacity style={[styles.vehicleCard, { backgroundColor: c.card, borderColor: c.primary }]} activeOpacity={0.9}>
                <View style={[styles.vehicleIconWrap, { backgroundColor: c.primaryTint }]}>
                  <Ionicons name="car-sport" size={28} color={c.primary} />
                </View>
                <View style={styles.vehicleTextWrap}>
                  <Text style={[styles.vehicleName, { color: c.text }]}>
                    {trip.vehicle.make} {trip.vehicle.model}
                  </Text>
                  <Text style={[styles.vehicleDesc, { color: c.textMuted }]}>
                    {trip.seatsAvailable} seats • {trip.vehicle.color}
                  </Text>
                </View>
                <View style={styles.vehiclePriceWrap}>
                  <Text style={[styles.vehiclePrice, { color: c.text }]}>{formatRwf(trip.pricePerSeat)}</Text>
                  <Text style={[styles.vehiclePriceUnit, { color: c.textMuted }]}>seat</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Seat map */}
        {step === 2 && (
          <View style={styles.stepContent}>
            {trip.allowFullCar && (
              <TouchableOpacity
                style={[
                  styles.fullCarRow,
                  { backgroundColor: fullCarToggle ? c.primaryTint : c.surface, borderColor: fullCarToggle ? c.primary : c.border },
                ]}
                onPress={() => setFullCarToggle((v) => !v)}
                activeOpacity={0.8}
              >
                <Ionicons name="car-sport" size={20} color={fullCarToggle ? c.primary : c.textMuted} />
                <Text style={[styles.fullCarLabel, { color: fullCarToggle ? c.primary : c.text }]}>Book full car</Text>
                <Text style={[styles.fullCarSub, { color: c.textMuted }]}>{trip.seatsAvailable} seats • {formatRwf(trip.seatsAvailable * trip.pricePerSeat)}</Text>
                <View style={[styles.fullCarToggle, { backgroundColor: fullCarToggle ? c.primary : c.border }]}>
                  {fullCarToggle && <Ionicons name="checkmark" size={14} color={c.onPrimary ?? c.onAccent} />}
                </View>
              </TouchableOpacity>
            )}
            <View style={styles.seatHeader}>
              <Text style={[styles.seatHeaderTitle, { color: c.text }]}>
                {trip.vehicle.make} {trip.vehicle.model}
              </Text>
              <View style={[styles.seatHeaderBadge, { backgroundColor: c.primaryTint }]}>
                <Ionicons name="people" size={12} color={c.primary} />
                <Text style={[styles.seatHeaderBadgeText, { color: c.primary }]}>{trip.seatsAvailable} seats</Text>
              </View>
            </View>
            {renderSeatMap()}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendFree, { borderColor: c.border, backgroundColor: c.surface }]} />
                <Text style={[styles.legendText, { color: c.textMuted }]}>Free</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendPicked, { backgroundColor: c.primary }]} />
                <Text style={[styles.legendText, { color: c.textMuted }]}>Selected</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendStaff, { backgroundColor: c.border }]} />
                <Text style={[styles.legendText, { color: c.textMuted }]}>Driver</Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryIconWrap, { backgroundColor: c.successTint }]}>
                <Ionicons name="shield-checkmark" size={40} color={c.success} />
              </View>
              <Text style={[styles.summaryTitle, { color: c.text }]}>Booking summary</Text>
              <Text style={[styles.summarySub, { color: c.textMuted }]}>Review and pay</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[styles.summaryRow, { borderBottomColor: c.border }]}>
                <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Vehicle</Text>
                <Text style={[styles.summaryValue, { color: c.text }]}>
                  {trip.vehicle.make} {trip.vehicle.model}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: c.border }]}>
                <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Seats</Text>
                <Text style={[styles.summaryValue, { color: c.primary }]}>
                  {isFullCarBooking && trip.seatsAvailable === effectiveSeatCount
                    ? `Full car (${trip.seatsAvailable} seats)`
                    : selectedSeats.map((s) => s.replace('s-', '#')).join(', ')}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: c.border }]}>
                <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Price</Text>
                <Text style={[styles.summaryValue, { color: c.text }]}>
                  {formatRwf(trip.pricePerSeat)} × {effectiveSeatCount}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                <Text style={[styles.summaryTotalLabel, { color: c.text }]}>Total</Text>
                <Text style={[styles.summaryTotalPrice, { color: c.primary }]}>{formatRwf(totalPrice)}</Text>
              </View>
            </View>
            <View style={styles.paymentSection}>
              <Text style={[styles.paymentLabel, { color: c.text }]}>Payment method</Text>
              <PaymentMethodIcons
                methods={trip.paymentMethods}
                selected={paymentMethod}
                onSelect={setPaymentMethod}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA with safe area */}
      <View style={[styles.footer, { backgroundColor: c.card, borderTopColor: c.borderLight, paddingBottom: insets.bottom + spacing.md }]}>
        {step === 1 && (
          <TouchableOpacity
            style={[styles.ctaPrimary, { backgroundColor: c.primary }]}
            onPress={() => setStep(2)}
            activeOpacity={0.9}
          >
            <Text style={[styles.ctaPrimaryText, { color: c.text }]}>Continue</Text>
            <Ionicons name="chevron-forward" size={20} color={c.text} />
          </TouchableOpacity>
        )}
        {step === 2 && (
          <View style={styles.footerRow}>
            <View>
              <Text style={[styles.subtotalLabel, { color: c.textMuted }]}>Subtotal</Text>
              <Text style={[styles.subtotalValue, { color: c.text }]}>{formatRwf(totalPrice)}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.ctaContinue,
                { backgroundColor: c.primary },
                effectiveSeatCount === 0 && { backgroundColor: c.border, opacity: 0.5 },
              ]}
              onPress={() => setStep(3)}
              disabled={effectiveSeatCount === 0}
              activeOpacity={0.9}
            >
              <Text style={[styles.ctaContinueText, { color: c.text }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
        {step === 3 && (
          <TouchableOpacity
            style={[
              styles.ctaPayment,
              { backgroundColor: c.success },
              (isBooking || paymentMethod == null) && { opacity: paymentMethod == null ? 0.5 : 0.9 },
            ]}
            onPress={handleCompletePayment}
            disabled={isBooking || paymentMethod == null}
            activeOpacity={0.9}
          >
            {isBooking ? (
              <>
                <ActivityIndicator size="small" color={c.onAccent} />
                <Text style={[styles.ctaPaymentText, { color: c.onAccent }]}>Processing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={c.onAccent} />
                <Text style={[styles.ctaPaymentText, { color: c.onAccent }]}>Complete payment</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingVertical: spacing.md,
    minHeight: 56,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: spacing.xs,
    minWidth: sizes.touchTarget.min,
    minHeight: sizes.touchTarget.min,
    justifyContent: 'center',
  },
  headerBtnInner: {
    width: sizes.touchTarget.iconButton,
    height: sizes.touchTarget.iconButton,
    borderRadius: sizes.touchTarget.iconButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnInvisible: { opacity: 0 },
  headerTitle: { ...typography.body, fontWeight: '800', flex: 1, textAlign: 'center' },
  headerSpacer: { width: sizes.touchTarget.iconButton },
  stepperWrap: {
    paddingVertical: spacing.md,
    paddingHorizontal: landingHeaderPaddingHorizontal,
    borderBottomWidth: 1,
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepperItem: { flexDirection: 'row', alignItems: 'center' },
  stepperDot: {
    width: sizes.timelineDot + 2,
    height: sizes.timelineDot + 2,
    borderRadius: (sizes.timelineDot + 2) / 2,
  },
  stepperDotActive: {
    width: sizes.timelineDotLg,
    height: sizes.timelineDotLg,
    borderRadius: sizes.timelineDotLg / 2,
  },
  stepperLine: {
    width: spacing.lg,
    height: borderWidths.medium,
    marginHorizontal: spacing.xs,
  },
  stepperLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingHorizontal: 0,
  },
  stepperLabel: { ...typography.bodySmall, flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: landingHeaderPaddingHorizontal, paddingTop: listScreenHeaderPaddingVertical, paddingBottom: scrollStepBottomPadding },
  stepContent: { paddingBottom: spacing.xl },

  fullCarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  fullCarLabel: { ...typography.bodySmall, fontWeight: '800', flex: 1 },
  fullCarSub: { ...typography.caption },
  fullCarToggle: {
    width: sizes.icon.large,
    height: sizes.icon.large,
    borderRadius: radii.smMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Step 1 timeline (match RideDetail)
  timelineSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  timelineLeft: { flexDirection: 'row', flex: 1, minWidth: 0 },
  timelineDotsWrap: {
    width: sizes.icon.large,
    marginRight: spacing.sm,
    position: 'relative',
    alignItems: 'center',
  },
  timelineDashed: {
    position: 'absolute',
    left: 11,
    top: 4,
    bottom: 4,
    width: 0,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
  timelineDot: {
    width: sizes.timelineDotLg,
    height: sizes.timelineDotLg,
    borderRadius: radii.xs,
    borderWidth: 2,
    position: 'absolute',
    left: 6,
  },
  timelineDotTop: { top: 0 },
  timelineDotBottom: { bottom: 0 },
  timelineLabels: { flex: 1, minWidth: 0 },
  timelineItem: { marginBottom: spacing.lg },
  timelineTime: typography.time,
  timelinePlace: { ...typography.bodySmall, fontWeight: '600', marginTop: tightGap },
  timelinePriceWrap: { alignItems: 'flex-end' },
  timelinePrice: typography.timeLg,
  perSeatLabel: { ...typography.overline, fontWeight: '800', marginTop: tightGap },
  timelineMeta: { borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.lg },
  timelineMetaText: { ...typography.bodySmall, fontWeight: '600' },
  vehicleSection: { marginTop: spacing.sm },
  vehicleSectionHeader: { marginBottom: spacing.sm },
  vehicleSectionTitle: { ...typography.body, fontWeight: '700' },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: borderWidths.medium,
  },
  vehicleIconWrap: {
    width: sizes.avatar.xl,
    height: sizes.avatar.xl,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  vehicleTextWrap: { flex: 1 },
  vehicleName: { ...typography.body, fontWeight: '700' },
  vehicleDesc: { ...typography.caption11, marginTop: tightGap },
  vehiclePriceWrap: { alignItems: 'flex-end' },
  vehiclePrice: { ...typography.body, fontWeight: '800' },
  vehiclePriceUnit: typography.caption9,

  // Step 2
  seatHeader: { alignItems: 'center', marginBottom: spacing.md },
  seatHeaderTitle: typography.driverNameLg,
  seatHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smDense,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.smDense,
    borderRadius: radii.button,
    marginTop: spacing.smDense,
  },
  seatHeaderBadgeText: { ...typography.overline, fontWeight: '700' },
  seatMapContainer: {
    borderRadius: radii.lg,
    borderWidth: borderWidths.medium,
    borderStyle: 'dashed',
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    maxHeight: 420,
  },
  windshield: {
    width: 80,
    height: spacing.smDense,
    borderRadius: radii.xxs,
    marginBottom: spacing.lg,
    opacity: 0.4,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  driverCell: {
    width: sizes.avatar.lg,
    height: sizes.avatar.lg,
    borderRadius: radii.smMedium,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  seatBtn: {
    width: sizes.avatar.lg,
    height: sizes.avatar.lg,
    borderRadius: radii.smMedium,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatBtnSelected: {},
  rearMarker: {
    width: spacing.xl * 2,
    height: borderWidths.medium,
    borderRadius: borderWidths.medium,
    marginTop: spacing.md,
    opacity: 0.5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl * 2,
    paddingVertical: spacing.sm,
  },
  legendItem: { alignItems: 'center', gap: spacing.smDense },
  legendBox: { width: sizes.timelineDotLg, height: sizes.timelineDotLg, borderRadius: radii.xxs },
  legendFree: { borderWidth: borderWidths.medium },
  legendPicked: {},
  legendStaff: {},
  legendText: typography.caption9,

  // Step 3
  summaryHeader: { alignItems: 'center', marginBottom: spacing.lg },
  summaryIconWrap: {
    width: sizes.avatar.xl + spacing.lg,
    height: sizes.avatar.xl + spacing.lg,
    borderRadius: (sizes.avatar.xl + spacing.lg) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  summaryTitle: { ...typography.h2, fontWeight: '700', marginBottom: spacing.xs },
  summarySub: { ...typography.bodySmall },
  summaryBox: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  summaryRowTotal: {
    borderBottomWidth: 0,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  summaryLabel: { ...typography.bodySmall },
  summaryValue: { ...typography.body, fontWeight: '700' },
  summaryValueBrand: {},
  summaryTotalLabel: { ...typography.body, fontWeight: '800' },
  summaryTotalPrice: typography.totalPrice,
  paymentSection: { marginTop: spacing.sm },
  paymentLabel: { ...typography.body, fontWeight: '600', marginBottom: spacing.sm },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: buttonHeights.large + spacing.xs,
    borderRadius: radii.md,
    ...cardShadowStrong,
  },
  ctaPrimaryText: typography.bodyBold,
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  subtotalLabel: typography.overline,
  subtotalValue: typography.time,
  ctaContinue: {
    flex: 1,
    minHeight: buttonHeights.large + spacing.xs,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadowStrong,
  },
  ctaContinueDisabled: {},
  ctaContinueText: typography.bodyBold,
  ctaPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: buttonHeights.large + spacing.xs,
    borderRadius: radii.md,
    ...cardShadowStrong,
  },
  ctaPaymentDisabled: { opacity: 0.8 },
  ctaPaymentText: { ...typography.body, fontWeight: '700' },
});
