import { StyleSheet } from 'react-native';
import { colors, spacing, radii, typography, buttonHeights } from './theme';

/**
 * Unified selector design: trigger, sheet/modal, and option row.
 * Use these styles so all pickers (location, date, role, etc.) look the same.
 */
export const selectorStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    minHeight: buttonHeights.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  triggerText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  triggerPlaceholder: {
    color: colors.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.popupSurface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '80%',
    padding: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    minHeight: buttonHeights.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  optionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionText: { flex: 1 },
  optionPrimary: { ...typography.body, color: colors.text, fontWeight: '600' as const },
  optionSecondary: { ...typography.caption, color: colors.textSecondary },
  closeButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.button,
  },
  closeButtonText: { ...typography.body, color: colors.onPrimary },
});
