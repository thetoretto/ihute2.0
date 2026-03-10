import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Button, Screen } from '../../components';
import { getBookingTicket, shareTicketPdf } from '../../services/api';
import { spacing, typography, radii } from '../../utils/theme';
import { landingHeaderPaddingHorizontal, listScreenHeaderPaddingVertical } from '../../utils/layout';
import { useThemeColors } from '../../context/ThemeContext';
import type { BookingTicket } from '../../types';

type Params = {
  TicketDetail: { bookingId: string };
};

export default function TicketDetailScreen() {
  const route = useRoute<RouteProp<Params, 'TicketDetail'>>();
  const c = useThemeColors();
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
      <Screen style={[styles.center, { backgroundColor: c.appBackground }]}>
        <Text style={[styles.muted, { color: c.textSecondary }]}>Loading ticket...</Text>
      </Screen>
    );
  }

  if (!ticket) {
    return (
      <Screen style={[styles.center, { backgroundColor: c.appBackground }]}>
        <Text style={[styles.muted, { color: c.textSecondary }]}>{error ?? 'Ticket unavailable.'}</Text>
        <Button title="Retry" onPress={() => void loadTicket()} style={styles.retryBtn} />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={[styles.ticketCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.header}>
          <Ionicons name="ticket-outline" size={18} color={c.primary} />
          <Text style={[styles.title, { color: c.text }]}>Passenger Ticket</Text>
        </View>
        <Text style={[styles.ticketNo, { color: c.text }]}>{ticket.ticketNumber}</Text>

        <View style={styles.row}>
          <Text style={[styles.label, { color: c.textSecondary }]}>From</Text>
          <Text style={[styles.value, { color: c.text }]}>{ticket.from}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.textSecondary }]}>To</Text>
          <Text style={[styles.value, { color: c.text }]}>{ticket.to}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Driver</Text>
          <Text style={[styles.value, { color: c.text }]}>{ticket.driverName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Passenger</Text>
          <Text style={[styles.value, { color: c.text }]}>{ticket.passengerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Departure</Text>
          <Text style={[styles.value, { color: c.text }]}>{ticket.departureTime}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Seats</Text>
          <Text style={[styles.value, { color: c.text }]}>
            {ticket.seats} {ticket.isFullCar ? '(Full car)' : ''}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Payment</Text>
          <Text style={[styles.value, { color: c.text }]}>{ticket.paymentMethod.replace('_', ' ')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Payment status</Text>
          <Text style={[styles.value, { color: c.text }]}>{ticket.paymentStatus.replace('_', ' ')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Total</Text>
          <Text style={[styles.amount, { color: c.success }]}>{Number(ticket.amountTotal).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Issued</Text>
          <Text style={[styles.value, { color: c.text }]}>{new Date(ticket.issuedAt).toLocaleString()}</Text>
        </View>
        <View style={[styles.qrWrap, { borderColor: c.borderLight, backgroundColor: c.surface }]}>
          <QRCode
            value={ticket.qrPayload}
            size={174}
            color={c.text}
            backgroundColor={c.card}
          />
          <Text style={[styles.qrHelp, { color: c.textSecondary }]}>Driver scans this QR to validate your ticket</Text>
        </View>
      </View>

      <Button title={downloading ? 'Preparing PDF...' : 'Download PDF ticket'} onPress={onDownload} disabled={downloading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingTop: listScreenHeaderPaddingVertical,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: {
    ...typography.body,
  },
  retryBtn: { marginTop: spacing.md, minWidth: 140 },
  ticketCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
  },
  ticketNo: {
    ...typography.bodyBold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    flex: 1,
  },
  value: {
    ...typography.body,
    fontWeight: '600',
  },
  amount: {
    ...typography.bodyBold,
    fontWeight: '700',
  },
  qrWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  qrHelp: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});
