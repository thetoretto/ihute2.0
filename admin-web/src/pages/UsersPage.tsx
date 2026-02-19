import React, { useMemo, useState } from 'react';
import { adminSnapshot } from '../data/snapshot';
import { getTrips, getBookings } from '../services/adminData';
import { useAdminScope } from '../context/AdminScopeContext';
import type { UserRole } from '../types';

export default function UsersPage() {
  const scope = useAdminScope();
  const [filter, setFilter] = useState<'all' | UserRole>('all');

  const usersToShow = useMemo(() => {
    if (!scope?.agencyId) return adminSnapshot.users;
    const agencyTripDriverIds = new Set(getTrips(scope).map((t) => t.driver.id));
    const agencyBookingPassengerIds = new Set(getBookings(scope).map((b) => b.passenger.id));
    const relevantIds = new Set([scope.agencyId, ...agencyTripDriverIds, ...agencyBookingPassengerIds]);
    return adminSnapshot.users.filter((u) => relevantIds.has(u.id));
  }, [scope]);

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
    <section>
      <div className="header-row">
        <h2>Users</h2>
        <div className="chip-row">
          {(['all', 'passenger', 'driver', 'agency'] as const).map((item) => (
            <button
              key={item}
              className={`chip ${filter === item ? 'chip-active' : ''}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Roles</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>
              {user.roles.map((role) => (
                <span key={role} className={`tag tag-${role === 'passenger' ? 'a' : role === 'driver' ? 'b' : 'c'}`} style={{ marginRight: 4 }}>
                  {role}
                </span>
              ))}
              </td>
              <td>{user.rating?.toFixed(1) ?? 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
