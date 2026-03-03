import { StyleSheet } from 'react-native';
import {
  spacing,
  radii,
  typography,
  sizes,
  borderWidths,
  cardShadow,
  cardShadowStrong,
} from './theme';
import { screenContentPadding, timelineDotSize, dividerHeight, panelRadius } from './layout';

/**
 * Shared layout/structure styles. Colors must be applied at usage site via useThemeColors().
 * Use these so no numeric width/height/padding/radius remains hardcoded in components.
 */

export const sharedStyles = StyleSheet.create({
  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: borderWidths.thin,
  },
  headerSide: {
    minWidth: sizes.touchTarget.min,
    alignItems: 'flex-start',
  },
  headerSideSpacer: {
    width: sizes.touchTarget.min,
    height: sizes.touchTarget.min,
  },
  headerIconBtn: {
    width: sizes.touchTarget.iconButton,
    height: sizes.touchTarget.iconButton,
    borderRadius: sizes.touchTarget.iconButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Avatars (circle; add backgroundColor at usage) ---
  avatarXs: {
    width: sizes.avatar.xs,
    height: sizes.avatar.xs,
    borderRadius: sizes.avatar.xs / 2,
  },
  avatarSm: {
    width: sizes.avatar.sm,
    height: sizes.avatar.sm,
    borderRadius: sizes.avatar.sm / 2,
  },
  avatarMd: {
    width: sizes.avatar.md,
    height: sizes.avatar.md,
    borderRadius: sizes.avatar.md / 2,
  },
  avatarLg: {
    width: sizes.avatar.lg,
    height: sizes.avatar.lg,
    borderRadius: sizes.avatar.lg / 2,
  },
  avatarXl: {
    width: sizes.avatar.xl,
    height: sizes.avatar.xl,
    borderRadius: sizes.avatar.xl / 2,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Chips / badges (add backgroundColor at usage) ---
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  chipIconMargin: { marginRight: spacing.xs },

  // --- Timeline ---
  timelineDot: {
    position: 'absolute',
    width: timelineDotSize,
    height: timelineDotSize,
    borderRadius: timelineDotSize / 2,
    borderWidth: borderWidths.medium,
  },
  timelineLine: {
    width: borderWidths.medium,
    marginVertical: spacing.xs,
    borderLeftWidth: borderWidths.medium,
    borderStyle: 'dashed',
    flex: 1,
    minHeight: spacing.md,
    position: 'relative',
  },
  divider: {
    height: dividerHeight,
  },

  // --- Footer bar (add backgroundColor, borderTopColor, paddingBottom at usage) ---
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: screenContentPadding,
    paddingTop: spacing.md,
    borderTopWidth: borderWidths.thin,
  },

  // --- List row ---
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // --- Panel / info block (add backgroundColor at usage) ---
  panel: {
    borderRadius: panelRadius,
    padding: spacing.md,
  },

  // --- Action button (square; add backgroundColor at usage) ---
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Sheet handle (add backgroundColor at usage) ---
  sheetHandle: {
    width: sizes.sheetHandle.width,
    height: sizes.sheetHandle.height,
    borderRadius: sizes.sheetHandle.height / 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
});

/** Re-export shadow presets so components never use raw shadow literals. */
export { cardShadow, cardShadowStrong };
