import React, { createContext, useContext, ReactNode } from 'react';
import { useResponsiveTheme, type ResponsiveTheme } from '../utils/responsiveTheme';

const ResponsiveThemeContext = createContext<ResponsiveTheme | null>(null);

export function ResponsiveThemeProvider({ children }: { children: ReactNode }) {
  const value = useResponsiveTheme();
  return (
    <ResponsiveThemeContext.Provider value={value}>
      {children}
    </ResponsiveThemeContext.Provider>
  );
}

export function useResponsiveThemeContext(): ResponsiveTheme | null {
  return useContext(ResponsiveThemeContext);
}
