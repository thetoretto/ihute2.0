import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Screen, Input } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { addPaymentMethod } from '../../services/api';
import { spacing, typography } from '../../utils/theme';

export default function AddCardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const c = useThemeColors();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatExpiry = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleSubmit = async () => {
    const name = cardholderName.trim();
    const exp = expiry.trim();
    const num = cardNumber.replace(/\s/g, '');
    if (!num || num.length < 4) { setError('Enter a valid card number.'); return; }
    if (!exp || exp.length < 5) { setError('Enter expiry (MM/YY).'); return; }
    if (!cvv || cvv.length < 3) { setError('Enter CVV.'); return; }
    if (!name) { setError('Enter cardholder name.'); return; }
    if (!user?.id) return;
    setError(null);
    setLoading(true);
    try {
      const last4 = num.slice(-4);
      await addPaymentMethod(user.id, { type: 'card', label: 'Card **** ' + last4, detail: 'Exp ' + exp, isDefault: false });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll style={[styles.container, { backgroundColor: c.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.text }]}>Add card</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>Card details are stored securely.</Text>
      <Input placeholder="Card number" value={cardNumber} onChangeText={(t) => setCardNumber(t.replace(/\D/g, '').slice(0, 16))} keyboardType="number-pad" maxLength={19} />
      <Input placeholder="MM/YY" value={expiry} onChangeText={(t) => setExpiry(formatExpiry(t))} keyboardType="number-pad" maxLength={5} />
      <Input placeholder="CVV" value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4} />
      <Input placeholder="Cardholder name" value={cardholderName} onChangeText={setCardholderName} autoCapitalize="words" />
      {error ? <Text style={[styles.err, { color: c.error }]}>{error}</Text> : null}
      <Button title={loading ? 'Adding...' : 'Add card'} onPress={handleSubmit} disabled={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.lg },
  err: { ...typography.caption, marginBottom: spacing.sm },
});
