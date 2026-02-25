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
import { getTrip, getTripsStore, bookTrip } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { colors, spacing, typography } from '../../utils/theme';
import { formatRwf } from '../../../../shared/src';
import type { Trip, PaymentMethod } from '../../types';

const PASSENGER_BRAND = colors.passengerBrand;
const PASSENGER_DARK = colors.passengerDark;
const PASSENGER_BG_LIGHT = colors.passengerBgLight;

type Params = {
  PassengerBooking: { tripId: string };
};

/** Build seat layout for capacity: row 0 = [driver, 1 seat], then rows of 3. */
function getSeatLayout(seatsAvailable: number): number[][] {
  const layout: number[][] = [[0, 1]]; // driver (0) + first passenger (1)
  let placed = 1;
  while (placed < seatsAvailable) {
    const row: number[] = [];
    for (let i = 0; i < 3 && placed < seatsAvailable; i++) {
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

  const layout = useMemo(() => (trip ? getSeatLayout(trip.seatsAvailable) : []), [trip]);
  const bookableSeatIds = useMemo(() => getBookableSeatIds(layout), [layout]);

  const toggleSeat = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const totalPrice = useMemo(() => {
    if (!trip) return 0;
    return selectedSeats.length * trip.pricePerSeat;
  }, [trip, selectedSeats]);

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

  const handleCompletePayment = async () => {
    if (!trip || !user || paymentMethod == null || selectedSeats.length === 0 || isBooking) return;
    if (!requireProfile()) return;
    try {
      setIsBooking(true);
      const booking = await bookTrip({
        tripId: trip.id,
        passenger: user,
        seats: selectedSeats.length,
        paymentMethod,
        isFullCar: selectedSeats.length >= trip.seatsAvailable,
      });
      Alert.alert(
        'Booking confirmed',
        'Your ticket has been generated.',
        [
          {
            text: 'View ticket',
            onPress: () => {
              navigation.replace('TicketDetail', { bookingId: booking.id });
            },
          },
          {
            text: 'My rides',
            onPress: () => {
              navigation.getParent()?.navigate?.('PassengerBookings');
            },
          },
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
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={PASSENGER_BRAND} />
        <Text style={styles.loadingText}>Loading trip...</Text>
      </Screen>
    );
  }

  const departureDate = trip.departureDate
    ? new Date(trip.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Today';

  const renderSeatMap = () => {
    let seatCounter = 1;
    return (
      <View style={styles.seatMapContainer}>
        <View style={styles.windshield} />
        {layout.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.seatRow}>
            {row.map((seatType, seatIndex) => {
              if (seatType === 0) {
                return (
                  <View key={`d-${rowIndex}-${seatIndex}`} style={styles.driverCell}>
                    <Ionicons name="car-sport-outline" size={24} color={colors.textMuted} />
                  </View>
                );
              }
              const seatId = `s-${seatCounter++}`;
              const isSelected = selectedSeats.includes(seatId);
              return (
                <TouchableOpacity
                  key={seatId}
                  onPress={() => toggleSeat(seatId)}
                  style={[styles.seatBtn, isSelected && styles.seatBtnSelected]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color={isSelected ? PASSENGER_DARK : colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={styles.rearMarker} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header: same look as native stack header (primary bg, dark text) */}
      <View style={[styles.header, { backgroundColor: c.primary, paddingTop: insets.top, borderBottomWidth: 0 }]}>
        <TouchableOpacity
          onPress={goBack}
          style={[styles.headerBtn, step === 1 && styles.headerBtnInvisible]}
          disabled={step === 1}
        >
          <Ionicons name="chevron-back" size={24} color={c.dark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.dark }]}>
          {step === 1 && 'Select Vehicle'}
          {step === 2 && 'Choose Seats'}
          {step === 3 && 'Confirm Booking'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Trip info + vehicle */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>PICK-UP LOCATION</Text>
              <View style={styles.infoValueRow}>
                <View style={styles.infoDot} />
                <Text style={styles.infoValue}>{trip.departureHotpoint.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <View>
                  <Text style={styles.infoLabel}>DATE</Text>
                  <Text style={styles.infoSub}>{departureDate}</Text>
                </View>
                <View>
                  <Text style={styles.infoLabel}>TIME</Text>
                  <Text style={styles.infoSub}>{trip.departureTime}</Text>
                </View>
              </View>
              <View style={styles.infoBlob} />
            </View>

            <View style={styles.vehicleSection}>
              <View style={styles.vehicleSectionHeader}>
                <Text style={styles.vehicleSectionTitle}>Available Vehicles</Text>
                <Text style={styles.vehicleSectionBadge}>1 Option</Text>
              </View>
              <TouchableOpacity style={[styles.vehicleCard, styles.vehicleCardSelected]} activeOpacity={0.9}>
                <View style={styles.vehicleIconWrap}>
                  <Ionicons name="car-sport" size={28} color={PASSENGER_DARK} />
                </View>
                <View style={styles.vehicleTextWrap}>
                  <Text style={styles.vehicleName}>
                    {trip.vehicle.make} {trip.vehicle.model}
                  </Text>
                  <Text style={styles.vehicleDesc}>
                    {trip.seatsAvailable} seats • {trip.vehicle.color}
                  </Text>
                </View>
                <View style={styles.vehiclePriceWrap}>
                  <Text style={styles.vehiclePrice}>{formatRwf(trip.pricePerSeat)}</Text>
                  <Text style={styles.vehiclePriceUnit}>seat</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Seat map */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.seatHeader}>
              <Text style={styles.seatHeaderTitle}>
                {trip.vehicle.make} {trip.vehicle.model}
              </Text>
              <View style={styles.seatHeaderBadge}>
                <Ionicons name="people" size={12} color={PASSENGER_BRAND} />
                <Text style={styles.seatHeaderBadgeText}>{trip.seatsAvailable} Total Seats</Text>
              </View>
            </View>
            {renderSeatMap()}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendFree]} />
                <Text style={styles.legendText}>Free</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendPicked]} />
                <Text style={styles.legendText}>Picked</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendStaff]} />
                <Text style={styles.legendText}>Staff</Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIconWrap}>
                <Ionicons name="shield-checkmark" size={40} color={colors.success} />
              </View>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <Text style={styles.summarySub}>Everything looks great!</Text>
            </View>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Vehicle Class</Text>
                <Text style={styles.summaryValue}>
                  {trip.vehicle.make} {trip.vehicle.model}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Selected Seats</Text>
                <Text style={[styles.summaryValue, styles.summaryValueBrand]}>
                  {selectedSeats.map((s) => s.replace('s-', '#')).join(', ')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pricing Breakdown</Text>
                <Text style={styles.summaryValue}>
                  {formatRwf(trip.pricePerSeat)} × {selectedSeats.length}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                <Text style={styles.summaryTotalPrice}>{formatRwf(totalPrice)}</Text>
              </View>
            </View>
            <View style={styles.paymentSection}>
              <Text style={styles.paymentLabel}>Payment method</Text>
              <PaymentMethodIcons
                methods={trip.paymentMethods}
                selected={paymentMethod}
                onSelect={setPaymentMethod}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        {step === 1 && (
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => setStep(2)}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaPrimaryText}>Configure Trip</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {step === 2 && (
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>{formatRwf(totalPrice)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.ctaContinue, selectedSeats.length === 0 && styles.ctaContinueDisabled]}
              onPress={() => setStep(3)}
              disabled={selectedSeats.length === 0}
              activeOpacity={0.9}
            >
              <Text style={styles.ctaContinueText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
        {step === 3 && (
          <TouchableOpacity
            style={[styles.ctaPayment, isBooking && styles.ctaPaymentDisabled]}
            onPress={handleCompletePayment}
            disabled={isBooking || paymentMethod == null}
            activeOpacity={0.9}
          >
            {isBooking ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.ctaPaymentText}>Processing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.ctaPaymentText}>Complete Payment</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PASSENGER_BG_LIGHT },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  headerBtn: { padding: spacing.sm, marginLeft: -spacing.sm },
  headerBtnInvisible: { opacity: 0 },
  headerTitle: {
    ...typography.body,
    fontWeight: '700',
    color: PASSENGER_DARK,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 200 },
  stepContent: { paddingBottom: spacing.xl },

  // Step 1
  infoCard: {
    backgroundColor: PASSENGER_BRAND,
    borderRadius: 28,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(23,28,34,0.8)',
    marginBottom: 4,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: PASSENGER_DARK,
    marginLeft: 8,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PASSENGER_DARK,
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.xl * 2,
    marginTop: spacing.sm,
  },
  infoSub: { fontSize: 14, fontWeight: '600', color: PASSENGER_DARK },
  infoBlob: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  vehicleSection: { marginTop: spacing.sm },
  vehicleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  vehicleSectionTitle: { ...typography.body, fontWeight: '700', color: PASSENGER_DARK },
  vehicleSectionBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: PASSENGER_BRAND,
    letterSpacing: 1,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  vehicleCardSelected: {
    borderColor: PASSENGER_BRAND,
    backgroundColor: 'rgba(0,175,245,0.06)',
  },
  vehicleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: PASSENGER_BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  vehicleTextWrap: { flex: 1 },
  vehicleName: { ...typography.body, fontWeight: '700', color: PASSENGER_DARK },
  vehicleDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  vehiclePriceWrap: { alignItems: 'flex-end' },
  vehiclePrice: { ...typography.body, fontWeight: '800', color: PASSENGER_DARK },
  vehiclePriceUnit: { fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },

  // Step 2
  seatHeader: { alignItems: 'center', marginBottom: spacing.md },
  seatHeaderTitle: { ...typography.body, fontWeight: '700', color: PASSENGER_DARK, fontSize: 18 },
  seatHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,175,245,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
  },
  seatHeaderBadgeText: { fontSize: 10, fontWeight: '700', color: PASSENGER_BRAND, letterSpacing: 0.5 },
  seatMapContainer: {
    backgroundColor: PASSENGER_BG_LIGHT,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.08)',
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    maxHeight: 420,
  },
  windshield: {
    width: 80,
    height: 6,
    backgroundColor: colors.textMuted,
    borderRadius: 3,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  seatBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatBtnSelected: {
    backgroundColor: PASSENGER_BRAND,
    borderColor: PASSENGER_BRAND,
  },
  rearMarker: {
    width: 64,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginTop: spacing.md,
    opacity: 0.5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl * 2,
    paddingVertical: spacing.sm,
  },
  legendItem: { alignItems: 'center', gap: 6 },
  legendBox: { width: 12, height: 12, borderRadius: 3 },
  legendFree: { backgroundColor: '#fff', borderWidth: 2, borderColor: 'rgba(0,0,0,0.15)' },
  legendPicked: { backgroundColor: PASSENGER_BRAND },
  legendStaff: { backgroundColor: 'rgba(0,0,0,0.12)' },
  legendText: { fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },

  // Step 3
  summaryHeader: { alignItems: 'center', marginBottom: spacing.lg },
  summaryIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46,125,50,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  summaryTitle: { ...typography.h2, fontWeight: '700', color: PASSENGER_DARK, marginBottom: 4 },
  summarySub: { ...typography.bodySmall, color: colors.textSecondary },
  summaryBox: {
    backgroundColor: PASSENGER_BG_LIGHT,
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  summaryRowTotal: {
    borderBottomWidth: 0,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  summaryLabel: { ...typography.bodySmall, color: colors.textSecondary },
  summaryValue: { ...typography.body, fontWeight: '700', color: PASSENGER_DARK },
  summaryValueBrand: { color: PASSENGER_BRAND },
  summaryTotalLabel: { ...typography.body, fontWeight: '800', color: PASSENGER_DARK },
  summaryTotalPrice: { fontSize: 22, fontWeight: '800', color: PASSENGER_BRAND },
  paymentSection: { marginTop: spacing.sm },
  paymentLabel: { ...typography.body, fontWeight: '600', color: PASSENGER_DARK, marginBottom: spacing.sm },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    backgroundColor: PASSENGER_DARK,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  subtotalLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  subtotalValue: { fontSize: 20, fontWeight: '800', color: PASSENGER_DARK },
  ctaContinue: {
    flex: 1,
    height: 56,
    backgroundColor: PASSENGER_BRAND,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PASSENGER_BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaContinueDisabled: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    shadowOpacity: 0,
  },
  ctaContinueText: { fontSize: 16, fontWeight: '700', color: PASSENGER_DARK },
  ctaPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    backgroundColor: colors.success,
    borderRadius: 20,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaPaymentDisabled: { opacity: 0.8 },
  ctaPaymentText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  homeIndicator: {
    width: 128,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
});
