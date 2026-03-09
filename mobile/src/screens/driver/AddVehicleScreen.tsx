import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Screen, Input } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { createVehicle } from '../../services/api';
import { spacing, typography } from '../../utils/theme';
import { driverContentHorizontal } from '../../utils/layout';

export default function AddVehicleScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const c = useThemeColors();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [seats, setSeats] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!make.trim() || !model.trim() || !color.trim() || !licensePlate.trim()) {
      setError('Fill in all fields.');
      return;
    }
    const seatsNum = parseInt(seats, 10);
    if (isNaN(seatsNum) || seatsNum < 1 || seatsNum > 20) {
      setError('Enter a valid seat count (1–20).');
      return;
    }
    if (!user?.id) return;
    setError(null);
    setLoading(true);
    try {
      await createVehicle(user.id, { make: make.trim(), model: model.trim(), color: color.trim(), licensePlate: licensePlate.trim(), seats: seatsNum });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add vehicle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll style={[styles.container, { backgroundColor: c.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.text }]}>Add vehicle</Text>
      <Input placeholder="Make (e.g. Toyota)" value={make} onChangeText={setMake} />
      <Input placeholder="Model (e.g. Corolla)" value={model} onChangeText={setModel} />
      <Input placeholder="Color" value={color} onChangeText={setColor} />
      <Input placeholder="License plate" value={licensePlate} onChangeText={setLicensePlate} autoCapitalize="characters" />
      <Input placeholder="Seats" value={seats} onChangeText={setSeats} keyboardType="number-pad" />
      {error ? <Text style={[styles.err, { color: c.error }]}>{error}</Text> : null}
      <Button title={loading ? 'Adding...' : 'Add vehicle'} onPress={handleSubmit} disabled={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: driverContentHorizontal, paddingVertical: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.lg },
  err: { ...typography.caption, marginBottom: spacing.sm },
});
