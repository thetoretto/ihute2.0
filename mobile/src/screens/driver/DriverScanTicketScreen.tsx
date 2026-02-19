import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Screen } from '../../components';
import { validateTicketQr } from '../../services/mockApi';
import { incrementScannerTicketCount } from '../../services/mockPersistence';
import { buttonHeights, colors, spacing, typography, radii } from '../../utils/theme';
import type { TicketQrValidationResult } from '../../types';

export default function DriverScanTicketScreen() {
  const { user } = useAuth();
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
        <Ionicons name="camera-outline" size={28} color={colors.primary} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.muted}>
          Allow camera permission to scan passenger QR tickets.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={() => void requestPermission()}>
          <Text style={styles.permissionBtnText}>Grant permission</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.cameraWrap}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleScan}
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Scan passenger ticket QR</Text>
        <Text style={styles.panelText}>
          Keep QR inside the frame for one-shot validation.
        </Text>
        {isValidating ? <Text style={styles.muted}>Validating ticket...</Text> : null}

        {result ? (
          <View style={[styles.resultCard, result.valid ? styles.validCard : styles.invalidCard]}>
            <Text style={[styles.resultTitle, result.valid ? styles.validText : styles.invalidText]}>
              {result.valid ? 'Ticket valid' : 'Ticket invalid'}
            </Text>
            {result.ticket ? (
              <>
                <Text style={styles.resultLine}>
                  {result.ticket.from} → {result.ticket.to}
                </Text>
                <Text style={styles.resultLine}>Passenger: {result.ticket.passengerName}</Text>
                <Text style={styles.resultLine}>Seats: {result.ticket.seats}</Text>
                <Text style={styles.resultLine}>Departure: {result.ticket.departureTime}</Text>
              </>
            ) : null}
            {!result.valid && result.reason ? (
              <Text style={styles.resultLine}>Reason: {result.reason}</Text>
            ) : null}
            <Text style={styles.resultMeta}>
              Scanned: {new Date(result.scannedAt).toLocaleString()}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.scanAgainBtn} onPress={onScanAgain}>
          <Ionicons name="refresh-outline" size={15} color={colors.primary} />
          <Text style={styles.scanAgainText}>Scan again</Text>
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
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  camera: {
    width: '100%',
    aspectRatio: 1.15,
  },
  panel: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  panelTitle: { ...typography.h3, color: colors.text },
  panelText: { ...typography.bodySmall, color: colors.textSecondary },
  resultCard: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
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
