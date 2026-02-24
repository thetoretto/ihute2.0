import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Modal,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../utils/theme';
import { selectorStyles } from '../utils/selectorStyles';
import type { Hotpoint } from '../types';

interface HotpointPickerProps {
  label?: string;
  value?: Hotpoint | null;
  hotpoints: Hotpoint[];
  onSelect: (hotpoint: Hotpoint) => void;
  placeholder?: string;
  /** Override trigger container style (e.g. transparent when embedded in a custom row). */
  triggerStyle?: ViewStyle;
}

export default function HotpointPicker({
  label,
  value,
  hotpoints,
  onSelect,
  placeholder = 'Select location',
  triggerStyle,
}: HotpointPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const getMainLabel = (h: Hotpoint) => {
    return h.country ? `${h.name}, ${h.country}` : h.name;
  };

  const getSecondaryLabel = (h: Hotpoint) => {
    if (h.address) {
      return `Hotpoint: ${h.address}`;
    }
    return `Hotpoint: ${h.name}`;
  };

  const filtered =
    normalizedQuery.length > 0
      ? hotpoints.filter(
          (h) =>
            h.name.toLowerCase().includes(normalizedQuery) ||
            h.country?.toLowerCase().includes(normalizedQuery) ||
            h.address?.toLowerCase().includes(normalizedQuery)
        )
      : hotpoints;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[selectorStyles.trigger, triggerStyle]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
        <Text style={[selectorStyles.triggerText, !value && selectorStyles.triggerPlaceholder]}>
          {value ? getMainLabel(value) : placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={selectorStyles.overlay}>
          <View style={selectorStyles.sheet}>
            <View style={selectorStyles.searchRow}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={selectorStyles.searchInput}
                placeholder="Type city or hotpoint"
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={selectorStyles.optionRow}
              onPress={() => {
                const current = hotpoints[0];
                if (current) {
                  onSelect(current);
                  setModalVisible(false);
                }
              }}
            >
              <Ionicons name="locate" size={20} color={colors.primary} />
              <Text style={[selectorStyles.optionText, selectorStyles.optionPrimary]}>Use my current location</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={selectorStyles.optionRow}
                  onPress={() => {
                    onSelect(item);
                    setQuery('');
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                  <View style={selectorStyles.optionText}>
                    <Text style={selectorStyles.optionPrimary}>{getMainLabel(item)}</Text>
                    <Text style={selectorStyles.optionSecondary}>{getSecondaryLabel(item)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={selectorStyles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={selectorStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
