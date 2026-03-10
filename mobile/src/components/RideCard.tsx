import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { useRoleTheme } from '../context/RoleThemeContext';
import { spacing, radii, typography, sizes, borderWidths, getStatusColorKey, getStatusTintKey } from '../utils/theme';
import { panelRadius, cardRadiusLarge } from '../utils/layout';
import { sharedStyles } from '../utils/sharedStyles';
import { formatRwf } from '../../../shared/src';
import RatingDisplay from './RatingDisplay';
import type { Trip } from '../types';

/** Map trip status to spec labels: Seat Booked, Car Full, Canceled, Completed. */
export function getTripStatusLabel(status: Trip['status'], hasBookings?: boolean): string {
  switch (status) {
    case 'full':
      return 'Car Full';
    case 'cancelled':
      return 'Canceled';
    case 'completed':
      return 'Completed';
    case 'active':
      return hasBookings ? 'Seat Booked' : 'Active';
    default:
      return status ?? 'Active';
  }
}

interface RideCardProps {
  trip: Trip;
  onPress: () => void;
  variant?: 'default' | 'compact' | 'blablacar' | 'searchResults' | 'dashboard';
  /** Override role-based accent; if not set, uses current role from RoleThemeContext. */
  userType?: 'passenger' | 'driver' | 'agency';
  /** When true, active trip shows "Seat Booked" and uses pending status color. */
  hasBookings?: boolean;
}

export default function RideCard({ trip, onPress, variant = 'default', userType: userTypeProp, hasBookings }: RideCardProps) {
  const c = useThemeColors();
  const roleTheme = useRoleTheme();
  const isFull = trip.status === 'full';
  const statusLabel = getTripStatusLabel(trip.status, hasBookings);
  const statusKey = getStatusColorKey(trip.status, { hasBookings });
  const statusBg = c[getStatusTintKey(statusKey)] as string;
  const statusColor = c[statusKey] as string;
  const accent = roleTheme.primary;
  const accentSecondary = roleTheme.accent;
  const scale = React.useRef(new Animated.Value(1)).current;
  const compact = variant === 'compact';
  const blablacar = variant === 'blablacar';
  const searchResults = variant === 'searchResults';
  const dashboard = variant === 'dashboard';

  const animatePressIn = () => {
    Animated.timing(scale, {
      toValue: 1.02,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const animatePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const durationStr = trip.durationMinutes
    ? (() => {
        const h = Math.floor(trip.durationMinutes / 60);
        const m = trip.durationMinutes % 60;
        if (h === 0) return `${m} min`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}`;
      })()
    : '—';

  if (searchResults) {
    const verified = trip.driver.rating != null && trip.driver.rating >= 4.8;
    const vehicleLabel = trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : '—';
    return (
      <Animated.View style={[styles.searchResultsWrapper, { transform: [{ scale }] }]}>
        <TouchableOpacity
          style={[
            styles.card,
            styles.cardSearchResults,
            { backgroundColor: c.card, borderColor: isFull ? c.border : c.borderLight },
          ]}
          onPress={onPress}
          disabled={isFull}
          activeOpacity={0.98}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
        >
          {/* Header: Driver & Price (template row 1) */}
          <View style={styles.searchResultsTop}>
            <View style={styles.searchResultsDriverLeft}>
              <View style={styles.searchResultsAvatarWrap}>
                {trip.driver.avatarUri ? (
                  <Image source={{ uri: trip.driver.avatarUri }} style={styles.searchResultsAvatarTemplate} />
                ) : (
                  <View style={[styles.searchResultsAvatarTemplate, styles.searchResultsAvatarPlc, { backgroundColor: c.surface }]}>
                    <Ionicons name="person" size={sizes.icon.medium} color={c.textMuted} />
                  </View>
                )}
                {verified && (
                  <View style={[styles.searchResultsVerifiedBadge, { backgroundColor: c.statusCompleted }]}>
                    <Ionicons name="shield-checkmark" size={10} color={c.onAccent ?? '#FFF'} />
                  </View>
                )}
              </View>
              <View style={styles.searchResultsDriverInfo}>
                <Text style={[styles.searchResultsDriverName, { color: c.text }]} numberOfLines={1}>
                  {trip.driver.name}
                </Text>
                {trip.driver.rating != null && (
                  <View style={[styles.searchResultsRatingPill, { backgroundColor: c.surface }]}>
                    <Ionicons name="star" size={9} color={accent} style={styles.searchResultsStarIcon} />
                    <Text style={[styles.searchResultsRating, { color: c.textMuted }]}>{trip.driver.rating}</Text>
                    <Text style={[styles.searchResultsRatingSep, { color: c.border }]}> | </Text>
                    <Text style={[styles.searchResultsRating, { color: c.textMuted }]}>—</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.searchResultsPriceBlock}>
              <Text style={[styles.searchResultsPriceMain, { color: accent }]}>{formatRwf(trip.pricePerSeat)}</Text>
              {trip.type === 'insta' && (
                <View style={styles.searchResultsInstantRow}>
                  <Ionicons name="flash" size={9} color={accent} />
                  <Text style={[styles.searchResultsInstantText, { color: accent }]}>Instant</Text>
                </View>
              )}
            </View>
          </View>

          {/* Timeline: dep → arr + duration + car (template row 2) */}
          <View style={styles.searchResultsTimelineRow}>
            <View style={styles.searchResultsTimelineCol}>
              <View style={[styles.searchResultsDotSmall, { borderColor: accent, backgroundColor: c.card }]} />
              <View style={[styles.searchResultsLine, { backgroundColor: accent }]} />
              <View style={[styles.searchResultsDotSmall, styles.searchResultsDotBottom, { borderColor: c.borderLight, backgroundColor: c.card }]} />
            </View>
            <View style={styles.searchResultsTimelineContent}>
              <View style={styles.searchResultsTimelineItem}>
                <View>
                  <Text style={[styles.searchResultsTimeBold, { color: c.text }]}>{trip.departureTime.slice(0, 5)}</Text>
                  <Text style={[styles.searchResultsPlaceSub, { color: c.textMuted }]} numberOfLines={1}>{trip.departureHotpoint.name}</Text>
                </View>
                <View style={[styles.searchResultsDurationPill, { backgroundColor: c.surface }]}>
                  <Ionicons name="time-outline" size={9} color={c.textMuted} />
                  <Text style={[styles.searchResultsDurationText, { color: c.textMuted }]}>{durationStr}</Text>
                </View>
              </View>
              <View style={styles.searchResultsTimelineItem}>
                <View>
                  <Text style={[styles.searchResultsTimeBold, { color: c.text }]}>{trip.arrivalTime?.slice(0, 5) || '—'}</Text>
                  <Text style={[styles.searchResultsPlaceSub, { color: c.textMuted }]} numberOfLines={1}>{trip.destinationHotpoint.name}</Text>
                </View>
                <View style={styles.searchResultsCarRow}>
                  <Ionicons name="car-outline" size={10} color={c.textMuted} />
                  <Text style={[styles.searchResultsCarText, { color: c.textMuted }]} numberOfLines={1}>{vehicleLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer: amenities + seats (template row 3) */}
          <View style={[styles.searchResultsFooter, { borderTopColor: c.borderLight }]}>
            <View style={styles.searchResultsAmenitiesRow}>
              {trip.type === 'insta' && (
                <View style={[styles.searchResultsAmenityPill, { backgroundColor: c.surface }]}>
                  <Text style={[styles.searchResultsAmenityText, { color: c.textMuted }]}>Instant</Text>
                </View>
              )}
              <View style={[styles.searchResultsAmenityPill, { backgroundColor: c.surface }]}>
                <Ionicons name="snow-outline" size={9} color={c.textMuted} style={styles.searchResultsAmenityIcon} />
                <Text style={[styles.searchResultsAmenityText, { color: c.textMuted }]}>AC</Text>
              </View>
              <View style={[styles.searchResultsAmenityPill, { backgroundColor: c.surface }]}>
                <Text style={[styles.searchResultsAmenityText, { color: c.textMuted }]} numberOfLines={1}>{vehicleLabel}</Text>
              </View>
            </View>
            <Text style={[styles.searchResultsSeatsRight, { color: accent }]}>
              {trip.seatsAvailable} seat{trip.seatsAvailable !== 1 ? 's' : ''} left
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (dashboard) {
    const vehicleLabel = trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : 'Car';
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[
            styles.card,
            styles.cardDashboard,
            { backgroundColor: c.card, borderColor: isFull ? c.border : c.borderLight },
          ]}
          onPress={onPress}
          disabled={isFull}
          activeOpacity={0.98}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
        >
          <View style={styles.dashboardLeft}>
            {trip.driver.avatarUri ? (
              <Image source={{ uri: trip.driver.avatarUri }} style={styles.dashboardAvatar} />
            ) : (
              <View style={[styles.dashboardAvatar, styles.dashboardAvatarPlc, { backgroundColor: c.surface }]}>
                <Ionicons name="person" size={sizes.icon.medium} color={c.textMuted} />
              </View>
            )}
            <View style={styles.dashboardInfo}>
              <Text style={[styles.dashboardDriverName, { color: c.text }]} numberOfLines={1}>
                {trip.driver.name}
              </Text>
              <Text style={[styles.dashboardMeta, { color: c.textMuted }]} numberOfLines={1}>
                {vehicleLabel} • {trip.seatsAvailable} Seat{trip.seatsAvailable !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.dashboardRight}>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <Text style={[styles.dashboardPrice, { color: accent }]}>{formatRwf(trip.pricePerSeat)}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (blablacar) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[
            styles.card,
            styles.cardBlablacar,
            { backgroundColor: c.card, borderColor: isFull ? c.border : c.borderLight },
          ]}
          onPress={onPress}
          disabled={isFull}
          activeOpacity={0.92}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
        >
          <View style={styles.blablacarLeft}>
            {trip.driver.avatarUri ? (
              <Image source={{ uri: trip.driver.avatarUri }} style={styles.blablacarAvatar} />
            ) : (
              <View style={[styles.blablacarAvatar, styles.blablacarAvatarPlc]}>
                <Ionicons name="person" size={sizes.icon.medium} color={c.textMuted} />
              </View>
            )}
            <View style={styles.blablacarInfo}>
              <Text style={[styles.blablacarTime, { color: c.text }]}>{trip.departureTime.slice(0, 5)}</Text>
              <Text style={[styles.blablacarMeta, { color: c.textSecondary }]} numberOfLines={1}>
                {trip.driver.name} • {trip.vehicle?.make} {trip.vehicle?.model}
              </Text>
            </View>
          </View>
          <View style={styles.blablacarRight}>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            {isFull ? (
              <Text style={[styles.blablacarFull, { color: c.error }]}>Full</Text>
            ) : (
              <>
                <Text style={[styles.blablacarPrice, { color: accent }]}>{formatRwf(trip.pricePerSeat)}</Text>
                <Text style={[styles.blablacarPerSeat, { color: c.textMuted }]}>per seat</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: c.card, borderColor: isFull ? c.border : c.borderLight },
          compact && styles.cardCompact,
          !isFull && styles.cardEmphasis,
        ]}
        onPress={onPress}
        disabled={isFull}
        activeOpacity={0.92}
        onPressIn={animatePressIn}
        onPressOut={animatePressOut}
      >
        {/* Row 1: times, route, duration, price */}
        <View style={[styles.topRow, compact && styles.topRowCompact]}>
          <View style={styles.routeBlock}>
            <Text style={[styles.depTime, compact && styles.depTimeCompact, { color: c.text }]} numberOfLines={1}>
              {trip.departureTime.slice(0, 5)}
            </Text>
            <Text style={[styles.location, compact && styles.locationCompact, { color: c.textSecondary }]} numberOfLines={1}>
              {trip.departureHotpoint.name}
            </Text>
          </View>
          <View style={styles.durationBlock}>
            <View style={[styles.durationLine, { backgroundColor: c.border }]} />
            <Text style={[styles.duration, compact && styles.durationCompact, { color: c.textSecondary }]}>{durationStr}</Text>
          </View>
          <View style={styles.routeBlock}>
            <Text style={[styles.arrTime, compact && styles.arrTimeCompact, { color: c.text }]} numberOfLines={1}>
              {trip.arrivalTime?.slice(0, 5) || '—'}
            </Text>
            <Text style={[styles.location, compact && styles.locationCompact, { color: c.textSecondary }]} numberOfLines={1}>
              {trip.destinationHotpoint.name}
            </Text>
          </View>
          <View style={styles.priceBadge}>
            <View style={[styles.statusPillSmall, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusPillTextSmall, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            {isFull ? (
              <Text style={[styles.fullBadge, compact && styles.fullBadgeCompact, { color: c.error }]}>Full</Text>
            ) : (
              <Text style={[styles.price, compact && styles.priceCompact, { color: accent }]}>
                {formatRwf(trip.pricePerSeat)}
              </Text>
            )}
          </View>
        </View>

        {/* Row 2: car icon, avatar (always), driver name, rating, badge */}
        <View style={[styles.driverRow, compact && styles.driverRowCompact]}>
          <Ionicons name="car-outline" size={compact ? sizes.icon.mid : sizes.icon.mid} color={c.textSecondary} />
          <View style={styles.avatarWrap}>
            {trip.driver.avatarUri ? (
              <Image source={{ uri: trip.driver.avatarUri }} style={[styles.avatar, compact && styles.avatarCompact]} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, compact && styles.avatarCompact, { backgroundColor: c.surface }]}>
                <Ionicons name="person" size={compact ? sizes.icon.small : sizes.icon.medium} color={c.textMuted} />
              </View>
            )}
            {trip.driver.statusBadge && (
              <View style={[styles.verifiedBadge, compact && styles.verifiedBadgeCompact, { backgroundColor: c.card }]}>
                <Ionicons name="checkmark-circle" size={compact ? sizes.icon.small : sizes.icon.mid} color={accent} />
              </View>
            )}
          </View>
          <View style={styles.driverInfo}>
            <Text style={[styles.driverName, compact && styles.driverNameCompact, { color: c.text }]} numberOfLines={1}>
              {trip.driver.name}
            </Text>
            {!compact && trip.driver.rating != null && (
              <RatingDisplay rating={trip.driver.rating} textStyle={styles.rating} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: borderWidths.thin,
  },
  cardCompact: {
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardEmphasis: {},
  cardBlablacar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: cardRadiusLarge,
    marginBottom: spacing.md,
  },
  cardDashboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: cardRadiusLarge,
    marginBottom: spacing.md,
    borderWidth: borderWidths.thin,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
    alignSelf: 'flex-end',
  },
  statusPillText: { ...typography.caption, fontWeight: '700' },
  statusPillSmall: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.xs,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  statusPillTextSmall: { ...typography.caption10, fontWeight: '700' },
  dashboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  dashboardAvatar: {
    width: sizes.avatar.xl,
    height: sizes.avatar.xl,
    borderRadius: radii.md,
  },
  dashboardAvatarPlc: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardInfo: { flex: 1, minWidth: 0 },
  dashboardDriverName: { ...typography.h3, fontSize: 18 },
  dashboardMeta: {
    ...typography.caption,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: spacing.xxs,
  },
  dashboardRight: { marginLeft: spacing.sm },
  dashboardPrice: { ...typography.h2, fontSize: 24, fontWeight: '800' },
  blablacarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  blablacarAvatar: {
    ...sharedStyles.avatarLg,
    borderRadius: radii.md,
  },
  blablacarAvatarPlc: sharedStyles.avatarPlaceholder,
  blablacarInfo: { flex: 1, minWidth: 0 },
  blablacarTime: typography.bodyBold,
  blablacarMeta: { ...typography.caption, marginTop: spacing.xs },
  blablacarRight: { alignItems: 'flex-end' },
  blablacarPrice: typography.priceLg,
  blablacarPerSeat: { ...typography.overline, marginTop: 0 },
  blablacarFull: { ...typography.caption, fontWeight: '600' },
  searchResultsWrapper: { alignSelf: 'stretch' },
  cardSearchResults: {
    padding: spacing.md,
    borderRadius: cardRadiusLarge,
    marginBottom: spacing.smMd,
    borderWidth: borderWidths.thin,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  searchResultsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  searchResultsDriverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smMd,
    flex: 1,
    minWidth: 0,
  },
  searchResultsAvatarWrap: { position: 'relative' },
  searchResultsAvatarTemplate: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
  },
  searchResultsAvatarPlc: sharedStyles.avatarPlaceholder,
  searchResultsVerifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultsDriverInfo: { flex: 1, minWidth: 0 },
  searchResultsDriverName: { ...typography.bodySmall, fontWeight: '700', marginBottom: spacing.xs },
  searchResultsRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
    gap: 2,
  },
  searchResultsStarIcon: { marginRight: 1 },
  searchResultsRating: { ...typography.caption, fontSize: 10, fontWeight: '700' },
  searchResultsRatingSep: { ...typography.caption, fontSize: 10, fontWeight: '700' },
  searchResultsPriceBlock: { alignItems: 'flex-end' },
  searchResultsPriceMain: { ...typography.h3, fontSize: 20, fontWeight: '800' },
  searchResultsInstantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  searchResultsInstantText: { ...typography.overline, fontSize: 8, fontWeight: '800' },
  searchResultsTimelineRow: {
    flexDirection: 'row',
    gap: spacing.smMd,
    marginBottom: spacing.md,
  },
  searchResultsTimelineCol: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  searchResultsDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  searchResultsLine: {
    width: 2,
    flex: 1,
    minHeight: spacing.sm,
    marginVertical: 2,
  },
  searchResultsDotBottom: {},
  searchResultsTimelineContent: { flex: 1, minWidth: 0, justifyContent: 'space-between' },
  searchResultsTimelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  searchResultsTimelineItemLast: { marginBottom: 0 },
  searchResultsTimeBold: { ...typography.bodySmall, fontWeight: '800', marginBottom: 2 },
  searchResultsPlaceSub: { ...typography.caption, fontSize: 11, fontWeight: '500' },
  searchResultsDurationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  searchResultsDurationText: { ...typography.overline, fontSize: 9, fontWeight: '700' },
  searchResultsCarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchResultsCarText: { ...typography.overline, fontSize: 9, fontWeight: '700' },
  searchResultsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.smMd,
    borderTopWidth: borderWidths.thin,
  },
  searchResultsAmenitiesRow: { flexDirection: 'row', gap: spacing.sm, flex: 1, flexWrap: 'wrap' },
  searchResultsAmenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
    gap: spacing.xs,
  },
  searchResultsAmenityIcon: { marginRight: 0 },
  searchResultsAmenityText: { ...typography.overline, fontSize: 9, fontWeight: '700' },
  searchResultsSeatsRight: { ...typography.overline, fontSize: 10, fontWeight: '800' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  topRowCompact: { marginBottom: spacing.xs },
  routeBlock: { flex: 1, minWidth: 0 },
  depTime: typography.price,
  depTimeCompact: typography.driverName,
  arrTime: { ...typography.bodySmall, fontWeight: '600' },
  arrTimeCompact: typography.caption,
  location: typography.caption11,
  locationCompact: typography.caption10,
  durationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  durationLine: {
    width: borderWidths.medium,
    height: spacing.sm + 2,
    marginRight: spacing.xs,
  },
  duration: typography.caption11,
  durationCompact: typography.caption10,
  priceBadge: { alignSelf: 'flex-start' },
  price: typography.price,
  priceCompact: { ...typography.caption, fontWeight: '600' },
  fullBadge: { ...typography.caption, fontWeight: '600' },
  fullBadgeCompact: typography.caption10,
  driverRow: { ...sharedStyles.listRow },
  driverRowCompact: { ...sharedStyles.listRow, gap: spacing.xs },
  avatarWrap: { position: 'relative' },
  avatar: sharedStyles.avatarMd,
  avatarCompact: sharedStyles.avatarXs,
  avatarPlaceholder: sharedStyles.avatarPlaceholder,
  verifiedBadge: {
    position: 'absolute',
    right: -borderWidths.medium,
    bottom: -borderWidths.medium,
    borderRadius: radii.sm,
  },
  verifiedBadgeCompact: {
    right: -borderWidths.thin,
    bottom: -borderWidths.thin,
  },
  driverInfo: { flex: 1, minWidth: 0 },
  driverName: typography.driverName,
  driverNameCompact: typography.caption11,
  rating: typography.caption11,
});
