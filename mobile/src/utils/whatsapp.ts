import { Linking, Alert } from 'react-native';
import { strings } from '../constants/strings';

/** WhatsApp number for dispute/support (digits only, e.g. 250788123456). From EXPO_PUBLIC_DISPUTE_WHATSAPP_NUMBER or fallback. */
const DEFAULT_DISPUTE_WHATSAPP_NUMBER = '250788123456';

function getDisputeWhatsAppNumber(): string {
  const env = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DISPUTE_WHATSAPP_NUMBER;
  const raw = typeof env === 'string' && env.trim() ? env.trim() : DEFAULT_DISPUTE_WHATSAPP_NUMBER;
  return raw.replace(/\D/g, '') || DEFAULT_DISPUTE_WHATSAPP_NUMBER;
}

export interface OpenWhatsAppDisputeContext {
  otherUserId?: string;
  otherUserName?: string;
  tripId?: string;
}

/**
 * Builds a short pre-filled message for dispute context.
 */
function buildDisputeMessage(context?: OpenWhatsAppDisputeContext): string {
  if (!context) return '';
  const parts: string[] = [];
  if (context.otherUserName || context.otherUserId) {
    parts.push(`Dispute regarding user: ${context.otherUserName ?? 'Unknown'}${context.otherUserId ? ` (ID: ${context.otherUserId})` : ''}`);
  }
  if (context.tripId) {
    parts.push(`Trip ID: ${context.tripId}`);
  }
  return parts.join('\n').trim();
}

const WHATSAPP_URL_PREFIX = 'https://wa.me/';

/**
 * Opens WhatsApp to the configured dispute/support number with an optional pre-filled message.
 * On failure, shows an alert with the number so the user can contact support manually.
 */
export async function openWhatsAppDispute(context?: OpenWhatsAppDisputeContext): Promise<void> {
  const number = getDisputeWhatsAppNumber();
  const message = buildDisputeMessage(context);
  const url = message
    ? `${WHATSAPP_URL_PREFIX}${number}?text=${encodeURIComponent(message)}`
    : `${WHATSAPP_URL_PREFIX}${number}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('WhatsApp unavailable', strings.profile.disputeWhatsAppUnavailable(number));
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open WhatsApp', strings.profile.disputeOpenFailed(number));
  }
}
