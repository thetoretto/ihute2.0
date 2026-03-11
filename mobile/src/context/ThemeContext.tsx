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
  const value = useMemo(() => {
    const resolved = colorScheme === 'dark' ? colorsDark : colors;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e2426e2f-6eb8-4ea6-91af-e79e0dbac3a5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cd236f'},body:JSON.stringify({sessionId:'cd236f',location:'ThemeContext.tsx:ThemeProvider',message:'Theme resolved',data:{colorScheme,textSecondary:resolved.textSecondary,textMuted:resolved.textMuted,isTeal:resolved.textSecondary==='#054752'},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    return {
      colorScheme,
      setColorScheme,
      colors: resolved,
    };
  }, [colorScheme]);
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
