import React, { createContext, useContext, useMemo } from 'react';
import type { UserRole } from '../types';
import { useThemeColors } from './ThemeContext';
import { useRole } from './RoleContext';

/** Role-specific theme colors per spec: Passenger #FEE46B/#171CEE, Driver #94A9BC/#171C22, Agency #E6DBEB/#171C22. */
export interface RoleThemeColors {
  primary: string;
  accent: string;
  dark: string;
  onPrimary: string;
  tint: string;
  border: string;
}

const RoleThemeContext = createContext<RoleThemeColors | null>(null);

function getRoleTheme(c: ReturnType<typeof useThemeColors>, role: UserRole): RoleThemeColors {
  switch (role) {
    case 'passenger':
      return {
        primary: c.passengerBrand,
        accent: c.passengerAccent,
        dark: c.passengerDark,
        onPrimary: c.passengerOnBrand,
        tint: c.primaryTint,
        border: c.borderLight,
      };
    case 'driver':
      return {
        primary: c.driverPrimary,
        accent: c.driverAccent,
        dark: c.driverDark,
        onPrimary: c.onAccent,
        tint: c.driverPrimaryTint,
        border: c.borderLight,
      };
    case 'agency':
      return {
        primary: c.agency,
        accent: c.agencyDark,
        dark: c.agencyDark,
        onPrimary: c.agencyDark,
        tint: c.agencyTint,
        border: c.agencyBorder,
      };
    default:
      return {
        primary: c.passengerBrand,
        accent: c.passengerAccent,
        dark: c.passengerDark,
        onPrimary: c.passengerOnBrand,
        tint: c.primaryTint,
        border: c.borderLight,
      };
  }
}

export function RoleThemeProvider({ children }: { children: React.ReactNode }) {
  const c = useThemeColors();
  const { currentRole } = useRole();
  const value = useMemo(() => getRoleTheme(c, currentRole), [c, currentRole]);
  return (
    <RoleThemeContext.Provider value={value}>
      {children}
    </RoleThemeContext.Provider>
  );
}

export function useRoleTheme(): RoleThemeColors {
  const ctx = useContext(RoleThemeContext);
  const c = useThemeColors();
  const { currentRole } = useRole();
  return ctx ?? getRoleTheme(c, currentRole);
}
