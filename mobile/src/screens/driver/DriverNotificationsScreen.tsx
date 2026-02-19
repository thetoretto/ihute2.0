import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { getDriverNotifications, markDriverNotificationsRead } from '../../services/mockPersistence';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, radii } from '../../utils/theme';
import type { DriverNotification } from '../../services/mockPersistence';

export default function DriverNotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    const list = await getDriverNotifications(user.id);
    setNotifications(list);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
      if (user?.id) {
        void markDriverNotificationsRead(user.id);
      }
    }, [loadNotifications, user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Screen
      scroll
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        ),
      }}
    >
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>New bookings and trip updates</Text>
      {notifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySub}>
            When a passenger books a seat on your trip, you&apos;ll see it here.
          </Text>
        </View>
      ) : (
        notifications.map((n) => (
          <TouchableOpacity key={n.id} style={styles.card} activeOpacity={0.85}>
            <View style={styles.cardIcon}>
              <Ionicons name="person-add-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>New booking</Text>
              <Text style={styles.cardText}>
                {n.passengerName} booked {n.seats} seat{n.seats > 1 ? 's' : ''} on your trip.
              </Text>
              <Text style={styles.cardTime}>{formatDate(n.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  emptyTitle: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  emptySub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardIcon: { marginRight: spacing.md },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.body, color: colors.text, fontWeight: '700' },
  cardText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  cardTime: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
