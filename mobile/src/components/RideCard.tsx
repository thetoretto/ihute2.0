import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { spacing, radii, typography, sizes, borderWidths } from '../utils/theme';
import { panelRadius } from '../utils/layout';
import { sharedStyles } from '../utils/sharedStyles';
import { formatRwf } from '../../../shared/src';
import RatingDisplay from './RatingDisplay';
import type { Trip } from '../types';

interface RideCardProps {
  trip: Trip;
  onPress: () => void;
  variant?: 'default' | 'compact' | 'blablacar' | 'searchResults';
}

export default function RideCard({ trip, onPress, variant = 'default' }: RideCardProps) {
  const c = useThemeColors();
  const isFull = trip.status === 'full';
  const scale = React.useRef(new Animated.Value(1)).current;
  const compact = variant === 'compact';
  const blablacar = variant === 'blablacar';
  const searchResults = variant === 'searchResults';

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
    ? `${Math.floor(trip.durationMinutes / 60)}h${trip.durationMinutes % 60}`
    : '—';

  if (searchResults) {
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
          <View style={styles.searchResultsTop}>
            <View style={styles.searchResultsLeft}>
              <View style={styles.searchResultsTimeline}>
                <Text style={[styles.searchResultsTime, { color: c.text }]} numberOfLines={1}>
                  {trip.departureTime.slice(0, 5)}
                </Text>
                <View style={[styles.searchResultsLineWrap, { borderColor: c.border }]}>
                  <View style={[styles.searchResultsDot, styles.searchResultsDotTop, { backgroundColor: c.primary, borderColor: c.card }]} />
                  <View style={[styles.searchResultsDot, styles.searchResultsDotBottom, { backgroundColor: c.primary, borderColor: c.card }]} />
                </View>
                <Text style={[styles.searchResultsTime, { color: c.text }]} numberOfLines={1}>
                  {trip.arrivalTime?.slice(0, 5) || '—'}
                </Text>
              </View>
              <View style={styles.searchResultsPlaces}>
                <Text style={[styles.searchResultsPlace, { color: c.text }]} numberOfLines={1}>
                  {trip.departureHotpoint.name}
                </Text>
                <Text style={[styles.searchResultsPlace, { color: c.text }]} numberOfLines={1}>
                  {trip.destinationHotpoint.name}
                </Text>
              </View>
            </View>
            <Text style={[styles.searchResultsPrice, { color: c.primary }]}>{formatRwf(trip.pricePerSeat)}</Text>
          </View>
          <View style={styles.searchResultsChipRow}>
            <View style={[styles.searchResultsTypeChip, { backgroundColor: trip.type === 'insta' ? c.primaryTint : c.surface }]}>
              {trip.type === 'insta' ? (
                <Ionicons name="flash" size={sizes.icon.small} color={c.primary} style={styles.searchResultsTypeChipIcon} />
              ) : null}
              <Text style={[styles.searchResultsTypeChipText, { color: trip.type === 'insta' ? c.primary : c.textSecondary }]}>
                {trip.type === 'insta' ? 'Instant' : trip.departureDate ? new Date(trip.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Scheduled'}
              </Text>
            </View>
          </View>
          <View style={[styles.searchResultsDriverRow, { borderTopColor: c.borderLight }]}>
            <View style={styles.searchResultsDriverLeft}>
              {trip.driver.avatarUri ? (
                <Image source={{ uri: trip.driver.avatarUri }} style={styles.searchResultsAvatar} />
              ) : (
                <View style={[styles.searchResultsAvatar, styles.searchResultsAvatarPlc, { backgroundColor: c.surface }]}>
                  <Ionicons name="person" size={sizes.icon.medium} color={c.textMuted} />
                </View>
              )}
              <Text style={[styles.searchResultsDriverName, { color: c.text }]} numberOfLines={1}>
                {trip.driver.name}
              </Text>
              {trip.driver.rating != null && (
                <View style={[styles.searchResultsRatingWrap, { backgroundColor: c.primaryTint }]}>
                  <Ionicons name="star" size={sizes.icon.small} color={c.primary} />
                  <Text style={[styles.searchResultsRating, { color: c.text }]}>{trip.driver.rating}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.searchResultsSeatsLeft, { color: c.textMuted }]}>
              {trip.seatsAvailable} seat{trip.seatsAvailable !== 1 ? 's' : ''} left
            </Text>
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
            {isFull ? (
              <Text style={[styles.blablacarFull, { color: c.error }]}>Full</Text>
            ) : (
              <>
                <Text style={[styles.blablacarPrice, { color: c.passengerBrand }]}>{formatRwf(trip.pricePerSeat)}</Text>
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
            {isFull ? (
              <Text style={[styles.fullBadge, compact && styles.fullBadgeCompact, { color: c.error }]}>Full</Text>
            ) : (
              <Text style={[styles.price, compact && styles.priceCompact, { color: c.success }]}>
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
                <Ionicons name="checkmark-circle" size={compact ? sizes.icon.small : sizes.icon.mid} color={c.primary} />
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
    padding: spacing.md,
    borderRadius: panelRadius,
    marginBottom: spacing.sm,
  },
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
  searchResultsWrapper: {
    alignSelf: 'stretch',
  },
  cardSearchResults: {
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: borderWidths.thin,
    alignSelf: 'stretch',
  },
  searchResultsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  searchResultsLeft: {
    flexDirection: 'row',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  searchResultsTimeline: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  searchResultsTime: { ...typography.bodySmall, fontWeight: '700' },
  searchResultsLineWrap: {
    ...sharedStyles.timelineLine,
    minHeight: spacing.md,
  },
  searchResultsDot: {
    ...sharedStyles.timelineDot,
    left: -5,
  },
  searchResultsDotTop: { top: -spacing.xs },
  searchResultsDotBottom: { bottom: -spacing.xs },
  searchResultsPlaces: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    minWidth: 0,
  },
  searchResultsPlace: { ...typography.bodySmall, fontWeight: '600' },
  searchResultsPrice: typography.priceLg,
  searchResultsChipRow: { flexDirection: 'row', marginBottom: spacing.xs },
  searchResultsTypeChip: {
    ...sharedStyles.chip,
    alignSelf: 'flex-start',
  },
  searchResultsTypeChipIcon: sharedStyles.chipIconMargin,
  searchResultsTypeChipText: typography.overline,
  searchResultsDriverRow: {
    ...sharedStyles.listRowBetween,
    paddingTop: spacing.md,
    borderTopWidth: borderWidths.thin,
  },
  searchResultsDriverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  searchResultsAvatar: sharedStyles.avatarSm,
  searchResultsAvatarPlc: sharedStyles.avatarPlaceholder,
  searchResultsDriverName: typography.captionBold,
  searchResultsRatingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    gap: spacing.xs,
  },
  searchResultsRating: typography.caption10,
  searchResultsSeatsLeft: typography.overline,
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
