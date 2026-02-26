import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { getTripsStore, getTrip } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { colors, spacing, typography, radii, buttonHeights } from '../../utils/theme';
import { screenContentPadding } from '../../utils/layout';
import { formatRwf } from '../../../../shared/src';
import { openWhatsAppDispute } from '../../utils/whatsapp';
import { strings } from '../../constants/strings';
import type { Trip } from '../../types';

type Params = {
  RideDetail: { tripId: string };
};

export default function RideDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Params, 'RideDetail'>>();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
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
        <Text style={[styles.error, { color: c.error }]}>Trip not found</Text>
      </Screen>
    );
  }

  const isFull = trip.status === 'full';
  const departureDateLabel = trip.departureDate
    ? new Date(trip.departureDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Today';

  const requireProfileForBooking = (): boolean => {
    if (!user) return false;
    if (!isProfileComplete) {
      Alert.alert(
        'Complete your profile',
        'You need to complete your profile before you can make a booking.',
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
    <View style={[styles.container, { backgroundColor: c.card }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.borderLight, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={12} accessibilityLabel="Go back">
          <View style={[styles.headerBtnInner, { backgroundColor: c.background || c.ghostBg }]}>
            <Ionicons name="chevron-back" size={20} color={c.text} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Trip Details</Text>
        <TouchableOpacity style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="information-circle-outline" size={20} color={c.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Route timeline */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineLeft}>
            <View style={styles.timelineDotsWrap}>
              <View style={[styles.timelineDashed, { borderColor: c.border }]} />
              <View style={[styles.timelineDot, styles.timelineDotTop, { backgroundColor: c.primary }]} />
              <View style={[styles.timelineDot, styles.timelineDotBottom, { backgroundColor: c.primary }]} />
            </View>
            <View style={styles.timelineLabels}>
              <View style={styles.timelineItem}>
                <Text style={[styles.timelineTime, { color: c.text }]}>{trip.departureTime.slice(0, 5)}</Text>
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

        <View style={[styles.divider, { backgroundColor: c.borderLight }]} />

        {/* Driver block */}
        <View style={styles.driverSection}>
          <View style={styles.driverLeft}>
            <View style={styles.avatarWrap}>
              {trip.driver.avatarUri ? (
                <Image source={{ uri: trip.driver.avatarUri }} style={styles.driverAvatar} />
              ) : (
                <View style={[styles.driverAvatar, styles.avatarPlaceholder, { backgroundColor: c.background || c.ghostBg }]}>
                  <Ionicons name="person" size={28} color={c.textMuted} />
                </View>
              )}
              <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
                <Ionicons name="shield-checkmark" size={12} color="#fff" />
              </View>
            </View>
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: c.text }]}>{trip.driver.name}</Text>
              {trip.driver.rating != null && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color={c.primary} />
                  <Text style={[styles.ratingText, { color: c.text }]}> {trip.driver.rating} </Text>
                  <Text style={[styles.reviewsText, { color: c.textMuted }]}>(reviews)</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.driverActions}>
            <TouchableOpacity style={[styles.messageBtn, { backgroundColor: c.primaryTint }]} activeOpacity={0.8}>
              <Ionicons name="chatbubble-outline" size={20} color={c.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.disputeBtn, { backgroundColor: c.primaryTint }]}
              activeOpacity={0.8}
              accessibilityLabel={strings.profile.disputeViaWhatsApp}
              onPress={() =>
                openWhatsAppDispute({
                  otherUserId: trip.driver.id,
                  otherUserName: trip.driver.name,
                  tripId: trip.id,
                })
              }
            >
              <Ionicons name="logo-whatsapp" size={20} color={c.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info block */}
        <View style={[styles.infoBlock, { backgroundColor: c.background || c.ghostBg }]}>
          <View style={[styles.infoRow, { marginBottom: spacing.sm }]}>
            <Ionicons name="time-outline" size={18} color={c.textMuted} />
            <Text style={[styles.infoText, { color: c.text }]}>Departure: {departureDateLabel}, {trip.departureTime.slice(0, 5)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={18} color={c.textMuted} />
            <Text style={[styles.infoText, { color: c.text }]}>{trip.seatsAvailable} seats available</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      {!isFull && (
        <View style={[styles.footer, { backgroundColor: c.card, borderTopColor: c.borderLight, paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={[styles.bookBtn, { backgroundColor: c.primary }]}
            onPress={openBooking}
            activeOpacity={0.9}
          >
            <Text style={[styles.bookBtnText, { color: c.passengerOnBrand || c.text }]}>Book Seats</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { ...typography.body },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenContentPadding,
    paddingVertical: spacing.md,
    minHeight: 56,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: spacing.xs, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  headerBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.bodySmall, fontWeight: '800' },
  scroll: { flex: 1 },
  content: { padding: screenContentPadding },
  timelineSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  timelineLeft: { flexDirection: 'row', flex: 1, minWidth: 0 },
  timelineDotsWrap: {
    width: 24,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.card,
    position: 'absolute',
    left: 6,
  },
  timelineDotTop: { top: 0 },
  timelineDotBottom: { bottom: 0 },
  timelineLabels: { flex: 1, minWidth: 0 },
  timelineItem: { marginBottom: spacing.lg },
  timelineTime: { ...typography.h3, fontSize: 20, fontWeight: '800' },
  timelinePlace: { ...typography.bodySmall, fontWeight: '600', marginTop: 2 },
  timelinePriceWrap: { alignItems: 'flex-end' },
  timelinePrice: { ...typography.h2, fontSize: 24, fontWeight: '800' },
  perSeatLabel: { ...typography.caption, fontWeight: '800', textTransform: 'uppercase', fontSize: 10, marginTop: 2 },
  divider: { height: 1, marginBottom: spacing.lg },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  driverLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  avatarWrap: { position: 'relative', marginRight: spacing.md },
  driverAvatar: { width: 56, height: 56, borderRadius: 16 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    padding: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.card,
  },
  driverInfo: { flex: 1, minWidth: 0 },
  driverName: { ...typography.h3, fontWeight: '800', fontSize: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { ...typography.caption, fontWeight: '700', fontSize: 12 },
  reviewsText: { ...typography.caption, fontSize: 12 },
  driverActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  messageBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disputeBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlock: {
    borderRadius: 24,
    padding: spacing.md,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { ...typography.bodySmall, fontWeight: '600', flex: 1 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: screenContentPadding,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  bookBtn: {
    minHeight: buttonHeights.large + 4,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: { ...typography.body, fontWeight: '800', fontSize: 16 },
});
