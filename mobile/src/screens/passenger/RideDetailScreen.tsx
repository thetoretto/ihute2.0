import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { getTripsStore, getTrip } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, typography, radii, buttonHeights, sizes, borderWidths } from '../../utils/theme';
import { landingHeaderPaddingHorizontal, listScreenHeaderPaddingVertical, timelineDotSizeLg, contentBottomPaddingWithFooter } from '../../utils/layout';
import { sharedStyles } from '../../utils/sharedStyles';
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={spacing.sm} accessibilityLabel="Go back">
          <View style={[sharedStyles.headerIconBtn, { backgroundColor: c.background || c.ghostBg }]}>
            <Ionicons name="chevron-back" size={sizes.icon.medium} color={c.text} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Trip Details</Text>
        <TouchableOpacity style={styles.headerBtn} hitSlop={spacing.sm}>
          <Ionicons name="information-circle-outline" size={sizes.icon.medium} color={c.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPaddingWithFooter }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip type label */}
        <View style={[styles.typeBadgeWrap, { backgroundColor: trip.type === 'insta' ? c.primaryTint : c.surface }]}>
          {trip.type === 'insta' ? (
            <Ionicons name="flash" size={sizes.icon.mid} color={c.primary} style={styles.typeBadgeIcon} />
          ) : null}
          <Text style={[styles.typeBadgeText, { color: trip.type === 'insta' ? c.primary : c.textSecondary }]}>
            {trip.type === 'insta' ? 'Instant ride' : 'Scheduled ride'}
          </Text>
        </View>

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
                <View style={[styles.driverAvatar, sharedStyles.avatarPlaceholder, { backgroundColor: c.background || c.ghostBg }]}>
                  <Ionicons name="person" size={sizes.icon.large} color={c.textMuted} />
                </View>
              )}
              <View style={[styles.verifiedBadge, { backgroundColor: c.success, borderColor: c.card }]}>
                <Ionicons name="shield-checkmark" size={sizes.icon.small} color={c.onAccent} />
              </View>
            </View>
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: c.text }]}>{trip.driver.name}</Text>
              {trip.driver.rating != null && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={sizes.icon.small} color={c.primary} />
                  <Text style={[styles.ratingText, { color: c.text }]}> {trip.driver.rating} </Text>
                  <Text style={[styles.reviewsText, { color: c.textMuted }]}>(reviews)</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.driverActions}>
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
              <Ionicons name="logo-whatsapp" size={sizes.icon.medium} color={c.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info block */}
        <View style={[styles.infoBlock, { backgroundColor: c.background || c.ghostBg }]}>
          <View style={[styles.infoRow, { marginBottom: spacing.sm }]}>
            <Ionicons name="time-outline" size={sizes.icon.medium} color={c.textMuted} />
            <Text style={[styles.infoText, { color: c.text }]}>Departure: {departureDateLabel}, {trip.departureTime.slice(0, 5)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={sizes.icon.medium} color={c.textMuted} />
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
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingVertical: spacing.md,
    minHeight: sizes.avatar.xl,
    borderBottomWidth: borderWidths.thin,
  },
  headerBtn: {
    padding: spacing.xs,
    minWidth: sizes.touchTarget.min,
    minHeight: sizes.touchTarget.min,
    justifyContent: 'center',
  },
  headerTitle: { ...typography.body, fontWeight: '800' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: landingHeaderPaddingHorizontal, paddingTop: listScreenHeaderPaddingVertical, paddingBottom: spacing.xl },
  typeBadgeWrap: {
    ...sharedStyles.chip,
    alignSelf: 'flex-start',
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  typeBadgeIcon: { marginRight: spacing.xs + 2 },
  typeBadgeText: { ...typography.caption, fontWeight: '800' },
  timelineSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  timelineLeft: { flexDirection: 'row', flex: 1, minWidth: 0 },
  timelineDotsWrap: {
    width: timelineDotSizeLg + spacing.md,
    marginRight: spacing.sm,
    position: 'relative',
    alignItems: 'center',
  },
  timelineDashed: {
    position: 'absolute',
    left: timelineDotSizeLg / 2 + borderWidths.thin,
    top: spacing.xs,
    bottom: spacing.xs,
    width: 0,
    borderLeftWidth: borderWidths.medium,
    borderStyle: 'dashed',
  },
  timelineDot: {
    width: timelineDotSizeLg,
    height: timelineDotSizeLg,
    borderRadius: timelineDotSizeLg / 2,
    borderWidth: borderWidths.medium,
    position: 'absolute',
    left: spacing.xs + 2,
  },
  timelineDotTop: { top: 0 },
  timelineDotBottom: { bottom: 0 },
  timelineLabels: { flex: 1, minWidth: 0 },
  timelineItem: { marginBottom: spacing.lg },
  timelineTime: typography.time,
  timelinePlace: { ...typography.bodySmall, fontWeight: '600', marginTop: spacing.xs },
  timelinePriceWrap: { alignItems: 'flex-end' },
  timelinePrice: typography.timeLg,
  perSeatLabel: { ...typography.overline, marginTop: spacing.xs },
  divider: { ...sharedStyles.divider, marginBottom: spacing.lg },
  driverSection: {
    ...sharedStyles.listRowBetween,
    marginBottom: spacing.lg,
  },
  driverLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  avatarWrap: { position: 'relative', marginRight: spacing.md },
  driverAvatar: { ...sharedStyles.avatarXl, borderRadius: radii.md },
  verifiedBadge: {
    position: 'absolute',
    bottom: -spacing.xs,
    right: -spacing.xs,
    padding: borderWidths.medium,
    borderRadius: radii.sm,
    borderWidth: borderWidths.medium,
  },
  driverInfo: { flex: 1, minWidth: 0 },
  driverName: typography.driverNameLg,
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  ratingText: typography.captionBold,
  reviewsText: typography.caption,
  driverActions: { ...sharedStyles.listRow },
  disputeBtn: sharedStyles.actionButton,
  infoBlock: { ...sharedStyles.panel },
  infoRow: { ...sharedStyles.listRow },
  infoText: { ...typography.bodySmall, fontWeight: '600', flex: 1 },
  footer: {
    ...sharedStyles.footerBar,
  },
  bookBtn: {
    minHeight: buttonHeights.large + spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: typography.bodyBold,
});
