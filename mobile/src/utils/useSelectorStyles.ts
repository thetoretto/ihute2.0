import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useThemeColors } from '../context/ThemeContext';
import { spacing, radii, typography, buttonHeights } from './theme';

/**
 * Theme-aware selector/modal styles for pickers and bottom sheets.
 * Use instead of static selectorStyles when modals must respect light/dark mode.
 */
export function useSelectorStyles() {
  const c = useThemeColors();
  return useMemo(
    () => ({
      overlay: {
        flex: 1,
        backgroundColor: c.overlayModal ?? c.overlay,
        justifyContent: 'flex-end' as const,
      },
      sheet: {
        backgroundColor: c.card ?? c.popupSurface,
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        maxHeight: '80%' as const,
        padding: spacing.lg,
      },
      searchRow: {
        flexDirection: 'row' as const,
        alignItems: 'center',
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
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
        color: c.text,
      },
      optionRow: {
        flexDirection: 'row' as const,
        alignItems: 'center',
        paddingVertical: spacing.md,
        gap: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
      },
      optionText: { flex: 1 },
      optionPrimary: { ...typography.body, color: c.text, fontWeight: '600' as const },
      optionSecondary: { ...typography.caption, color: c.textSecondary },
      closeButton: {
        marginTop: spacing.lg,
        padding: spacing.md,
        alignItems: 'center' as const,
        backgroundColor: c.primary,
        borderRadius: radii.button,
      },
      closeButtonText: { ...typography.body, color: c.onPrimary },
      trigger: {
        flexDirection: 'row' as const,
        alignItems: 'center',
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: radii.md,
        minHeight: buttonHeights.large,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
      },
      triggerText: { flex: 1, ...typography.body, color: c.text },
      triggerPlaceholder: { color: c.textMuted },
    }),
    [c]
  );
}
