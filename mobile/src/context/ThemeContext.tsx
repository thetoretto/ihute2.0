import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { colors, colorsDark, type ColorScheme } from '../utils/theme';

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  colors: typeof colors;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
      colors: colorScheme === 'dark' ? colorsDark : colors,
    }),
    [colorScheme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

/** Returns the active theme colors (light or dark). Use this in components to support dark mode. */
export function useThemeColors(): typeof colors {
  const ctx = useThemeContext();
  return ctx?.colors ?? colors;
}
