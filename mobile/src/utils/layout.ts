import { spacing, radii, typography, sizes } from './theme';

/**
 * UI Component Offsets
 * Grouping these allows for easier updates if the UI library changes.
 */
const OFFSETS = {
  TAB_BAR_HEIGHT: 80,
  FAB_HEIGHT: 72,
  FOOTER_HEIGHT: 72,
  DIVIDER: 1,
};

/** Design system: max viewport width (mobile-first, centered on desktop). */
export const MAX_VIEWPORT_WIDTH = 450;

/** Design system: content padding bottom so scroll clears floating nav. */
export const CONTENT_PADDING_BOTTOM_TAB_SCREEN = 120;

/** Toast offset above tab bar (bottom-28). */
export const TOAST_BOTTOM_OFFSET = 28;

/** Toast container bottom position (above floating nav). */
export const TOAST_BOTTOM = OFFSETS.TAB_BAR_HEIGHT + TOAST_BOTTOM_OFFSET;

/**
 * Screen & Container Padding
 * Single canonical horizontal inset (24px) for all roles so content aligns with LandingHeader.
 */
export const layout = {
  screen: {
    horizontal: spacing.lg,
    searchHorizontal: spacing.lg,
  },

  driver: {
    contentHorizontal: spacing.lg,
  },
  
  // Lists & Scrolling
  list: {
    headerVertical: spacing.lg,
    headerHorizontal: spacing.md, // Keeping in sync with screen.horizontal
    contentTop: spacing.sm,
    gapTight: spacing.xxs,
    
    // Bottom Paddings (Logical grouping)
    bottom: {
      default: spacing.xl,
      tabScreen: CONTENT_PADDING_BOTTOM_TAB_SCREEN,
      withFab: spacing.xl + OFFSETS.FAB_HEIGHT,
      withFooter: spacing.xxl + OFFSETS.FOOTER_HEIGHT,
      multiStepFlow: 220,
    },
  },

  // Components
  card: {
    radius: radii.lg,
    panelRadius: radii.panel,
  },

  // Interactive Elements
  header: {
    buttonSize: sizes.touchTarget.iconButton,
    iconSize: sizes.icon.medium,
  },

  // Landing (no-bar) header – asymmetric padding
  landingHeader: {
    paddingTop: 32,
    paddingHorizontal: 24,
  },

  // Specialized UI
  timeline: {
    dot: sizes.timelineDot,
    dotLg: sizes.timelineDotLg,
    divider: OFFSETS.DIVIDER,
  },
};

/**
 * Shared Typography Styles
 */
export const sharedStyles = {
  sectionTitle: {
    ...typography.h3,
    fontWeight: '700' as const,
    marginBottom: spacing.sm,
  },
};

// For backward compatibility or specific direct imports
export const screenContentPadding = layout.screen.horizontal;
export const dividerHeight = OFFSETS.DIVIDER;
export const timelineDotSize = layout.timeline.dot;
export const panelRadius = layout.card.panelRadius;
export const contentBottomPaddingWithFooter = layout.list.bottom.withFooter;
export const timelineDotSizeLg = layout.timeline.dotLg;
export const cardRadius = layout.card.radius;
export const listBottomPaddingTab = layout.list.bottom.tabScreen;
export const listBottomPaddingDefault = layout.list.bottom.default;
export const sectionTitleStyle = sharedStyles.sectionTitle;
export const tightGap = layout.list.gapTight;
export const searchResultsListPadding = layout.screen.searchHorizontal;
export const scrollStepBottomPadding = 120;
export const listScreenHeaderPaddingVertical = layout.list.headerVertical;
export const listScreenHeaderPaddingHorizontal = layout.list.headerHorizontal;
export const driverContentHorizontal = layout.driver.contentHorizontal;
export const landingHeaderPaddingTop = layout.landingHeader.paddingTop;
export const landingHeaderPaddingHorizontal = layout.landingHeader.paddingHorizontal;