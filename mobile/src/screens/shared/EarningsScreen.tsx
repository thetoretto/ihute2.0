import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { getDriverActivitySummary, getDriverEarningsHistory } from '../../services/api';
import { spacing, typography, radii } from '../../utils/theme';

export default function EarningsScreen() {
  const { user } = useAuth();
  const c = useThemeColors();
  const [income, setIncome] = useState(0);
  const [entries, setEntries] = useState<Array<{ id: string; label: string; amount: number; date: string; type: string }>>([]);

  useEffect(() => {
    if (!user?.id) return;
    getDriverActivitySummary(user.id).then((s) => setIncome(s.income));
    getDriverEarningsHistory(user.id).then(setEntries);
  }, [user?.id]);

  return (
    <Screen scroll style={[styles.container, { backgroundColor: c.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.text }]}>Earnings</Text>
      <View style={[styles.summaryCard, { backgroundColor: c.primaryTint ?? c.primary + '20', borderColor: c.border }]}>
        <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Total income</Text>
        <Text style={[styles.summaryAmount, { color: c.text }]}>RWF {income.toLocaleString()}</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: c.text }]}>History</Text>
      {entries.length === 0 ? (
        <Text style={[styles.empty, { color: c.textMuted }]}>No earnings yet.</Text>
      ) : (
        entries.map((e) => (
          <View key={e.id} style={[styles.row, { borderBottomColor: c.borderLight }]}>
            <Text style={[styles.rowLabel, { color: c.text }]}>{e.label}</Text>
            <Text style={[styles.rowAmount, { color: c.success }]}>+ RWF {e.amount.toLocaleString()}</Text>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.lg },
  summaryCard: { padding: spacing.xl, borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.xl },
  summaryLabel: { ...typography.caption, marginBottom: spacing.xs },
  summaryAmount: { ...typography.h1 },
  sectionTitle: { ...typography.body, fontWeight: '600', marginBottom: spacing.md },
  empty: { ...typography.body, marginTop: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  rowLabel: { ...typography.bodySmall, flex: 1 },
  rowAmount: { ...typography.bodySmall, fontWeight: '600' },
});
