import React from 'react';
import { Link } from 'react-router-dom';
import { getTrips, getVehicles, getBookings } from '../services/adminData';
import { useAdminScope } from '../context/AdminScopeContext';

export default function AgencyManagementPage() {
  const scope = useAdminScope();

  const trips = React.useMemo(() => getTrips(scope), [scope]);
  const vehicles = React.useMemo(() => getVehicles(scope), [scope]);
  const bookings = React.useMemo(() => getBookings(scope), [scope]);

  if (!scope?.agencyId) {
    return (
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
        <h3 className="text-2xl font-black text-dark mb-2">Agency management</h3>
        <p className="text-muted">
          Log in as an agency admin to manage your agency&apos;s trips, vehicles, and employees.
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
