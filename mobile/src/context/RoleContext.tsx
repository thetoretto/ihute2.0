import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { UserRole, AgencySubRole } from '../types';
import { useAuth } from './AuthContext';
import { getUserVehicles } from '../services/mockApi';

interface RoleContextValue {
  currentRole: UserRole;
  agencySubRole: AgencySubRole | undefined;
  switchRole: (role: UserRole) => Promise<void>;
  hasApprovedVehicle: boolean;
  setHasApprovedVehicle: (v: boolean) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>('passenger');
  const [hasApprovedVehicle, setHasApprovedVehicle] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function syncVehicleStatus() {
      if (!user) {
        if (mounted) {
          setCurrentRole('passenger');
          setHasApprovedVehicle(false);
        }
        return;
      }
      const vehicles = await getUserVehicles(user.id);
      const approved = vehicles.some((v) => v.approvalStatus === 'approved');
      if (mounted) {
        const defaultRole = user.roles.includes('agency')
          ? 'agency'
          : user.roles.includes('driver')
            ? 'driver'
            : 'passenger';
        setCurrentRole((prev) => (user.roles.includes(prev) ? prev : defaultRole));
        setHasApprovedVehicle(approved);
      }
    }
    syncVehicleStatus();
    return () => {
      mounted = false;
    };
  }, [user]);

  const switchRole = useCallback(
    async (role: UserRole) => {
      if (!user || role === currentRole) {
        return;
      }
      if (!user.roles.includes(role)) {
        return;
      }
      if ((role === 'driver' || role === 'agency') && user) {
        const vehicles = await getUserVehicles(user.id);
        const approved = vehicles.some((v) => v.approvalStatus === 'approved');
        setHasApprovedVehicle(approved);
        if (!approved) {
          return; // Guard handled in RoleToggle via Alert
        }
      }
      setCurrentRole(role);
    },
    [currentRole, user]
  );
  const agencySubRole = user?.agencySubRole;

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        agencySubRole,
        switchRole,
        hasApprovedVehicle,
        setHasApprovedVehicle,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
