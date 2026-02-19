import { useMemo } from 'react';
import * as theme from './theme';
import { useResponsiveLayout } from './responsive';

const TABLET_SCALE = 1.1;
const MIN_TOUCH_TARGET = 44;

export type ResponsiveSpacing = typeof theme.spacing;
export type ResponsiveTypography = typeof theme.typography;
export type ResponsiveButtonHeights = typeof theme.buttonHeights;
export type ResponsiveRadii = typeof theme.radii;

export interface ResponsiveTheme {
  spacing: ResponsiveSpacing;
  typography: ResponsiveTypography;
  buttonHeights: ResponsiveButtonHeights;
  radii: ResponsiveRadii;
  /** Layout values from useResponsiveLayout for convenience */
  layout: {
    horizontalPadding: number;
    tabBarHeight: number;
    isTablet: boolean;
    isPhone: boolean;
    width: number;
    height: number;
    maxContentWidth: number;
  };
}

function scaleSpacing(base: ResponsiveSpacing, scale: number): ResponsiveSpacing {
  return {
    xs: Math.round(base.xs * scale),
    sm: Math.round(base.sm * scale),
    md: Math.round(base.md * scale),
    lg: Math.round(base.lg * scale),
    xl: Math.round(base.xl * scale),
    xxl: Math.round(base.xxl * scale),
  };
}

function scaleTypography(base: ResponsiveTypography, scale: number): ResponsiveTypography {
  const scaleFont = (n: number) => Math.round(n * scale);
  return {
    h1:        { ...base.h1, fontSize: scaleFont(base.h1.fontSize) },
    h2:        { ...base.h2, fontSize: scaleFont(base.h2.fontSize) },
    h3:        { ...base.h3, fontSize: scaleFont(base.h3.fontSize) },
    body:      { ...base.body, fontSize: scaleFont(base.body.fontSize) },
    bodySmall: { ...base.bodySmall, fontSize: scaleFont(base.bodySmall.fontSize) },
    caption:   { ...base.caption, fontSize: scaleFont(base.caption.fontSize) },
  };
}

function scaleButtonHeights(base: ResponsiveButtonHeights, scale: number): ResponsiveButtonHeights {
  const small = Math.max(MIN_TOUCH_TARGET, Math.round(base.small * scale));
  const medium = Math.max(MIN_TOUCH_TARGET, Math.round(base.medium * scale));
  const large = Math.max(MIN_TOUCH_TARGET, Math.round(base.large * scale));
  return { small, medium, large };
}

function scaleRadii(base: ResponsiveRadii, scale: number): ResponsiveRadii {
  return {
    sm: Math.round(base.sm * scale),
    button: Math.round(base.button * scale),
    md: Math.round(base.md * scale),
    lg: Math.round(base.lg * scale),
    xl: Math.round(base.xl * scale),
    full: base.full,
  };
}

export function useResponsiveTheme(): ResponsiveTheme {
  const layout = useResponsiveLayout();
  return useMemo(() => {
    const scale = layout.isTablet ? TABLET_SCALE : 1;
    return {
      spacing: scale === 1 ? theme.spacing : scaleSpacing(theme.spacing, scale),
      typography: scale === 1 ? theme.typography : scaleTypography(theme.typography, scale),
      buttonHeights: scale === 1 ? theme.buttonHeights : scaleButtonHeights(theme.buttonHeights, scale),
      radii: scale === 1 ? theme.radii : scaleRadii(theme.radii, scale),
      layout: {
        horizontalPadding: layout.horizontalPadding,
        tabBarHeight: layout.tabBarHeight,
        isTablet: layout.isTablet,
        isPhone: layout.isPhone,
        width: layout.width,
        height: layout.height,
        maxContentWidth: layout.maxContentWidth,
      },
    };
  }, [
    layout.isTablet,
    layout.horizontalPadding,
    layout.tabBarHeight,
    layout.width,
    layout.height,
    layout.maxContentWidth,
  ]);
}
