import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { adminSnapshot } from '../data/snapshot';
import { getUsersAsync, getTripsAsync, getBookingsAsync } from '../services/adminApiData';
import { useAdminScope } from '../context/AdminScopeContext';
import type { UserRole, User } from '../types';

export default function UsersPage() {
  const scope = useAdminScope();
  const [filter, setFilter] = useState<'all' | UserRole>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [trips, setTrips] = useState<import('../types').Trip[]>([]);
  const [bookings, setBookings] = useState<import('../types').Booking[]>([]);

  const refresh = useCallback(async () => {
    const [u, t, b] = await Promise.all([
      getUsersAsync(scope),
      getTripsAsync(scope),
      getBookingsAsync(scope),
    ]);
    setUsers(u);
    setTrips(t);
    setBookings(b);
  }, [scope]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const usersToShow = useMemo(() => {
    const list = users.length > 0 ? users : adminSnapshot.users;
    if (!scope?.agencyId) return list;
    const agencyTripDriverIds = new Set(
      trips.map((t) => (typeof t.driver === 'object' && t.driver && 'id' in t.driver ? t.driver.id : undefined)).filter(Boolean)
    );
    const agencyBookingPassengerIds = new Set(
      bookings.map((b) => (typeof b.passenger === 'object' && b.passenger && 'id' in b.passenger ? b.passenger.id : undefined)).filter(Boolean)
    );
    const relevantIds = new Set([scope.agencyId, ...agencyTripDriverIds, ...agencyBookingPassengerIds]);
    return list.filter((u) => relevantIds.has(u.id));
  }, [scope, users, trips, bookings]);

  const rows = useMemo(
    () =>
      usersToShow.filter((user) => {
        if (filter === 'all') {
          return true;
        }
        return user.roles.includes(filter);
      }),
    [filter, usersToShow]
  );

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-dark">Users</h3>
        <div className="flex gap-2">
          {(['all', 'passenger', 'driver', 'agency'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === item ? 'bg-dark text-primary' : 'bg-surface text-dark hover:bg-soft'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface">
              <th className="pb-4 text-[10px] uppercase font-black text-muted tracking-widest">Name</th>
              <th className="pb-4 text-[10px] uppercase font-black text-muted tracking-widest">Email</th>
              <th className="pb-4 text-[10px] uppercase font-black text-muted tracking-widest">Phone</th>
              <th className="pb-4 text-[10px] uppercase font-black text-muted tracking-widest">Roles</th>
              <th className="pb-4 text-[10px] uppercase font-black text-muted tracking-widest">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface">
            {rows.map((user) => (
              <tr key={user.id} className="group hover:bg-surface/50 transition-colors">
                <td className="py-5 font-bold text-sm">{user.name}</td>
                <td className="py-5 text-sm text-dark/80">{user.email}</td>
                <td className="py-5 text-sm text-dark/80">{user.phone}</td>
                <td className="py-5">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-bold mr-1 ${
                        role === 'passenger' ? 'bg-green-100 text-green-700' : role === 'driver' ? 'bg-blue-100 text-blue-700' : 'bg-soft text-dark'
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                </td>
                <td className="py-5 text-sm">{user.rating?.toFixed(1) ?? 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
