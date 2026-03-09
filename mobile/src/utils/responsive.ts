import { useWindowDimensions } from 'react-native';
import { MAX_VIEWPORT_WIDTH } from './layout';

/** Breakpoint for tablet (iPad portrait width per Apple UI guidelines). */
export const BREAKPOINT_TABLET = 768;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= BREAKPOINT_TABLET;
  const isPhone = !isTablet;
  /** Design system: horizontal padding for all screens (tighter sides). */
  const horizontalPadding = 16;
  /** Mobile-first: cap at 450px; tablet/desktop get larger max. */
  const maxContentWidth = width >= 1024 ? 760 : width >= BREAKPOINT_TABLET ? 640 : Math.min(width, MAX_VIEWPORT_WIDTH);
  const tabBarHeight = 80;

  return {
    width,
    height,
    horizontalPadding,
    maxContentWidth,
    isTablet,
    isPhone,
    tabBarHeight,
  };
}
