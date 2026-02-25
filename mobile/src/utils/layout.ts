import { spacing, radii, typography } from './theme';

/**
 * Horizontal padding for screen content. Align with Screen's horizontalPadding
 * when using layout constants in StyleSheet (static) or use useResponsiveLayout().horizontalPadding in components.
 */
export const screenContentPadding = spacing.lg;

/**
 * Bottom padding for list content on tab screens (clears tab bar).
 */
export const listBottomPaddingTab = spacing.xl + 80;

/**
 * Bottom padding for list content on stack-only or modal screens.
 */
export const listBottomPaddingDefault = spacing.xl;

/**
 * Standard radius for content cards and panels across the app.
 */
export const cardRadius = radii.lg;

/**
 * Section title style for consistent headings on list and detail screens.
 */
export const sectionTitleStyle = {
  ...typography.h3,
  fontWeight: '700' as const,
  marginBottom: spacing.sm,
};
