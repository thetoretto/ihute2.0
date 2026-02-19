import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../utils/theme';
import type { UserRole } from '../types';

interface RoleToggleProps {
  currentRole: UserRole;
  onSwitch: (role: UserRole) => Promise<void> | void;
  hasApprovedVehicle: boolean;
  availableRoles?: UserRole[];
  onNavigateToVehicleGarage?: () => void;
}

export default function RoleToggle({
  currentRole,
  onSwitch,
  hasApprovedVehicle,
  availableRoles = ['passenger', 'driver'],
  onNavigateToVehicleGarage,
}: RoleToggleProps) {
  const canUsePassenger = availableRoles.includes('passenger');
  const canUseDriver = availableRoles.includes('driver');
  const canUseAgency = availableRoles.includes('agency');

  const handleSwitchToDriverOrAgency = (role: 'driver' | 'agency') => {
    if (role === 'driver' && !canUseDriver) return;
    if (role === 'agency' && !canUseAgency) return;
    if (!hasApprovedVehicle) {
      Alert.alert(
        'Vehicle required',
        role === 'agency'
          ? 'You need to add at least one approved vehicle (bus) to use agency mode.'
          : 'You need to add an approved vehicle first to use driver mode.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add vehicle',
            onPress: onNavigateToVehicleGarage,
          },
        ]
      );
      return;
    }
    void onSwitch(role);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, currentRole === 'passenger' && styles.tabActive]}
        onPress={() => {
          if (canUsePassenger) {
            void onSwitch('passenger');
          }
        }}
        disabled={!canUsePassenger}
      >
        <Ionicons
          name="people-outline"
          size={20}
          color={currentRole === 'passenger' ? colors.onPrimary : colors.textSecondary}
        />
        <Text style={[styles.tabText, currentRole === 'passenger' && styles.tabTextActive]}>
          Passenger
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, currentRole === 'driver' && styles.tabActive]}
        onPress={() => handleSwitchToDriverOrAgency('driver')}
        disabled={!canUseDriver}
      >
        <Ionicons
          name="car-outline"
          size={20}
          color={currentRole === 'driver' ? colors.onPrimary : colors.textSecondary}
        />
        <Text style={[styles.tabText, currentRole === 'driver' && styles.tabTextActive]}>
          Driver
        </Text>
      </TouchableOpacity>
      {canUseAgency ? (
        <TouchableOpacity
          style={[styles.tab, currentRole === 'agency' && styles.tabActive]}
          onPress={() => handleSwitchToDriverOrAgency('agency')}
        >
          <Ionicons
            name="bus-outline"
            size={20}
            color={currentRole === 'agency' ? colors.onPrimary : colors.textSecondary}
          />
          <Text style={[styles.tabText, currentRole === 'agency' && styles.tabTextActive]}>
            Agency
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.onPrimary,
    fontWeight: '600',
  },
});
