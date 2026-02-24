import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HotpointPicker, Button, Screen } from '../../components';
import { getHotpoints } from '../../services/api';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';
import type { Hotpoint, TripType } from '../../types';

const PASSENGER_BRAND = colors.passengerBrand;
const PASSENGER_BG_LIGHT = colors.passengerBgLight;

type SearchParams = {
  Search: { fromId?: string; toId?: string; tripType?: TripType };
};

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<SearchParams, 'Search'>>();
  const [hotpoints, setHotpoints] = useState<Hotpoint[]>([]);
  const [from, setFrom] = useState<Hotpoint | null>(null);
  const [to, setTo] = useState<Hotpoint | null>(null);
  const [tripType, setTripType] = useState<TripType>(route.params?.tripType || 'insta');
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [passengerCount, setPassengerCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [routeWarning, setRouteWarning] = useState<string | null>(null);

  useEffect(() => {
    getHotpoints().then((h) => {
      setHotpoints(h);
      if (route.params?.fromId) {
        const f = h.find((x) => x.id === route.params?.fromId);
        if (f) setFrom(f);
      }
      if (route.params?.toId) {
        const t = h.find((x) => x.id === route.params?.toId);
        if (t) setTo(t);
      }
      if (route.params?.tripType) {
        setTripType(route.params.tripType);
      }
      setLoading(false);
    });
  }, [route.params?.fromId, route.params?.toId, route.params?.tripType]);

  const onSearch = () => {
    if (!from || !to) {
      return;
    }
    if (from.id === to.id) {
      setRouteWarning('Departure and destination cannot be the same.');
      return;
    }
    setRouteWarning(null);
    navigation.navigate('SearchResults', {
      fromId: from.id,
      toId: to.id,
      tripType,
      passengerCount,
    });
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    setRouteWarning(null);
  };

  return (
    <Screen scroll style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Search</Text>

      {/* From - BlaBlaCar style */}
      <View style={styles.inputGroup}>
        <Ionicons name="ellipse" size={10} color={colors.textMuted} style={styles.inputIcon} />
        <View style={styles.pickerFlex}>
          <HotpointPicker
            value={from}
            hotpoints={hotpoints}
            onSelect={(next) => {
              setFrom(next);
              setRouteWarning(null);
            }}
            placeholder="From..."
            triggerStyle={styles.triggerEmbed}
          />
        </View>
      </View>

      {/* To - with swap */}
      <View style={styles.inputGroupRow}>
        <View style={[styles.inputGroup, styles.inputGroupFlex]}>
          <Ionicons name="location" size={16} color={PASSENGER_BRAND} style={styles.inputIcon} />
          <View style={styles.pickerFlex}>
            <HotpointPicker
              value={to}
              hotpoints={hotpoints}
              onSelect={(next) => {
                setTo(next);
                setRouteWarning(null);
              }}
              placeholder="To..."
              triggerStyle={styles.triggerEmbed}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.swapBtn} onPress={swap}>
          <Ionicons name="swap-vertical" size={22} color={PASSENGER_BRAND} />
        </TouchableOpacity>
      </View>

      {routeWarning ? <Text style={styles.routeWarning}>{routeWarning}</Text> : null}

      <View style={styles.dateRow}>
        <TouchableOpacity
          style={[styles.dateBtn, !isReturnTrip && styles.dateBtnActive]}
          onPress={() => setIsReturnTrip(false)}
        >
          <Text style={[styles.dateBtnText, !isReturnTrip && styles.dateBtnTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateBtn, isReturnTrip && styles.dateBtnActive]}
          onPress={() => setIsReturnTrip((prev) => !prev)}
        >
          <Text style={[styles.dateBtnText, isReturnTrip ? styles.dateBtnTextActive : styles.dateBtnTextMuted]}>
            Return
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, tripType === 'insta' && styles.modeBtnActive]}
          onPress={() => setTripType('insta')}
        >
          <Text style={[styles.modeText, tripType === 'insta' && styles.modeTextActive]}>Instant</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, tripType === 'scheduled' && styles.modeBtnActive]}
          onPress={() => setTripType('scheduled')}
        >
          <Text style={[styles.modeText, tripType === 'scheduled' && styles.modeTextActive]}>Scheduled</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.passengerRow}>
        <Text style={styles.passengerLabel}>Passengers</Text>
        <View style={styles.passengerStepper}>
          <TouchableOpacity onPress={() => setPassengerCount((c) => Math.max(1, c - 1))}>
            <Text style={styles.stepperControl}>−</Text>
          </TouchableOpacity>
          <Text style={styles.passengerValue}>{passengerCount} Adult</Text>
          <TouchableOpacity onPress={() => setPassengerCount((c) => Math.min(6, c + 1))}>
            <Text style={styles.stepperControl}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.findBtn}
        onPress={onSearch}
        disabled={loading || !from || !to}
        activeOpacity={0.85}
      >
        <Text style={styles.findBtnText}>Find Rides</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl + 80 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.passengerDark,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PASSENGER_BG_LIGHT,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 52,
  },
  inputGroupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  inputGroupFlex: { flex: 1, marginBottom: 0 },
  inputIcon: { width: 28, textAlign: 'center', marginRight: spacing.xs },
  pickerFlex: { flex: 1, minWidth: 0 },
  triggerEmbed: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    minHeight: undefined,
    flex: 1,
    marginBottom: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  swapBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  routeWarning: { ...typography.caption, color: colors.error, marginBottom: spacing.md },
  dateRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  dateBtn: {
    flex: 1,
    minHeight: buttonHeights.medium,
    paddingHorizontal: spacing.md,
    backgroundColor: PASSENGER_BG_LIGHT,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtnActive: { backgroundColor: 'rgba(0,175,245,0.12)', borderColor: colors.passengerBrand },
  dateBtnText: { ...typography.body, color: colors.text },
  dateBtnTextActive: { color: colors.passengerDark, fontWeight: '600' },
  dateBtnTextMuted: { color: colors.textSecondary },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeBtn: {
    flex: 1,
    backgroundColor: PASSENGER_BG_LIGHT,
    borderRadius: radii.button,
    minHeight: buttonHeights.medium,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    backgroundColor: PASSENGER_BRAND,
    borderColor: PASSENGER_BRAND,
  },
  modeText: { ...typography.bodySmall, color: colors.textSecondary },
  modeTextActive: { color: '#fff', fontWeight: '600' },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  passengerLabel: { ...typography.body, color: colors.text, fontWeight: '600' },
  passengerStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperControl: {
    ...typography.h3,
    color: PASSENGER_BRAND,
    width: 28,
    textAlign: 'center',
  },
  passengerValue: { ...typography.body, color: colors.textSecondary },
  findBtn: {
    backgroundColor: PASSENGER_BRAND,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PASSENGER_BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  findBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
