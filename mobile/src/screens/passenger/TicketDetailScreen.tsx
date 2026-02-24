import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Button, Screen } from '../../components';
import { getBookingTicket, shareTicketPdf } from '../../services/api';
import { colors, spacing, typography, radii } from '../../utils/theme';
import type { BookingTicket } from '../../types';

type Params = {
  TicketDetail: { bookingId: string };
};

export default function TicketDetailScreen() {
  const route = useRoute<RouteProp<Params, 'TicketDetail'>>();
  const [ticket, setTicket] = React.useState<BookingTicket | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState(false);

  const loadTicket = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBookingTicket(route.params.bookingId);
      setTicket(data);
    } catch (e) {
      setTicket(null);
      setError(e instanceof Error ? e.message : 'Ticket unavailable.');
    } finally {
      setLoading(false);
    }
  }, [route.params.bookingId]);

  React.useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  const onDownload = async () => {
    if (!ticket || downloading) {
      return;
    }
    try {
      setDownloading(true);
      await shareTicketPdf(ticket.bookingId);
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : 'Unable to share ticket.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.muted}>Loading ticket...</Text>
      </Screen>
    );
  }

  if (!ticket) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.muted}>{error ?? 'Ticket unavailable.'}</Text>
        <Button title="Retry" onPress={() => void loadTicket()} style={styles.retryBtn} />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.ticketCard}>
        <View style={styles.header}>
          <Ionicons name="ticket-outline" size={18} color={colors.primary} />
          <Text style={styles.title}>Passenger Ticket</Text>
        </View>
        <Text style={styles.ticketNo}>{ticket.ticketNumber}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>From</Text>
          <Text style={styles.value}>{ticket.from}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>To</Text>
          <Text style={styles.value}>{ticket.to}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Driver</Text>
          <Text style={styles.value}>{ticket.driverName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Passenger</Text>
          <Text style={styles.value}>{ticket.passengerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Departure</Text>
          <Text style={styles.value}>{ticket.departureTime}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Seats</Text>
          <Text style={styles.value}>
            {ticket.seats} {ticket.isFullCar ? '(Full car)' : ''}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment</Text>
          <Text style={styles.value}>{ticket.paymentMethod.replace('_', ' ')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment status</Text>
          <Text style={styles.value}>{ticket.paymentStatus.replace('_', ' ')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.amount}>{Number(ticket.amountTotal).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Issued</Text>
          <Text style={styles.value}>{new Date(ticket.issuedAt).toLocaleString()}</Text>
        </View>
        <View style={styles.qrWrap}>
          <QRCode
            value={ticket.qrPayload}
            size={174}
            color={colors.text}
            backgroundColor={colors.card}
          />
          <Text style={styles.qrHelp}>Driver scans this QR to validate your ticket</Text>
        </View>
      </View>

      <Button title={downloading ? 'Preparing PDF...' : 'Download PDF ticket'} onPress={onDownload} disabled={downloading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: {
    ...typography.body,
    color: colors.textSecondary,
  },
  retryBtn: { marginTop: spacing.md, minWidth: 140 },
  ticketCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  ticketNo: {
    ...typography.caption,
    color: colors.primaryTextOnLight,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  amount: {
    ...typography.body,
    color: colors.success,
    fontWeight: '700',
  },
  qrWrap: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  qrHelp: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
