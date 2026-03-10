import React, { useState, useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Button, Screen, Input } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { getVehicle, updateVehicle, getUserVehicles } from '../../services/api';
import { spacing, typography } from '../../utils/theme';
import { landingHeaderPaddingHorizontal } from '../../utils/layout';
import type { Vehicle } from '../../types';

type Params = { EditVehicle: { vehicleId: string } };

export default function EditVehicleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Params, 'EditVehicle'>>();
  const { user } = useAuth();
  const c = useThemeColors();
  const vehicleId = route.params?.vehicleId ?? '';
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [seats, setSeats] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) return;
    getVehicle(vehicleId).then((v) => {
      if (v) {
        setVehicle(v);
        setMake(v.make);
        setModel(v.model);
        setColor(v.color);
        setLicensePlate(v.licensePlate);
        setSeats(String(v.seats));
      }
    }).catch(() => {});
    if (user?.id) {
      getUserVehicles(user.id).then((list) => {
        const v = list.find((x) => x.id === vehicleId);
        if (v) {
          setVehicle(v);
          setMake(v.make);
          setModel(v.model);
          setColor(v.color);
          setLicensePlate(v.licensePlate);
          setSeats(String(v.seats));
        }
      });
    }
  }, [vehicleId, user?.id]);

  const handleSubmit = async () => {
    if (!vehicle) return;
    if (!make.trim() || !model.trim() || !color.trim() || !licensePlate.trim()) {
      setError('Fill in all fields.');
      return;
    }
    const seatsNum = parseInt(seats, 10);
    if (isNaN(seatsNum) || seatsNum < 1 || seatsNum > 20) {
      setError('Enter a valid seat count (1 to 20).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updateVehicle(vehicle.id, { make: make.trim(), model: model.trim(), color: color.trim(), licensePlate: licensePlate.trim(), seats: seatsNum });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update vehicle.');
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle && !make) {
    return (
      <Screen style={[styles.container, { backgroundColor: c.appBackground }]}>
        <Text style={{ color: c.text }}>Loading...</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll style={[styles.container, { backgroundColor: c.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.text }]}>Edit vehicle</Text>
      <Input placeholder="Make" value={make} onChangeText={setMake} />
      <Input placeholder="Model" value={model} onChangeText={setModel} />
      <Input placeholder="Color" value={color} onChangeText={setColor} />
      <Input placeholder="License plate" value={licensePlate} onChangeText={setLicensePlate} autoCapitalize="characters" />
      <Input placeholder="Seats" value={seats} onChangeText={setSeats} keyboardType="number-pad" />
      {error ? <Text style={[styles.err, { color: c.error }]}>{error}</Text> : null}
      <Button title={loading ? 'Saving...' : 'Save'} onPress={handleSubmit} disabled={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: landingHeaderPaddingHorizontal, paddingVertical: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.lg },
  err: { ...typography.caption, marginBottom: spacing.sm },
});
