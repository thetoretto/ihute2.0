import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTripsAsync, getBookingsAsync } from '../services/adminApiData';
import { useAdminScope } from '../context/AdminScopeContext';
import DateTimePicker from '../components/DateTimePicker';
import type { Trip, Booking } from '../types';

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
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const refresh = useCallback(async () => {
    const [t, b] = await Promise.all([getTripsAsync(scope), getBookingsAsync(scope)]);
    setTrips(t);
    setBookings(b);
  }, [scope]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
        const fromStr = dateFrom.toISOString().slice(0, 10);
        if (booking.createdAt.slice(0, 10) < fromStr) return false;
      }
      if (dateTo) {
        const toStr = dateTo.toISOString().slice(0, 10);
        if (booking.createdAt.slice(0, 10) > toStr) return false;
      }
      return true;
    });
  }, [statusFilter, routeFilter, dateFrom, dateTo, bookings]);

  const th = 'pb-4 text-[10px] uppercase font-black text-muted tracking-widest text-left';
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
      <h3 className="text-2xl font-black text-dark mb-2">Activities</h3>
      <p className="text-muted text-sm mb-6">Trips and bookings across all users. Use filters to narrow by route, status, or date.</p>

      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-muted">Booking status:</span>
          {(['all', 'upcoming', 'ongoing', 'completed', 'cancelled'] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === s ? 'bg-dark text-primary' : 'bg-surface text-dark hover:bg-soft'}`}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted">Route:</span>
          <select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)} className="py-2 px-3 border border-soft rounded-xl text-sm font-bold bg-white">
            <option value="all">All routes</option>
            {routeOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-muted">Trip category:</span>
          {(['all', 'public', 'private'] as const).map((c) => (
            <button key={c} type="button" onClick={() => setTripCategoryFilter(c)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tripCategoryFilter === c ? 'bg-dark text-primary' : 'bg-surface text-dark hover:bg-soft'}`}>
              {c === 'all' ? 'All' : c === 'public' ? 'Public' : 'Private'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateTimePicker label="Date from" mode="date" value={dateFrom} onChange={(d) => setDateFrom(d)} placeholder="From" />
          <DateTimePicker label="Date to" mode="date" value={dateTo} onChange={(d) => setDateTo(d)} minDate={dateFrom ?? undefined} placeholder="To" />
        </div>
      </div>

      <h4 className="text-lg font-black text-dark mb-4">Trips</h4>
      <div className="w-full overflow-x-auto mb-10">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface">
              <th className={th}>Route</th>
              <th className={th}>Type</th>
              <th className={th}>Status</th>
              <th className={th}>Driver</th>
              <th className={th}>Seats Left</th>
              <th className={th}>Price/Seat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface">
            {filteredTrips.map((trip) => (
              <tr key={trip.id} className="group hover:bg-surface/50 transition-colors">
                <td className="py-5 font-bold text-sm">{trip.departureHotpoint.name} → {trip.destinationHotpoint.name}</td>
                <td className="py-5 text-sm">{trip.type}</td>
                <td className="py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${trip.status === 'active' ? 'bg-primary text-dark' : trip.status === 'completed' ? 'bg-green-100 text-green-700' : trip.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    {trip.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-5 text-sm">{trip.driver.name}</td>
                <td className="py-5 text-sm">{trip.seatsAvailable}</td>
                <td className="py-5 text-sm">{Number(trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="text-lg font-black text-dark mb-4">Bookings</h4>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface">
              <th className={th}>Booking</th>
              <th className={th}>Passenger</th>
              <th className={th}>Route</th>
              <th className={th}>Status</th>
              <th className={th}>Seats</th>
              <th className={th}>Payment</th>
              <th className={th}>Amount</th>
              <th className={th}>Ticket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface">
            {filteredBookings.map((booking) => (
              <tr key={booking.id} className="group hover:bg-surface/50 transition-colors">
                <td className="py-5 text-sm">{booking.id}</td>
                <td className="py-5 font-bold text-sm">{booking.passenger.name}</td>
                <td className="py-5 text-sm">{booking.trip.departureHotpoint.name} → {booking.trip.destinationHotpoint.name}</td>
                <td className="py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${booking.status === 'upcoming' ? 'bg-primary text-dark' : booking.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : booking.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {booking.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-5 text-sm">{booking.seats}</td>
                <td className="py-5">
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-bold ${booking.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : booking.paymentMethod === 'mobile_money' ? 'bg-blue-100 text-blue-700' : 'bg-soft text-dark'}`}>
                    {booking.paymentMethod.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-5 text-sm">{Number(booking.seats * booking.trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</td>
                <td className="py-5">{booking.ticketNumber ? <Link to="/tickets" className="text-sm font-bold text-primary hover:underline">View</Link> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
