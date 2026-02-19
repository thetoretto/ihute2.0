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

  if (!scope?.agencyId) {
    return (
      <section>
        <h2>Scanner operators</h2>
        <p className="subtle">
          Scanner operators are employees who can scan tickets for agency trips. Log in as an agency
          admin to manage your agency&apos;s scanner operators.
        </p>
        <p className="subtle">
          As system admin, you see all scanner operators across agencies in the Users page.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2>Scanner operators</h2>
      <p className="subtle">
        Employees who can scan tickets and view trip capacity. They cannot edit trips or manage
        vehicles.
      </p>
      {scannerOperators.length === 0 ? (
        <p className="subtle">No scanner operators yet. Add employees with scanner role in Users.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {scannerOperators.map((op) => (
              <tr key={op.id}>
                <td>{op.name}</td>
                <td>{op.email}</td>
                <td>{op.phone}</td>
                <td>Scanner</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h3>Quick links</h3>
      <div className="dashboard-links">
        <Link to="/activities" className="dashboard-link">Activities</Link>
        <Link to="/vehicles" className="dashboard-link">Vehicles</Link>
        <Link to="/users" className="dashboard-link">Users</Link>
      </div>
    </section>
  );
}
