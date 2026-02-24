import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getUserVehicles } from '../../services/api';
import { Button, Screen } from '../../components';
import { buttonHeights, colors, spacing, typography, radii, cardShadow } from '../../utils/theme';
import { useThemeColors } from '../../context/ThemeContext';
import type { Vehicle } from '../../types';

const CARD_RADIUS = 24;

export default function VehicleGarageScreen() {
  const { user } = useAuth();
  const c = useThemeColors();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (user) {
      getUserVehicles(user.id).then(setVehicles);
    }
  }, [user]);

  const statusColor = (status: Vehicle['approvalStatus']) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'pending': return colors.warning;
      case 'rejected': return colors.error;
      default: return c.textSecondary;
    }
  };

  return (
    <Screen style={styles.container}>
      <Button
        title="Add Vehicle"
        onPress={() => {
          const id = `v_mock_${Date.now()}`;
          setVehicles((prev) => [
            {
              id,
              make: 'Nissan',
              model: 'Qashqai',
              color: 'Blue',
              licensePlate: `MCK-${id.slice(-4).toUpperCase()}`,
              seats: 4,
              approvalStatus: 'pending',
            },
            ...prev,
          ]);
        }}
        style={styles.addBtn}
      />
      {vehicles.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No vehicles yet</Text>
          <Text style={[styles.emptySub, { color: c.textSecondary }]}>Add your first vehicle to unlock driver features.</Text>
        </View>
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
                onPress={() =>
                  setVehicles((prev) =>
                    prev.map((v) =>
                      v.id === item.id
                        ? { ...v, approvalStatus: v.approvalStatus === 'approved' ? 'pending' : 'approved' }
                        : v
                    )
                  )
                }
                style={[styles.actionBtn, { backgroundColor: c.primary }]}
              >
                <Text style={[styles.actionText, { color: c.onPrimary }]}>Toggle approval</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Delete vehicle', 'Remove this mock vehicle?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => setVehicles((prev) => prev.filter((v) => v.id !== item.id)),
                    },
                  ])
                }
                style={[styles.actionBtn, { borderWidth: 1, borderColor: c.border, backgroundColor: c.surface }]}
              >
                <Text style={styles.actionDangerText}>Delete</Text>
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
  emptyState: {
    padding: spacing.xl,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.body, fontWeight: '600' },
  emptySub: { ...typography.caption, marginTop: spacing.xs },
  card: {
    padding: spacing.lg,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleName: { ...typography.h3 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.sm },
  badgeText: { ...typography.caption, fontWeight: '600' },
  vehicleDetail: { ...typography.bodySmall, marginTop: spacing.xs },
  seats: { ...typography.caption, marginTop: spacing.xs },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    borderRadius: 12,
    minHeight: buttonHeights.small,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  actionText: { ...typography.caption, fontWeight: '600' },
  actionDangerText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  listContent: { paddingBottom: spacing.xl },
});
