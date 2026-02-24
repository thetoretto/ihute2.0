import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, Screen } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getConversations } from '../../services/api';
import type { ConversationListItem } from '../../services/api';
import { mockUsers } from '../../services/mockData';
import { colors, spacing, typography } from '../../utils/theme';

// Driver (for a given booking/trip) and Agency/Support (ticket & claim) conversations
const mockConversations: ConversationListItem[] = [
  {
    id: 'c1',
    otherUser: mockUsers[1], // Camille – driver
    lastMessage: 'See you at the pickup!',
    unreadCount: 2,
    updatedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    scopeLabel: 'Ticket & claim',
  },
  {
    id: 'c2',
    otherUser: mockUsers[6], // Kigali Express – agency/support
    lastMessage: 'We’ll look into your claim and get back within 24h.',
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    scopeLabel: 'Ticket & claim',
  },
  {
    id: 'c3',
    otherUser: mockUsers[2], // Claire – driver
    lastMessage: 'Thanks for the ride',
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    scopeLabel: 'Ticket & claim',
  },
];

export default function MessagesScreen() {
  const navigation = useNavigation<any>();
  const c = useThemeColors();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);

  useEffect(() => {
    if (user?.id) {
      getConversations(user.id)
        .then((list) => setConversations(list.length ? list : [...mockConversations].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))))
        .catch(() => setConversations([...mockConversations].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))));
    } else {
      setConversations([...mockConversations].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)));
    }
  }, [user?.id]);

  if (conversations.length === 0) {
    return (
      <Screen style={styles.container}>
        <EmptyState
          title="No messages yet"
          subtitle="Start a ride to message drivers or passengers."
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: c.border }]}
            onPress={() => {
              setConversations((prev) =>
                prev.map((conv) => (conv.id === item.id ? { ...conv, unreadCount: 0 } : conv))
              );
              return (
              (navigation.getParent() as any)?.navigate('Chat', {
                conversationId: item.id,
                otherUser: item.otherUser,
              })
              );
            }}
          >
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: c.surface }]}>
              <Ionicons name="person" size={28} color={c.textMuted} />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.name, { color: c.text }]}>{item.otherUser.name}</Text>
              {item.scopeLabel ? (
                <Text style={[styles.scopeLabel, { color: c.primary }]}>{item.scopeLabel}</Text>
              ) : null}
              <Text style={[styles.preview, { color: c.textSecondary }]}>{item.lastMessage ?? ''}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={[styles.timeText, { color: c.textMuted }]}>{new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              {item.unreadCount > 0 ? (
                <View style={[styles.unreadBadge, { backgroundColor: c.primary }]}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textWrap: { flex: 1 },
  name: { ...typography.body, color: colors.text, fontWeight: '600' },
  scopeLabel: { ...typography.caption, color: colors.primary, marginBottom: spacing.xs },
  preview: { ...typography.bodySmall, color: colors.textSecondary },
  metaCol: { alignItems: 'flex-end', marginRight: spacing.sm, minWidth: 42 },
  timeText: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  unreadText: { ...typography.caption, color: colors.onPrimary, fontWeight: '700' },
  listContent: { paddingBottom: spacing.lg },
});
