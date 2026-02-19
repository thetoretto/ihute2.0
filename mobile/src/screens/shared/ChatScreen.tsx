import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';

const TAB_BAR_HEIGHT = 66;

type Params = {
  Chat: { conversationId: string; otherUser: { id: string; name: string } };
};

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
}

export default function ChatScreen() {
  const route = useRoute<RouteProp<Params, 'Chat'>>();
  const { otherUser } = route.params;
  const listRef = React.useRef<FlatList<Message> | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hi! Is the ride still available?', senderId: otherUser.id, timestamp: new Date().toISOString() },
    { id: '2', text: 'Yes! See you at the pickup.', senderId: 'me', timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastState, setLastState] = useState<'sent' | 'read'>('read');

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: input.trim(),
        senderId: 'me',
        timestamp: new Date().toISOString(),
      },
    ]);
    setInput('');
    setLastState('sent');
    setTimeout(() => {
      setIsTyping(true);
    }, 500);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-reply`,
          text: 'Got it. See you soon.',
          senderId: otherUser.id,
          timestamp: new Date().toISOString(),
        },
      ]);
      setLastState('read');
    }, 1600);
  };

  React.useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={TAB_BAR_HEIGHT}
      >
        <View style={styles.banner}>
          <Text style={styles.bannerText}>This chat is for ticket and claim questions only.</Text>
        </View>
        <FlatList
          ref={listRef}
          style={styles.list}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.senderId === 'me' ? styles.bubbleMe : styles.bubbleThem,
              ]}
            >
              <Text
                style={[styles.bubbleText, item.senderId === 'me' && styles.bubbleTextMe]}
              >
                {item.text}
              </Text>
            </View>
          )}
        />
        {isTyping ? <Text style={styles.typing}>Typing...</Text> : null}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message (ticket & claim only)"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardWrap: { flex: 1 },
  banner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryTint,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bannerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: { flex: 1 },
  messagesContent: { paddingBottom: spacing.md, paddingTop: spacing.sm },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: 12,
    margin: spacing.sm,
    alignSelf: 'flex-start',
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  bubbleThem: {
    backgroundColor: colors.surface,
  },
  bubbleText: { ...typography.body, color: colors.text },
  bubbleTextMe: { color: colors.onPrimary },
  typing: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 24,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  sendBtn: {
    padding: spacing.sm,
  },
});
