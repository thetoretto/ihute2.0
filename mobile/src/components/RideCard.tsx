import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { colors, spacing, radii, typography } from '../utils/theme';
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
      <Animated.View style={{ transform: [{ scale }] }}>
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
          <View style={[styles.searchResultsDriverRow, { borderTopColor: c.borderLight }]}>
            <View style={styles.searchResultsDriverLeft}>
              {trip.driver.avatarUri ? (
                <Image source={{ uri: trip.driver.avatarUri }} style={styles.searchResultsAvatar} />
              ) : (
                <View style={[styles.searchResultsAvatar, styles.searchResultsAvatarPlc, { backgroundColor: c.surface }]}>
                  <Ionicons name="person" size={20} color={c.textMuted} />
                </View>
              )}
              <Text style={[styles.searchResultsDriverName, { color: c.text }]} numberOfLines={1}>
                {trip.driver.name}
              </Text>
              {trip.driver.rating != null && (
                <View style={[styles.searchResultsRatingWrap, { backgroundColor: c.primaryTint || 'rgba(254,228,107,0.2)' }]}>
                  <Ionicons name="star" size={10} color={c.primary} />
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
                <Ionicons name="person" size={20} color={c.textMuted} />
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
              <Text style={[styles.price, compact && styles.priceCompact]}>
                {formatRwf(trip.pricePerSeat)}
              </Text>
            )}
          </View>
        </View>

        {/* Row 2: car icon, avatar (always), driver name, rating, badge */}
        <View style={[styles.driverRow, compact && styles.driverRowCompact]}>
          <Ionicons name="car-outline" size={compact ? 14 : 16} color={c.textSecondary} />
          <View style={styles.avatarWrap}>
            {trip.driver.avatarUri ? (
              <Image source={{ uri: trip.driver.avatarUri }} style={[styles.avatar, compact && styles.avatarCompact]} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, compact && styles.avatarCompact, { backgroundColor: c.surface }]}>
                <Ionicons name="person" size={compact ? 12 : 18} color={c.textMuted} />
              </View>
            )}
            {trip.driver.statusBadge && (
              <View style={[styles.verifiedBadge, compact && styles.verifiedBadgeCompact, { backgroundColor: c.card }]}>
                <Ionicons name="checkmark-circle" size={compact ? 12 : 14} color={c.primary} />
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
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCompact: {
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardEmphasis: {
    borderColor: colors.borderLight,
  },
  cardBlablacar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 24,
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
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  blablacarAvatarPlc: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blablacarInfo: { flex: 1, minWidth: 0 },
  blablacarTime: { ...typography.body, fontWeight: '700', fontSize: 16 },
  blablacarMeta: { ...typography.caption, fontSize: 12, marginTop: 2 },
  blablacarRight: { alignItems: 'flex-end' },
  blablacarPrice: { ...typography.body, fontWeight: '800', fontSize: 18 },
  blablacarPerSeat: { ...typography.caption, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 0 },
  blablacarFull: { ...typography.caption, fontWeight: '600' },
  cardSearchResults: {
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
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
  searchResultsTime: {
    ...typography.bodySmall,
    fontWeight: '700',
    fontSize: 14,
  },
  searchResultsLineWrap: {
    width: 2,
    marginVertical: spacing.xs,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    flex: 1,
    minHeight: 16,
    position: 'relative',
  },
  searchResultsDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    left: -5,
  },
  searchResultsDotTop: { top: -4 },
  searchResultsDotBottom: { bottom: -4 },
  searchResultsPlaces: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    minWidth: 0,
  },
  searchResultsPlace: {
    ...typography.bodySmall,
    fontWeight: '600',
    fontSize: 14,
  },
  searchResultsPrice: {
    ...typography.h3,
    fontWeight: '800',
    fontSize: 18,
  },
  searchResultsDriverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  searchResultsDriverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  searchResultsAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  searchResultsAvatarPlc: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsDriverName: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  searchResultsRatingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    gap: 2,
  },
  searchResultsRating: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  searchResultsSeatsLeft: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  topRowCompact: {
    marginBottom: spacing.xs,
  },
  routeBlock: {
    flex: 1,
    minWidth: 0,
  },
  depTime: { ...typography.body, color: colors.text, fontWeight: '700', fontSize: 15 },
  depTimeCompact: { fontSize: 13 },
  arrTime: { ...typography.body, color: colors.text, fontWeight: '600', fontSize: 14 },
  arrTimeCompact: { fontSize: 12 },
  location: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
  locationCompact: { fontSize: 10 },
  durationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  durationLine: {
    width: 2,
    height: 10,
    backgroundColor: colors.border,
    marginRight: spacing.xs,
  },
  duration: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
  durationCompact: { fontSize: 10 },
  priceBadge: { alignSelf: 'flex-start' },
  price: { ...typography.body, color: colors.success, fontWeight: '700', fontSize: 15 },
  priceCompact: { fontSize: 12, fontWeight: '600' },
  fullBadge: { ...typography.caption, color: colors.error, fontWeight: '600', fontSize: 12 },
  fullBadgeCompact: { fontSize: 10 },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  driverRowCompact: {
    gap: spacing.xs,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.card,
    borderRadius: 10,
  },
  verifiedBadgeCompact: {
    right: -1,
    bottom: -1,
  },
  driverInfo: { flex: 1, minWidth: 0 },
  driverName: { ...typography.bodySmall, color: colors.text, fontWeight: '600', fontSize: 13 },
  driverNameCompact: { ...typography.caption, color: colors.text, fontSize: 11 },
  rating: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
});
