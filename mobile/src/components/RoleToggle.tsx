import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../context/ThemeContext';
import { spacing, radii, typography } from '../utils/theme';
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
  const c = useThemeColors();
  const canUsePassenger = availableRoles.includes('passenger');
  const canUseDriver = availableRoles.includes('driver');
  const canUseAgency = availableRoles.includes('agency');

  const getActiveBg = (role: UserRole) =>
    role === 'passenger' ? c.primary : role === 'driver' ? c.passengerDark : c.agency;
  const getActiveTextColor = () => c.passengerOnBrand;

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
    <View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border }]}>
      <TouchableOpacity
        style={[styles.tab, currentRole === 'passenger' && { backgroundColor: getActiveBg('passenger'), borderRadius: radii.button }]}
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
          color={currentRole === 'passenger' ? getActiveTextColor() : c.textSecondary}
        />
        <Text style={[styles.tabText, { color: c.textSecondary }, currentRole === 'passenger' && { color: getActiveTextColor(), fontWeight: '600' }]}>
          Passenger
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, currentRole === 'driver' && { backgroundColor: getActiveBg('driver'), borderRadius: radii.button }]}
        onPress={() => handleSwitchToDriverOrAgency('driver')}
        disabled={!canUseDriver}
      >
        <Ionicons
          name="car-outline"
          size={20}
          color={currentRole === 'driver' ? getActiveTextColor() : c.textSecondary}
        />
        <Text style={[styles.tabText, { color: c.textSecondary }, currentRole === 'driver' && { color: getActiveTextColor(), fontWeight: '600' }]}>
          Driver
        </Text>
      </TouchableOpacity>
      {canUseAgency ? (
        <TouchableOpacity
          style={[styles.tab, currentRole === 'agency' && { backgroundColor: getActiveBg('agency'), borderRadius: radii.button }]}
          onPress={() => handleSwitchToDriverOrAgency('agency')}
        >
          <Ionicons
            name="bus-outline"
            size={20}
            color={currentRole === 'agency' ? getActiveTextColor() : c.textSecondary}
          />
          <Text style={[styles.tabText, { color: c.textSecondary }, currentRole === 'agency' && { color: getActiveTextColor(), fontWeight: '600' }]}>
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
    borderRadius: radii.md,
    borderWidth: 1,
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
  tabText: {
    ...typography.bodySmall,
  },
});
