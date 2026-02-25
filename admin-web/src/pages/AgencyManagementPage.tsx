import React from 'react';
import { Link } from 'react-router-dom';
import { getTrips, getVehicles, getBookings } from '../services/adminData';
import { useAdminScope } from '../context/AdminScopeContext';
import { adminSnapshot } from '../data/snapshot';

export default function AgencyManagementPage() {
  const scope = useAdminScope();

  const trips = React.useMemo(() => getTrips(scope), [scope]);
  const vehicles = React.useMemo(() => getVehicles(scope), [scope]);
  const bookings = React.useMemo(() => getBookings(scope), [scope]);

  // Super admin: list all agencies (users with role agency)
  const allAgencies = React.useMemo(
    () => adminSnapshot.users.filter((u) => u.roles.includes('agency')),
    []
  );

  if (!scope?.agencyId) {
    const th = 'pb-4 text-[10px] uppercase font-black text-muted tracking-widest text-left';
    return (
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
        <h3 className="text-2xl font-black text-dark mb-2">Agencies</h3>
        <p className="text-muted text-sm mb-6">
          All agencies on the platform. Manage drivers and agency accounts from Users.
        </p>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface">
                <th className={th}>Name</th>
                <th className={th}>Email</th>
                <th className={th}>Phone</th>
                <th className={th}>Role</th>
                <th className={th}>Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {allAgencies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">No agencies yet.</td>
                </tr>
              ) : (
                allAgencies.map((agency) => (
                  <tr key={agency.id} className="group hover:bg-surface/50 transition-colors">
                    <td className="py-5 font-bold text-sm">{agency.name}</td>
                    <td className="py-5 text-sm text-dark/80">{agency.email}</td>
                    <td className="py-5 text-sm text-dark/80">{agency.phone}</td>
                    <td className="py-5">
                      <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-bold bg-soft text-dark">
                        Agency
                      </span>
                    </td>
                    <td className="py-5 text-sm">{agency.rating?.toFixed(1) ?? 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-muted text-sm mt-6">
          <Link to="/users" className="font-bold text-dark hover:underline">View all users</Link> (drivers, passengers, agencies) or filter by role on the Users page.
        </p>
      </div>
    );
  }

  const activeTrips = trips.filter((t) => t.status === 'active').length;
  const totalBookings = bookings.filter((b) => b.status !== 'cancelled').length;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
        <h3 className="text-2xl font-black text-dark mb-2">Agency management</h3>
        <p className="text-muted text-sm mb-6">Overview of your agency&apos;s operations.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-dark rounded-2xl p-6 text-white">
            <p className="text-muted text-xs font-bold uppercase tracking-widest">Total trips</p>
            <p className="text-2xl font-black text-primary mt-1">{trips.length}</p>
          </div>
          <div className="bg-soft rounded-2xl p-6">
            <p className="text-muted text-xs font-bold uppercase tracking-widest">Active trips</p>
            <p className="text-2xl font-black text-dark mt-1">{activeTrips}</p>
          </div>
          <div className="bg-soft rounded-2xl p-6">
            <p className="text-muted text-xs font-bold uppercase tracking-widest">Vehicles</p>
            <p className="text-2xl font-black text-dark mt-1">{vehicles.length}</p>
          </div>
          <div className="bg-soft rounded-2xl p-6">
            <p className="text-muted text-xs font-bold uppercase tracking-widest">Bookings</p>
            <p className="text-2xl font-black text-dark mt-1">{totalBookings}</p>
          </div>
        </div>
        <h4 className="text-lg font-black text-dark mt-8 mb-4">Manage</h4>
        <div className="flex flex-wrap gap-3">
          <Link to="/activities" className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary">Activities</Link>
          <Link to="/tickets" className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary">Tickets</Link>
          <Link to="/vehicles" className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary">Vehicles</Link>
          <Link to="/users" className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary">Users</Link>
          <Link to="/scanner-operators" className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary">Scanner operators</Link>
        </div>
      </div>
    </div>
  );
}
