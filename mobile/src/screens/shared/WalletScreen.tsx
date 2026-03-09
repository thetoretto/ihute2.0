import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { getWalletBalance, getWalletTransactions } from '../../services/api';
import { spacing, typography, radii } from '../../utils/theme';
import { landingHeaderPaddingHorizontal } from '../../utils/layout';

export default function WalletScreen() {
  const { user } = useAuth();
  const c = useThemeColors();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Array<{ id: string; type: 'credit' | 'debit'; amount: number; label: string; date: string }>>([]);

  useEffect(() => {
    if (!user?.id) return;
    getWalletBalance(user.id).then(setBalance);
    getWalletTransactions(user.id).then(setTransactions);
  }, [user?.id]);

  return (
    <Screen scroll style={[styles.container, { backgroundColor: c.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.text }]}>Wallet</Text>
      <View style={[styles.balanceCard, { backgroundColor: c.card, borderColor: c.borderLight }]}>
        <Text style={[styles.balanceLabel, { color: c.textSecondary }]}>Available balance</Text>
        <Text style={[styles.balanceAmount, { color: c.text }]}>RWF {balance.toLocaleString()}</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: c.text }]}>Recent transactions</Text>
      {transactions.length === 0 ? (
        <Text style={[styles.empty, { color: c.textMuted }]}>No transactions yet.</Text>
      ) : (
        transactions.map((tx) => (
          <View key={tx.id} style={[styles.txRow, { borderBottomColor: c.borderLight }]}>
            <View style={styles.txLeft}>
              <Ionicons name={tx.type === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle'} size={20} color={tx.type === 'credit' ? c.success : c.error} />
              <Text style={[styles.txLabel, { color: c.text }]}>{tx.label}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.type === 'credit' ? c.success : c.text }]}>
              {tx.type === 'credit' ? '+' : '-'} RWF {tx.amount.toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: landingHeaderPaddingHorizontal, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, marginBottom: spacing.xs },
  balanceCard: { padding: spacing.xl, borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.xl },
  balanceLabel: { ...typography.overline, marginBottom: spacing.xs },
  balanceAmount: { ...typography.h1 },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  empty: { ...typography.body, marginTop: spacing.sm },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  txLabel: { ...typography.bodySmall },
  txAmount: { ...typography.bodySmall, fontWeight: '600' },
});
