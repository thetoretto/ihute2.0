import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, PaymentMethodIcons, RatingDisplay, Screen } from '../../components';
import { getTripsStore } from '../../services/mockData';
import { bookTrip } from '../../services/mockApi';
import { useAuth } from '../../context/AuthContext';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';
import { formatRwf } from '../../../../shared/src';
import type { PaymentMethod, Trip } from '../../types';

type Params = {
  RideDetail: { tripId: string };
};

export default function RideDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Params, 'RideDetail'>>();
  const { user, isProfileComplete } = useAuth();
  const [trip, setTrip] = useState<Trip | undefined>(
    () => getTripsStore().find((t) => t.id === route.params.tripId)
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [seats, setSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const store = getTripsStore();
    const t = store.find((x) => x.id === route.params.tripId);
    setTrip(t);
  }, [route.params.tripId]);

  if (!trip) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.error}>Trip not found</Text>
      </Screen>
    );
  }

  const isFull = trip.status === 'full';

  const requireProfileForBooking = (): boolean => {
    if (!user) return false;
    if (!isProfileComplete) {
      Alert.alert(
        'Complete your profile',
        'You need to complete your profile (email and password) before you can make a booking.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to profile',
            onPress: () => (navigation.getParent() as any)?.navigate('PassengerProfile'),
          },
        ]
      );
      return false;
    }
    return true;
  };

  const handleBook = async () => {
    if (!user || paymentMethod == null || isProcessingPayment) {
      Alert.alert('Select a payment method');
      return;
    }
    if (!requireProfileForBooking()) return;
    if (seats < 1 || seats > trip.seatsAvailable) {
      Alert.alert('Invalid seats', `Choose between 1 and ${trip.seatsAvailable} seats.`);
      return;
    }
    try {
      setIsProcessingPayment(true);
      const booking = await bookTrip({
        tripId: trip.id,
        passenger: user,
        seats,
        paymentMethod,
        isFullCar: seats >= trip.seatsAvailable,
      });
      const updatedTrip = getTripsStore().find((x) => x.id === route.params.tripId);
      setTrip(updatedTrip);
      setSeats(1);
      setPaymentMethod(undefined);
      setModalVisible(false);
      const paymentMessage =
        paymentMethod === 'cash'
          ? 'Cash payment reserved for pickup'
          : paymentMethod === 'mobile_money'
            ? 'Mobile money payment approved'
            : 'Card payment approved';
      Alert.alert('Booking confirmed', `${paymentMessage}. Ticket generated successfully.`, [
        {
          text: 'View ticket',
          onPress: () => navigation.navigate('TicketDetail', { bookingId: booking.id }),
        },
        {
          text: 'Activities',
          onPress: () => (navigation.getParent() as any)?.navigate('PassengerBookings'),
        },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not complete booking');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <Screen scroll style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="navigate" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Trip route</Text>
        </View>
        <View style={styles.route}>
          <Text style={styles.time}>{trip.departureTime}</Text>
          <Text style={styles.location}>{trip.departureHotpoint.name}</Text>
          <Text style={styles.duration}>
            {trip.durationMinutes
              ? `${Math.floor(trip.durationMinutes / 60)}h ${trip.durationMinutes % 60}min`
              : '—'}
          </Text>
          <Text style={styles.time}>{trip.arrivalTime}</Text>
          <Text style={styles.location}>{trip.destinationHotpoint.name}</Text>
        </View>
        <View style={styles.metaChips}>
          <View style={styles.metaChip}>
            <Ionicons name="people-outline" size={14} color={colors.primary} />
            <Text style={styles.metaChipText}>{trip.seatsAvailable} seats left</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="flash-outline" size={14} color={colors.primary} />
            <Text style={styles.metaChipText}>
              {trip.type === 'insta' ? 'Instant' : 'Scheduled'}
            </Text>
          </View>
        </View>
        <View style={styles.driverRow}>
          {trip.driver.avatarUri ? (
            <Image source={{ uri: trip.driver.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{trip.driver.name}</Text>
            {trip.driver.rating != null && (
              <RatingDisplay rating={trip.driver.rating} textStyle={styles.rating} />
            )}
          </View>
        </View>
        <View style={styles.vehicle}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car-sport-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionSubTitle}>Vehicle</Text>
          </View>
          <Text style={styles.vehicleText}>
            {trip.vehicle.make} {trip.vehicle.model} ({trip.vehicle.color})
          </Text>
        </View>
        <Text style={styles.price}>{formatRwf(trip.pricePerSeat)} per seat</Text>
        <PaymentMethodIcons
          methods={trip.paymentMethods}
          selected={paymentMethod}
          onSelect={setPaymentMethod}
        />
      </View>
      {!isFull && (
        <>
          <Button
            title="Book seat(s)"
            onPress={() => {
              if (!requireProfileForBooking()) return;
              setModalVisible(true);
            }}
          />
          {trip.allowFullCar && trip.seatsAvailable > 1 && (
            <Button
              title="Book full car"
              variant="outline"
              onPress={() => {
                if (!requireProfileForBooking()) return;
                setSeats(trip.seatsAvailable);
                setModalVisible(true);
              }}
              style={styles.secondaryBtn}
            />
          )}
        </>
      )}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Number of seats</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setSeats((s) => Math.max(1, s - 1))}
              >
                <Text style={styles.stepperText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{seats}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setSeats((s) => Math.min(trip.seatsAvailable, s + 1))}
              >
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Payment method</Text>
            <PaymentMethodIcons
              methods={trip.paymentMethods}
              selected={paymentMethod}
              onSelect={setPaymentMethod}
            />
            <View style={styles.bookingSummary}>
              <Text style={styles.summaryText}>Seats: {seats}</Text>
              <Text style={styles.summaryText}>Total: {formatRwf(seats * trip.pricePerSeat)}</Text>
              <Text style={styles.summaryText}>
                Payment: {paymentMethod ? paymentMethod.replace('_', ' ') : 'Not selected'}
              </Text>
            </View>
            <Button
              title={isProcessingPayment ? 'Processing payment...' : 'Confirm'}
              onPress={handleBook}
              disabled={isProcessingPayment || paymentMethod == null}
            />
            {isProcessingPayment ? (
              <View style={styles.processingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.processingText}>Finalizing mock payment...</Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { ...typography.body, color: colors.error },
  card: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.body, color: colors.text, fontWeight: '700' },
  sectionSubTitle: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  route: { marginBottom: spacing.md },
  time: { ...typography.body, color: colors.text, fontWeight: '600' },
  location: { ...typography.bodySmall, color: colors.textSecondary },
  duration: { ...typography.caption, color: colors.textMuted, marginVertical: spacing.xs },
  metaChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metaChipText: { ...typography.caption, color: colors.text },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfo: { flex: 1 },
  driverName: { ...typography.h3, color: colors.text },
  rating: { ...typography.caption, color: colors.textSecondary },
  vehicle: { marginBottom: spacing.md },
  vehicleText: { ...typography.bodySmall, color: colors.textSecondary },
  price: { ...typography.h2, color: colors.success, marginBottom: spacing.md },
  secondaryBtn: { marginTop: spacing.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
  },
  modalTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    minHeight: buttonHeights.medium,
    borderWidth: 1,
    borderColor: colors.primaryButtonBorder,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: { ...typography.h2, color: colors.onPrimary },
  stepperValue: { ...typography.h1, color: colors.text },
  modalSub: { ...typography.body, color: colors.text, marginBottom: spacing.sm },
  bookingSummary: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  summaryText: { ...typography.caption, color: colors.textSecondary },
  processingRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  processingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cancelBtn: {
    marginTop: spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cancelText: { ...typography.body, color: colors.onPrimary, textAlign: 'center' },
});
