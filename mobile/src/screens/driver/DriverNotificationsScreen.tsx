import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { getDriverNotifications, markDriverNotificationsRead } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, radii, cardShadow } from '../../utils/theme';
import { cardRadius, listBottomPaddingDefault } from '../../utils/layout';
import { useThemeColors } from '../../context/ThemeContext';
import type { DriverNotification } from '../../services/api';

export default function DriverNotificationsScreen() {
  const { user } = useAuth();
  const c = useThemeColors();
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} tintColor={c.primary} />
        ),
      }}
    >
      <Text style={[styles.title, { color: c.text }]}>Notifications</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>New bookings and trip updates</Text>
      {notifications.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}>
          <Ionicons name="notifications-off-outline" size={40} color={c.textMuted} />
          <Text style={[styles.emptyTitle, { color: c.text }]}>No notifications yet</Text>
          <Text style={[styles.emptySub, { color: c.textSecondary }]}>
            When a passenger books a seat on your trip, you&apos;ll see it here.
          </Text>
        </View>
      ) : (
        notifications.map((n, index) => (
          <TouchableOpacity
            key={n.id}
            style={[
              styles.card,
              { backgroundColor: c.card, borderColor: c.border },
              cardShadow,
              index === 0 && { borderLeftWidth: 4, borderLeftColor: c.primary },
            ]}
            activeOpacity={0.85}
          >
            <View style={[styles.cardIcon, { backgroundColor: c.primaryTint }]}>
              <Ionicons name="person-add-outline" size={24} color={c.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: c.text }]}>New booking</Text>
              <Text style={[styles.cardText, { color: c.textSecondary }]}>
                {n.passengerName} booked {n.seats} seat{n.seats > 1 ? 's' : ''} on your trip.
              </Text>
              <Text style={[styles.cardTime, { color: c.textSecondary }]}>{formatDate(n.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingBottom: listBottomPaddingDefault },
  title: { ...typography.h2 },
  subtitle: { ...typography.bodySmall, marginTop: spacing.xs, marginBottom: spacing.lg },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: cardRadius,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  emptyTitle: { ...typography.h3, marginTop: spacing.md },
  emptySub: { ...typography.bodySmall, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderRadius: cardRadius,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  cardIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.body, fontWeight: '700' },
  cardText: { ...typography.bodySmall, marginTop: spacing.xs },
  cardTime: { ...typography.caption, marginTop: spacing.xs },
});
