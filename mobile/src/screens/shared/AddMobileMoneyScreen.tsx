import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen, Input } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { addPaymentMethod } from '../../services/api';
import { spacing, typography, radii } from '../../utils/theme';

const PROVIDERS = ['MTN', 'Airtel', 'Other'];

export default function AddMobileMoneyScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const c = useThemeColors();
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const p = phone.trim();
    if (!p || p.length < 9) {
      setError('Enter a valid phone number.');
      return;
    }
    if (!provider) {
      setError('Select a provider.');
      return;
    }
    if (!user?.id) return;
    setError(null);
    setLoading(true);
    try {
      await addPaymentMethod(user.id, {
        type: 'mobile_money',
        label: provider,
        detail: p,
        isDefault: false,
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add Mobile Money.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll style={[styles.container, { backgroundColor: c.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.text }]}>Add Mobile Money</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>Link your Mobile Money account for payments.</Text>
      <Input placeholder="Phone number (e.g. +250 788 123 456)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Text style={[styles.label, { color: c.textSecondary }]}>Provider</Text>
      <View style={styles.chipRow}>
        {PROVIDERS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setProvider(p)}
            style={[styles.chip, { backgroundColor: provider === p ? c.primaryTint ?? c.primary + '20' : c.surface, borderColor: c.border }]}
          >
            <Text style={[styles.chipText, { color: provider === p ? c.primary : c.text }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={[styles.err, { color: c.error }]}>{error}</Text> : null}
      <Button title={loading ? 'Adding...' : 'Add Mobile Money'} onPress={handleSubmit} disabled={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.lg },
  label: { ...typography.bodySmall, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1 },
  chipText: { ...typography.bodySmall, fontWeight: '600' },
  err: { ...typography.caption, marginBottom: spacing.sm },
});
