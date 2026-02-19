import React, { createContext, useContext } from 'react';
import type { AdminScope } from '../services/adminMetrics';

const AdminScopeContext = createContext<AdminScope | undefined>(undefined);

export function AdminScopeProvider({
  children,
  scope,
}: {
  children: React.ReactNode;
  scope: AdminScope | undefined;
}) {
  return (
    <AdminScopeContext.Provider value={scope}>
      {children}
    </AdminScopeContext.Provider>
  );
}

export function useAdminScope(): AdminScope | undefined {
  return useContext(AdminScopeContext);
}
