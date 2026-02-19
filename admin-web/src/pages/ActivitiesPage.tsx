import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrips, getBookings } from '../services/adminData';
import { useAdminScope } from '../context/AdminScopeContext';

type StatusFilter = 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
type TripCategoryFilter = 'all' | 'public' | 'private';

function isPublicTrip(trip: { driver: { roles?: readonly string[] } }): boolean {
  return trip.driver.roles?.includes('agency') ?? false;
}

export default function ActivitiesPage() {
  const scope = useAdminScope();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [tripCategoryFilter, setTripCategoryFilter] = useState<TripCategoryFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const trips = useMemo(() => getTrips(scope), [scope]);
  const bookings = useMemo(() => getBookings(scope), [scope]);

  const routeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of trips) {
      set.add(`${t.departureHotpoint.name} → ${t.destinationHotpoint.name}`);
    }
    return Array.from(set).sort();
  }, [trips]);

  const filteredTrips = useMemo(() => {
    let list = trips.filter((trip) => {
      if (routeFilter !== 'all') {
        const route = `${trip.departureHotpoint.name} → ${trip.destinationHotpoint.name}`;
        if (route !== routeFilter) return false;
      }
      return true;
    });
    if (tripCategoryFilter === 'public') {
      list = list.filter(isPublicTrip);
    } else if (tripCategoryFilter === 'private') {
      list = list.filter((trip) => !isPublicTrip(trip));
    }
    return list;
  }, [routeFilter, tripCategoryFilter, trips]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
      if (routeFilter !== 'all') {
        const route = `${booking.trip.departureHotpoint.name} → ${booking.trip.destinationHotpoint.name}`;
        if (route !== routeFilter) return false;
      }
      if (dateFrom) {
        if (booking.createdAt.slice(0, 10) < dateFrom) return false;
      }
      if (dateTo) {
        if (booking.createdAt.slice(0, 10) > dateTo) return false;
      }
      return true;
    });
  }, [statusFilter, routeFilter, dateFrom, dateTo, bookings]);

  return (
    <section>
      <h2>Activities</h2>
      <p className="subtle">Trips and bookings across all users. Use filters to narrow by route, status, or date.</p>

      <div className="filters-row">
        <div className="chip-row">
          <span className="filter-label">Booking status:</span>
          {(['all', 'upcoming', 'ongoing', 'completed', 'cancelled'] as const).map((s) => (
            <button key={s} className={`chip ${statusFilter === s ? 'chip-active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <div className="chip-row">
          <span className="filter-label">Route:</span>
          <select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)} className="select-filter">
            <option value="all">All routes</option>
            {routeOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="chip-row">
          <span className="filter-label">Trip category:</span>
          {(['all', 'public', 'private'] as const).map((c) => (
            <button key={c} className={`chip ${tripCategoryFilter === c ? 'chip-active' : ''}`} onClick={() => setTripCategoryFilter(c)}>
              {c === 'all' ? 'All' : c === 'public' ? 'Public' : 'Private'}
            </button>
          ))}
        </div>
        <div className="chip-row">
          <span className="filter-label">Date from:</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-date" />
          <span className="filter-label">to:</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-date" />
        </div>
      </div>

      <h3>Trips</h3>
      <table>
        <thead>
          <tr>
            <th>Route</th>
            <th>Type</th>
            <th>Status</th>
            <th>Driver</th>
            <th>Seats Left</th>
            <th>Price/Seat</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrips.map((trip) => (
            <tr key={trip.id}>
              <td>{trip.departureHotpoint.name} → {trip.destinationHotpoint.name}</td>
              <td>{trip.type}</td>
              <td>
                <span className={`status-chip status-${trip.status === 'active' ? 'open' : trip.status === 'completed' ? 'success' : trip.status === 'cancelled' ? 'rejected' : 'closed'}`}>
                  {trip.status.toUpperCase()}
                </span>
              </td>
              <td>{trip.driver.name}</td>
              <td>{trip.seatsAvailable}</td>
              <td>{Number(trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Bookings</h3>
      <table>
        <thead>
          <tr>
            <th>Booking</th>
            <th>Passenger</th>
            <th>Route</th>
            <th>Status</th>
            <th>Seats</th>
            <th>Payment</th>
            <th>Amount</th>
            <th>Ticket</th>
          </tr>
        </thead>
        <tbody>
          {filteredBookings.map((booking) => (
            <tr key={booking.id}>
              <td>{booking.id}</td>
              <td>{booking.passenger.name}</td>
              <td>{booking.trip.departureHotpoint.name} → {booking.trip.destinationHotpoint.name}</td>
              <td>
                <span className={`status-chip status-${booking.status === 'upcoming' ? 'open' : booking.status === 'ongoing' ? 'pending' : booking.status === 'completed' ? 'success' : 'rejected'}`}>
                  {booking.status.toUpperCase()}
                </span>
              </td>
              <td>{booking.seats}</td>
              <td>
                <span className={`tag tag-${booking.paymentMethod === 'cash' ? 'a' : booking.paymentMethod === 'mobile_money' ? 'b' : 'c'}`}>
                  {booking.paymentMethod.replace('_', ' ')}
                </span>
              </td>
              <td>{Number(booking.seats * booking.trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</td>
              <td>{booking.ticketNumber ? <Link to="/tickets">View</Link> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
