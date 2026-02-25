import React from 'react';
import { Link } from 'react-router-dom';
import { adminSnapshot } from '../data/snapshot';
import { useAdminScope } from '../context/AdminScopeContext';

export default function ScannerOperatorsPage() {
  const scope = useAdminScope();

  const scannerOperators = React.useMemo(() => {
    const users = adminSnapshot.users as Array<{ id: string; name: string; email: string; phone: string; agencySubRole?: string; agencyId?: string }>;
    return users.filter(
      (u) =>
        u.agencySubRole === 'agency_scanner' &&
        (scope?.agencyId ? u.agencyId === scope.agencyId : true)
    );
  }, [scope]);

  const th = 'pb-4 text-[10px] uppercase font-black text-muted tracking-widest text-left';
  if (!scope?.agencyId) {
    return (
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
        <h3 className="text-2xl font-black text-dark mb-2">Scanner operators</h3>
        <p className="text-muted text-sm mb-2">
          Scanner operators are employees who can scan tickets for agency trips. Log in as an agency
          admin to manage your agency&apos;s scanner operators.
        </p>
        <p className="text-muted text-sm">
          As system admin, you see all scanner operators across agencies in the Users page.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
      <h3 className="text-2xl font-black text-dark mb-2">Scanner operators</h3>
      <p className="text-muted text-sm mb-6">
        Employees who can scan tickets and view trip capacity. They cannot edit trips or manage vehicles.
      </p>
      {scannerOperators.length === 0 ? (
        <p className="text-muted text-sm mb-6">No scanner operators yet. Add employees with scanner role in Users.</p>
      ) : (
        <div className="w-full overflow-x-auto mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface">
                <th className={th}>Name</th>
                <th className={th}>Email</th>
                <th className={th}>Phone</th>
                <th className={th}>Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {scannerOperators.map((op) => (
                <tr key={op.id} className="group hover:bg-surface/50 transition-colors">
                  <td className="py-5 font-bold text-sm">{op.name}</td>
                  <td className="py-5 text-sm">{op.email}</td>
                  <td className="py-5 text-sm">{op.phone}</td>
                  <td className="py-5"><span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-soft text-dark">Scanner</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h4 className="text-lg font-black text-dark mb-4">Quick links</h4>
      <div className="flex flex-wrap gap-3">
        <Link to="/activities" className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary">Activities</Link>
        <Link to="/vehicles" className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary">Vehicles</Link>
        <Link to="/users" className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary">Users</Link>
      </div>
    </div>
  );
}
