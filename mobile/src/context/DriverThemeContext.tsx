import { useThemeColors } from './ThemeContext';
import { radii } from '../utils/theme';

/**
 * Driver app theme: teal/cyan palette + large card radii.
 * Use only in driver screens and driver tab bar.
 */
export function useDriverTheme() {
  const c = useThemeColors();
  return {
    colors: {
      primary: c.driverPrimary,
      accent: c.driverAccent,
      bg: c.driverBg,
      instaGreen: c.driverInstaGreen,
      primaryTint: c.driverPrimaryTint,
      accentTint: c.driverAccentTint,
      instaGreenTint: c.driverInstaGreenTint,
      card: c.card,
      text: c.text,
      textSecondary: c.textSecondary,
      border: c.border,
      onPrimary: c.onAccent,
      success: c.success,
      error: c.error,
      errorTint: c.errorTint,
    },
    radii: {
      card: radii.cardLarge,
      cardXLarge: radii.cardXLarge,
      button: radii.button,
      sm: radii.smMedium,
    },
  };
}
