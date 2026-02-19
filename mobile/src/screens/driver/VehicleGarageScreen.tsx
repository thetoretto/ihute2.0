import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getUserVehicles } from '../../services/mockApi';
import { Button, Screen } from '../../components';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';
import type { Vehicle } from '../../types';

export default function VehicleGarageScreen() {
  const { user } = useAuth();
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
      default: return colors.textSecondary;
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
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No vehicles yet</Text>
          <Text style={styles.emptySub}>Add your first vehicle to unlock driver features.</Text>
        </View>
      ) : null}
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.vehicleName}>
                {item.make} {item.model}
              </Text>
              <View style={[styles.badge, { backgroundColor: statusColor(item.approvalStatus) + '20' }]}>
                <Text style={[styles.badgeText, { color: statusColor(item.approvalStatus) }]}>
                  {item.approvalStatus}
                </Text>
              </View>
            </View>
            <Text style={styles.vehicleDetail}>{item.color} • {item.licensePlate}</Text>
            <Text style={styles.seats}>{item.seats} seats</Text>
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
                style={styles.actionBtn}
              >
                <Text style={styles.actionText}>Toggle approval</Text>
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
                style={styles.actionBtn}
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
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  emptySub: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleName: { ...typography.h3, color: colors.text },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.sm },
  badgeText: { ...typography.caption, fontWeight: '600' },
  vehicleDetail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  seats: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.primaryButtonBorder,
    borderRadius: radii.button,
    minHeight: buttonHeights.small,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  actionText: { ...typography.caption, color: colors.onPrimary, fontWeight: '600' },
  actionDangerText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  listContent: { paddingBottom: spacing.xl },
});
