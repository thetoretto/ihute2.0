import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRootNavigation } from '../../context/RootNavigationContext';
import { getUserVehicles } from '../../services/api';
import { Button, EmptyState, Screen } from '../../components';
import { buttonHeights, spacing, typography, radii, sizes, cardShadow } from '../../utils/theme';
import { cardRadius, landingHeaderPaddingHorizontal, listBottomPaddingDefault } from '../../utils/layout';
import { useThemeColors } from '../../context/ThemeContext';
import type { Vehicle } from '../../types';

export default function VehicleGarageScreen() {
  const { user } = useAuth();
  const c = useThemeColors();
  const { rootNavigate } = useRootNavigation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const loadVehicles = useCallback(() => {
    if (user) getUserVehicles(user.id).then(setVehicles);
  }, [user]);

  useEffect(() => loadVehicles(), [loadVehicles]);
  useFocusEffect(loadVehicles);

  const   statusColor = (status: Vehicle['approvalStatus']) => {
    switch (status) {
      case 'approved': return c.success;
      case 'pending': return c.warning;
      case 'rejected': return c.error;
      default: return c.textSecondary;
    }
  };

  return (
    <Screen style={[styles.container, { backgroundColor: c.appBackground }, { paddingHorizontal: 0 }]}>
      <Button title="Add Vehicle" onPress={() => rootNavigate('AddVehicle')} style={styles.addBtn} />
      {vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles yet"
          subtitle="Add your first vehicle to unlock driver features."
        />
      ) : null}
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}>
            <View style={styles.cardRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: c.primaryTint }]}>
                <Ionicons name="car-sport" size={24} color={c.primary} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.vehicleName, { color: c.text }]}>
                    {item.make} {item.model}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: statusColor(item.approvalStatus) + '20' }]}>
                    <Text style={[styles.badgeText, { color: statusColor(item.approvalStatus) }]}>
                      {item.approvalStatus}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.vehicleDetail, { color: c.textSecondary }]}>{item.color} • {item.licensePlate}</Text>
                <Text style={[styles.seats, { color: c.textSecondary }]}>{item.seats} seats</Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => rootNavigate('EditVehicle', { vehicleId: item.id })}
                style={[styles.actionBtn, { backgroundColor: c.primary }]}
              >
                <Text style={[styles.actionText, { color: c.onPrimary }]}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.lg },
  addBtn: { marginBottom: spacing.lg },
  card: {
    padding: spacing.lg,
    borderRadius: cardRadius,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIconWrap: { width: sizes.avatar.lg, height: sizes.avatar.lg, borderRadius: radii.cardLarge, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleName: { ...typography.h3 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.sm },
  badgeText: { ...typography.caption, fontWeight: '600' },
  vehicleDetail: { ...typography.bodySmall, marginTop: spacing.xs },
  seats: { ...typography.caption, marginTop: spacing.xs },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    borderRadius: radii.button,
    minHeight: buttonHeights.small,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  actionText: { ...typography.caption, fontWeight: '600' },
  actionDangerText: { ...typography.caption, fontWeight: '600' },
  listContent: { paddingBottom: listBottomPaddingDefault, paddingHorizontal: landingHeaderPaddingHorizontal },
});
