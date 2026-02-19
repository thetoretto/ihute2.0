import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { HotpointPicker, Button, Screen } from '../../components';
import { getHotpoints } from '../../services/mockApi';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';
import type { Hotpoint, TripType } from '../../types';

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
      <View style={styles.row}>
        <View style={styles.pickerWrap}>
          <HotpointPicker
            label="From"
            value={from}
            hotpoints={hotpoints}
            onSelect={(next) => {
              setFrom(next);
              setRouteWarning(null);
            }}
            placeholder="Select departure"
          />
        </View>
        <TouchableOpacity style={styles.swapBtn} onPress={swap}>
          <Text style={styles.swapIcon}>⇅</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.pickerWrap}>
        <HotpointPicker
          label="To"
          value={to}
          hotpoints={hotpoints}
          onSelect={(next) => {
            setTo(next);
            setRouteWarning(null);
          }}
          placeholder="Select destination"
        />
      </View>
      {routeWarning ? <Text style={styles.routeWarning}>{routeWarning}</Text> : null}
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={[styles.dateBtn, !isReturnTrip && styles.dateBtnActive]}
          onPress={() => setIsReturnTrip(false)}
        >
          <Text style={styles.dateBtnText}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateBtn, isReturnTrip && styles.dateBtnActive]}
          onPress={() => setIsReturnTrip((prev) => !prev)}
        >
          <Text style={[styles.dateBtnText, isReturnTrip ? undefined : styles.dateBtnTextMuted]}>
            Return
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, tripType === 'insta' && styles.modeBtnActive]}
          onPress={() => setTripType('insta')}
        >
          <Text style={[styles.modeText, tripType === 'insta' && styles.modeTextActive]}>
            Instant
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, tripType === 'scheduled' && styles.modeBtnActive]}
          onPress={() => setTripType('scheduled')}
        >
          <Text style={[styles.modeText, tripType === 'scheduled' && styles.modeTextActive]}>
            Scheduled
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.passengerRow}>
        <Text style={styles.passengerLabel}>Passengers</Text>
        <View style={styles.passengerStepper}>
          <TouchableOpacity onPress={() => setPassengerCount((c) => Math.max(1, c - 1))}>
            <Text style={styles.stepperControl}>-</Text>
          </TouchableOpacity>
          <Text style={styles.passengerValue}>{passengerCount} Adult</Text>
          <TouchableOpacity onPress={() => setPassengerCount((c) => Math.min(6, c + 1))}>
            <Text style={styles.stepperControl}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Button title="Search" onPress={onSearch} disabled={loading || !from || !to} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  pickerWrap: { flex: 1 },
  swapBtn: {
    minHeight: 52,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  swapIcon: { fontSize: 20, color: colors.primary },
  dateRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  dateBtn: {
    flex: 1,
    minHeight: buttonHeights.medium,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtnActive: { backgroundColor: colors.surfaceElevated },
  dateBtnText: { ...typography.body, color: colors.text },
  dateBtnTextMuted: { color: colors.textSecondary },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  passengerStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperControl: {
    ...typography.h3,
    color: colors.primary,
    width: 22,
    textAlign: 'center',
  },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    minHeight: buttonHeights.medium,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryButtonBorder,
  },
  modeText: { ...typography.bodySmall, color: colors.textSecondary },
  modeTextActive: { color: colors.onPrimary, fontWeight: '600' },
  passengerLabel: { ...typography.body, color: colors.text },
  passengerValue: { ...typography.body, color: colors.textSecondary },
  routeWarning: { ...typography.caption, color: colors.error, marginBottom: spacing.md },
});
