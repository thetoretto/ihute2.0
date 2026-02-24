import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Screen } from '../../components';
import { validateTicketQr } from '../../services/api';
import { incrementScannerTicketCount } from '../../services/api';
import { buttonHeights, colors, spacing, typography, radii, cardShadow } from '../../utils/theme';
import { useThemeColors } from '../../context/ThemeContext';
import type { TicketQrValidationResult } from '../../types';

const PANEL_RADIUS = 24;

export default function DriverScanTicketScreen() {
  const { user } = useAuth();
  const c = useThemeColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);
  const [result, setResult] = React.useState<TicketQrValidationResult | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  const handleScan = async (scan: BarcodeScanningResult) => {
    if (scanned || isValidating) {
      return;
    }
    setScanned(true);
    setIsValidating(true);
    const validation = await validateTicketQr(scan.data, user ?? undefined);
    setResult(validation);
    if (validation.valid && user?.agencySubRole === 'agency_scanner') {
      void incrementScannerTicketCount();
    }
    setIsValidating(false);
  };

  const onScanAgain = () => {
    setResult(null);
    setScanned(false);
  };

  if (!permission) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.muted}>Checking camera permission...</Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen style={styles.center}>
        <Ionicons name="camera-outline" size={28} color={c.primary} />
        <Text style={[styles.permissionTitle, { color: c.text }]}>Camera access needed</Text>
        <Text style={[styles.muted, { color: c.textSecondary }]}>
          Allow camera permission to scan passenger QR tickets.
        </Text>
        <TouchableOpacity style={[styles.permissionBtn, { backgroundColor: c.primary }]} onPress={() => void requestPermission()}>
          <Text style={[styles.permissionBtnText, { color: c.onPrimary }]}>Grant permission</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={[styles.cameraWrap, { borderColor: c.border }, cardShadow]}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleScan}
        />
      </View>

      <View style={[styles.panel, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}>
        <Text style={[styles.panelTitle, { color: c.text }]}>Scan passenger ticket QR</Text>
        <Text style={[styles.panelText, { color: c.textSecondary }]}>
          Keep QR inside the frame for one-shot validation.
        </Text>
        {isValidating ? <Text style={[styles.muted, { color: c.textSecondary }]}>Validating ticket...</Text> : null}

        {result ? (
          <View style={[styles.resultCard, result.valid ? styles.validCard : styles.invalidCard]}>
            <Text style={[styles.resultTitle, result.valid ? styles.validText : styles.invalidText]}>
              {result.valid ? 'Ticket valid' : 'Ticket invalid'}
            </Text>
            {result.ticket ? (
              <>
                <Text style={[styles.resultLine, { color: c.text }]}>
                  {result.ticket.from} → {result.ticket.to}
                </Text>
                <Text style={[styles.resultLine, { color: c.text }]}>Passenger: {result.ticket.passengerName}</Text>
                <Text style={[styles.resultLine, { color: c.text }]}>Seats: {result.ticket.seats}</Text>
                <Text style={[styles.resultLine, { color: c.text }]}>Departure: {result.ticket.departureTime}</Text>
              </>
            ) : null}
            {!result.valid && result.reason ? (
              <Text style={[styles.resultLine, { color: c.text }]}>Reason: {result.reason}</Text>
            ) : null}
            <Text style={[styles.resultMeta, { color: c.textSecondary }]}>
              Scanned: {new Date(result.scannedAt).toLocaleString()}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.scanAgainBtn, { backgroundColor: c.primary }]} onPress={onScanAgain}>
          <Ionicons name="refresh-outline" size={15} color={c.onPrimary} />
          <Text style={[styles.scanAgainText, { color: c.onPrimary }]}>Scan again</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  muted: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  permissionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  permissionBtn: {
    marginTop: spacing.md,
    minHeight: buttonHeights.small,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.primaryButtonBorder,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  permissionBtnText: {
    ...typography.bodySmall,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  cameraWrap: {
    marginTop: spacing.md,
    borderRadius: PANEL_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  camera: {
    width: '100%',
    aspectRatio: 1.15,
  },
  panel: {
    marginTop: spacing.md,
    borderRadius: PANEL_RADIUS,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  panelTitle: { ...typography.h3 },
  panelText: { ...typography.bodySmall },
  resultCard: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.xs,
  },
  validCard: {
    borderColor: colors.success,
    backgroundColor: colors.successTint,
  },
  invalidCard: {
    borderColor: colors.error,
    backgroundColor: colors.surfaceElevated,
  },
  resultTitle: {
    ...typography.body,
    fontWeight: '700',
  },
  validText: { color: colors.success },
  invalidText: { color: colors.error },
  resultLine: {
    ...typography.caption,
    color: colors.text,
  },
  resultMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scanAgainBtn: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: buttonHeights.small,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primaryButtonBorder,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
  },
  scanAgainText: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
