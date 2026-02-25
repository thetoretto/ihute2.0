import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { getTripsStore, getTrip } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, radii, buttonHeights } from '../../utils/theme';
import { formatRwf } from '../../../../shared/src';
import type { Trip } from '../../types';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/e2426e2f-6eb8-4ea6-91af-e79e0dbac3a5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'91e267'},body:JSON.stringify({sessionId:'91e267',location:'RideDetailScreen.tsx:after-import',message:'theme import',data:{hasButtonHeights:typeof buttonHeights!=='undefined'},timestamp:Date.now(),hypothesisId:'H1',runId:'post-fix'})}).catch(()=>{});
// #endregion

const PASSENGER_BRAND = colors.passengerBrand;
const PASSENGER_DARK = colors.passengerDark;
const PASSENGER_BG_LIGHT = colors.passengerBgLight;

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

  const openBooking = () => {
    if (!requireProfileForBooking()) return;
    navigation.navigate('PassengerBooking', { tripId: trip.id });
  };

  return (
    <Screen scroll style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="navigate" size={18} color={PASSENGER_BRAND} />
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
            <Ionicons name="people-outline" size={14} color={PASSENGER_BRAND} />
            <Text style={styles.metaChipText}>{trip.seatsAvailable} seats left</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="flash-outline" size={14} color={PASSENGER_BRAND} />
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
              <Text style={styles.ratingBrand}>
                <Ionicons name="star" size={12} color={PASSENGER_BRAND} /> {trip.driver.rating} Rating
              </Text>
            )}
          </View>
        </View>
        <View style={styles.vehicle}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car-sport-outline" size={16} color={PASSENGER_BRAND} />
            <Text style={styles.sectionSubTitle}>Vehicle</Text>
          </View>
          <Text style={styles.vehicleText}>
            {trip.vehicle.make} {trip.vehicle.model} ({trip.vehicle.color})
          </Text>
        </View>
        <Text style={styles.price}>{formatRwf(trip.pricePerSeat)} <Text style={styles.perSeat}>per seat</Text></Text>
      </View>
      {!isFull && (
        <>
          <TouchableOpacity style={styles.bookBtn} onPress={openBooking} activeOpacity={0.85}>
            <Text style={styles.bookBtnText}>Book seat(s)</Text>
          </TouchableOpacity>
          {trip.allowFullCar && trip.seatsAvailable > 1 && (
            <TouchableOpacity
              style={styles.bookFullBtn}
              onPress={openBooking}
              activeOpacity={0.85}
            >
              <Text style={styles.bookFullBtnText}>Book full car</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + 80,
    paddingHorizontal: spacing.lg,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { ...typography.body, color: colors.error },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.body, color: PASSENGER_DARK, fontWeight: '700' },
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
    backgroundColor: PASSENGER_BG_LIGHT,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  metaChipText: { ...typography.caption, color: colors.text },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  avatar: { width: 56, height: 56, borderRadius: 18 },
  avatarPlaceholder: {
    backgroundColor: PASSENGER_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfo: { flex: 1 },
  driverName: { ...typography.h3, color: PASSENGER_DARK, fontWeight: '800', fontSize: 18 },
  ratingBrand: { ...typography.caption, color: PASSENGER_BRAND, fontWeight: '700', marginTop: 2 },
  vehicle: { marginBottom: spacing.md },
  vehicleText: { ...typography.bodySmall, color: colors.textSecondary },
  price: { ...typography.h2, color: PASSENGER_BRAND, fontWeight: '800', fontSize: 22, marginBottom: spacing.sm },
  perSeat: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  bookBtn: {
    backgroundColor: PASSENGER_DARK,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bookBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  bookFullBtn: {
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: PASSENGER_BRAND,
  },
  bookFullBtnText: { fontSize: 16, fontWeight: '700', color: PASSENGER_BRAND },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,71,82,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 40,
  },
  modalHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: { ...typography.h2, color: PASSENGER_DARK, fontWeight: '800', marginBottom: spacing.lg },
  modalDriverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  modalAvatar: { width: 64, height: 64, borderRadius: 20 },
  modalAvatarPlc: {
    backgroundColor: PASSENGER_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDriverInfo: { flex: 1 },
  modalDriverName: { ...typography.h3, color: PASSENGER_DARK, fontWeight: '800', fontSize: 18 },
  modalRating: { ...typography.bodySmall, color: PASSENGER_BRAND, fontWeight: '700', marginTop: 2 },
  modalSummaryBox: {
    backgroundColor: PASSENGER_BG_LIGHT,
    borderRadius: 24,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalSummaryLabel: { ...typography.body, color: colors.textSecondary },
  modalSummaryValue: { ...typography.body, color: colors.text, fontWeight: '700' },
  modalSummaryRowTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: 0,
  },
  modalSummaryTotal: { ...typography.body, color: colors.text, fontWeight: '800' },
  modalSummaryPrice: { ...typography.h2, color: PASSENGER_BRAND, fontWeight: '800', fontSize: 22 },
  modalSeatsLabel: { ...typography.body, color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    minHeight: buttonHeights.medium,
    borderWidth: 0,
    backgroundColor: PASSENGER_BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: { ...typography.h2, color: '#fff' },
  stepperValue: { ...typography.h1, color: colors.text },
  modalSub: { ...typography.body, color: colors.text, marginBottom: spacing.sm },
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
  confirmBtn: {
    backgroundColor: PASSENGER_BRAND,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    shadowColor: PASSENGER_BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  confirmBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  goBackBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  goBackText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
});
