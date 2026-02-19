import { useWindowDimensions } from 'react-native';

/** Breakpoint for tablet (iPad portrait width per Apple UI guidelines). */
export const BREAKPOINT_TABLET = 768;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= BREAKPOINT_TABLET;
  const isPhone = !isTablet;
  const horizontalPadding = isTablet ? 24 : 16;
  const maxContentWidth = width >= 1024 ? 760 : width >= BREAKPOINT_TABLET ? 640 : 560;
  const tabBarHeight = isTablet ? 65 : 66;

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
