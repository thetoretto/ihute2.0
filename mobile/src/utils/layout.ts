import { spacing, radii, typography, sizes } from './theme';

/**
 * Horizontal padding for screen content. Align with Screen's horizontalPadding
 * when using layout constants in StyleSheet (static) or use useResponsiveLayout().horizontalPadding in components.
 */
export const screenContentPadding = spacing.lg;

/**
 * Smaller horizontal padding for the search results list so trip cards span more width on mobile.
 */
export const searchResultsListPadding = spacing.md;

/**
 * Bottom padding for list content on tab screens (clears tab bar).
 */
export const listBottomPaddingTab = spacing.xl + 80;

/**
 * Bottom padding for list content on stack-only or modal screens.
 */
export const listBottomPaddingDefault = spacing.xl;

/**
 * Vertical and horizontal padding for the header/tabs area on list screens.
 */
export const listScreenHeaderPaddingVertical = spacing.lg;
export const listScreenHeaderPaddingHorizontal = screenContentPadding;

/**
 * Top padding for list content below header/tabs.
 */
export const listContentPaddingTop = spacing.sm;

/**
 * FAB bottom offset and list bottom padding when a FAB is present.
 */
export const fabBottomOffset = spacing.sm;
export const listBottomPaddingWithFab = listBottomPaddingDefault + 72;

/**
 * Tight vertical gap for card elements (replaces magic 2).
 */
export const tightGap = spacing.xxs;

/**
 * Standard radius for content cards and panels across the app.
 */
export const cardRadius = radii.lg;

/**
 * Panel / info block radius (e.g. blablacar card, detail info block).
 */
export const panelRadius = radii.panel;

/**
 * Header bar: icon button and icon sizes (from theme sizes).
 */
export const headerIconButtonSize = sizes.touchTarget.iconButton;
export const headerIconSize = sizes.icon.medium;

/**
 * Timeline dot size and divider.
 */
export const timelineDotSize = sizes.timelineDot;
export const timelineDotSizeLg = sizes.timelineDotLg;

/**
 * Extra content padding when a fixed footer is present (avoids content hidden behind CTA).
 */
export const contentBottomPaddingWithFooter = spacing.xxl + 72;

/**
 * Bottom padding for scroll content in multi-step flows (e.g. PassengerBookingScreen).
 */
export const scrollStepBottomPadding = 220;
export const dividerHeight = 1;

/**
 * Section title style for consistent headings on list and detail screens.
 */
export const sectionTitleStyle = {
  ...typography.h3,
  fontWeight: '700' as const,
  marginBottom: spacing.sm,
};
