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
    xxs: Math.round(base.xxs * scale) as ResponsiveSpacing['xxs'],
    xs: Math.round(base.xs * scale) as ResponsiveSpacing['xs'],
    smDense: Math.round(base.smDense * scale) as ResponsiveSpacing['smDense'],
    sm: Math.round(base.sm * scale) as ResponsiveSpacing['sm'],
    md: Math.round(base.md * scale) as ResponsiveSpacing['md'],
    lg: Math.round(base.lg * scale) as ResponsiveSpacing['lg'],
    xl: Math.round(base.xl * scale) as ResponsiveSpacing['xl'],
    xxl: Math.round(base.xxl * scale) as ResponsiveSpacing['xxl'],
  };
}

function scaleTypography(base: ResponsiveTypography, scale: number): ResponsiveTypography {
  const scaleFont = (n: number) => Math.round(n * scale);
  return {
    ...base,
    h1:        { ...base.h1, fontSize: scaleFont(base.h1.fontSize) as ResponsiveTypography['h1']['fontSize'] },
    h2:        { ...base.h2, fontSize: scaleFont(base.h2.fontSize) as ResponsiveTypography['h2']['fontSize'] },
    h3:        { ...base.h3, fontSize: scaleFont(base.h3.fontSize) as ResponsiveTypography['h3']['fontSize'] },
    body:      { ...base.body, fontSize: scaleFont(base.body.fontSize) as ResponsiveTypography['body']['fontSize'] },
    bodySmall: { ...base.bodySmall, fontSize: scaleFont(base.bodySmall.fontSize) as ResponsiveTypography['bodySmall']['fontSize'] },
    caption:   { ...base.caption, fontSize: scaleFont(base.caption.fontSize) as ResponsiveTypography['caption']['fontSize'] },
  };
}

function scaleButtonHeights(base: ResponsiveButtonHeights, scale: number): ResponsiveButtonHeights {
  const small = Math.max(MIN_TOUCH_TARGET, Math.round(base.small * scale)) as ResponsiveButtonHeights['small'];
  const medium = Math.max(MIN_TOUCH_TARGET, Math.round(base.medium * scale)) as ResponsiveButtonHeights['medium'];
  const large = Math.max(MIN_TOUCH_TARGET, Math.round(base.large * scale)) as ResponsiveButtonHeights['large'];
  return { small, medium, large };
}

function scaleRadii(base: ResponsiveRadii, scale: number): ResponsiveRadii {
  return {
    xxs: Math.round(base.xxs * scale) as ResponsiveRadii['xxs'],
    xs: Math.round(base.xs * scale) as ResponsiveRadii['xs'],
    sm: Math.round(base.sm * scale) as ResponsiveRadii['sm'],
    smMedium: Math.round(base.smMedium * scale) as ResponsiveRadii['smMedium'],
    button: Math.round(base.button * scale) as ResponsiveRadii['button'],
    md: Math.round(base.md * scale) as ResponsiveRadii['md'],
    lg: Math.round(base.lg * scale) as ResponsiveRadii['lg'],
    xl: Math.round(base.xl * scale) as ResponsiveRadii['xl'],
    xxl: Math.round(base.xxl * scale) as ResponsiveRadii['xxl'],
    xlMobile: Math.round(base.xlMobile * scale) as ResponsiveRadii['xlMobile'],
    panel: Math.round(base.panel * scale) as ResponsiveRadii['panel'],
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
