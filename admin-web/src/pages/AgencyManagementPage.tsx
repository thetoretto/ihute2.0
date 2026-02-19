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
      <section>
        <h2>Agency management</h2>
        <p className="subtle">
          Log in as an agency admin to manage your agency&apos;s trips, vehicles, and employees.
        </p>
      </section>
    );
  }

  const activeTrips = trips.filter((t) => t.status === 'active').length;
  const totalBookings = bookings.filter((b) => b.status !== 'cancelled').length;

  return (
    <section>
      <h2>Agency management</h2>
      <p className="subtle">Overview of your agency&apos;s operations.</p>
      <div className="dashboard-kpi-row">
        <div className="metric-card kpi-active">
          <p className="metric-label">Total trips</p>
          <h3 className="metric-value">{trips.length}</h3>
        </div>
        <div className="metric-card kpi-customers">
          <p className="metric-label">Active trips</p>
          <h3 className="metric-value">{activeTrips}</h3>
        </div>
        <div className="metric-card kpi-revenue">
          <p className="metric-label">Vehicles</p>
          <h3 className="metric-value">{vehicles.length}</h3>
        </div>
        <div className="metric-card kpi-alert">
          <p className="metric-label">Bookings</p>
          <h3 className="metric-value">{totalBookings}</h3>
        </div>
      </div>
      <h3>Manage</h3>
      <div className="dashboard-links">
        <Link to="/activities" className="dashboard-link">Activities</Link>
        <Link to="/tickets" className="dashboard-link">Tickets</Link>
        <Link to="/vehicles" className="dashboard-link">Vehicles</Link>
        <Link to="/users" className="dashboard-link">Users</Link>
        <Link to="/scanner-operators" className="dashboard-link">Scanner operators</Link>
      </div>
    </section>
  );
}
