import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { getUsersAsync, getTripsAsync, getBookingsAsync } from '../services/adminApiData';
import { getAgenciesApi, createUserApi, type Agency, type CreateUserBody } from '../services/api';
import { useAdminScope } from '../context/AdminScopeContext';
import type { UserRole, User } from '../types';

const USER_TYPE_OPTIONS: { value: CreateUserBody['userType']; label: string }[] = [
  { value: 'USER', label: 'Passenger' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'AGENCY_ADMIN', label: 'Agency admin' },
  { value: 'SCANNER', label: 'Scanner' },
  { value: 'SUPER_ADMIN', label: 'Super admin' },
];

export default function UsersPage() {
  const scope = useAdminScope();
  const isSuperAdmin = !scope?.agencyId;
  const [filter, setFilter] = useState<'all' | UserRole>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all'); // 'all' | 'none' | agencyId
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [trips, setTrips] = useState<import('../types').Trip[]>([]);
  const [bookings, setBookings] = useState<import('../types').Booking[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    userType: 'USER' as CreateUserBody['userType'],
    agencyId: '',
  });

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

  useEffect(() => {
    if (isSuperAdmin) {
      getAgenciesApi().then(setAgencies).catch(() => setAgencies([]));
    }
  }, [isSuperAdmin]);

  const usersToShow = useMemo(() => {
    if (!scope?.agencyId) return users;
    const agencyTripDriverIds = new Set(
      trips.map((t) => (typeof t.driver === 'object' && t.driver && 'id' in t.driver ? t.driver.id : undefined)).filter(Boolean)
    );
    const agencyBookingPassengerIds = new Set(
      bookings.map((b) => (typeof b.passenger === 'object' && b.passenger && 'id' in b.passenger ? b.passenger.id : undefined)).filter(Boolean)
    );
    const relevantIds = new Set([scope.agencyId, ...agencyTripDriverIds, ...agencyBookingPassengerIds]);
    return users.filter((u) => relevantIds.has(u.id));
  }, [scope, users, trips, bookings]);

  const rows = useMemo(() => {
    let list = usersToShow.filter((user) => {
      if (filter !== 'all' && !user.roles.includes(filter)) return false;
      if (agencyFilter === 'all') return true;
      if (agencyFilter === 'none') return !user.agencyId;
      return user.agencyId === agencyFilter;
    });
    return list;
  }, [filter, agencyFilter, usersToShow]);

  const agencyName = (agencyId: string | undefined) => {
    if (!agencyId) return '—';
    const a = agencies.find((x) => x.id === agencyId);
    return a?.name ?? agencyId;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const { userType, agencyId, ...rest } = form;
    const needsAgency = ['DRIVER', 'AGENCY_ADMIN', 'SCANNER'].includes(userType);
    if (needsAgency && !agencyId?.trim()) {
      setCreateError('Agency is required for Driver, Agency admin, and Scanner.');
      return;
    }
    if (!rest.email?.trim() || !rest.password?.trim()) {
      setCreateError('Email and password are required.');
      return;
    }
    setCreateLoading(true);
    try {
      await createUserApi({
        ...rest,
        email: rest.email.trim(),
        password: rest.password,
        name: rest.name?.trim() || undefined,
        phone: rest.phone?.trim() || undefined,
        userType,
        agencyId: needsAgency ? agencyId!.trim() : undefined,
      });
      setForm({ email: '', password: '', name: '', phone: '', userType: 'USER', agencyId: '' });
      setCreateOpen(false);
      await refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-soft">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h3 className="text-2xl font-black text-dark">Users</h3>
        <div className="flex flex-wrap items-center gap-3">
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
          {isSuperAdmin && (
            <>
              <select
                value={agencyFilter}
                onChange={(e) => setAgencyFilter(e.target.value)}
                className="py-2 px-3 border border-soft rounded-xl text-sm font-semibold bg-white text-dark"
              >
                <option value="all">All agencies</option>
                <option value="none">No agency</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => { setCreateOpen(true); setCreateError(null); setForm({ email: '', password: '', name: '', phone: '', userType: 'USER', agencyId: '' }); }}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-dark hover:opacity-90"
              >
                Create user
              </button>
            </>
          )}
        </div>
      </div>

      {createOpen && isSuperAdmin && (
        <form onSubmit={handleCreateUser} className="mb-8 p-6 bg-surface rounded-xl border border-soft">
          <h4 className="text-lg font-black text-dark mb-4">Create user</h4>
          {createError && <p className="text-danger text-sm mb-3">{createError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full py-2 px-3 border border-soft rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                className="w-full py-2 px-3 border border-soft rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full py-2 px-3 border border-soft rounded-lg"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full py-2 px-3 border border-soft rounded-lg"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Role</label>
              <select
                value={form.userType}
                onChange={(e) => setForm((f) => ({ ...f, userType: e.target.value as CreateUserBody['userType'] }))}
                className="w-full py-2 px-3 border border-soft rounded-lg"
              >
                {USER_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {['DRIVER', 'AGENCY_ADMIN', 'SCANNER'].includes(form.userType) && (
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Agency *</label>
                <select
                  value={form.agencyId}
                  onChange={(e) => setForm((f) => ({ ...f, agencyId: e.target.value }))}
                  required={['DRIVER', 'AGENCY_ADMIN', 'SCANNER'].includes(form.userType)}
                  className="w-full py-2 px-3 border border-soft rounded-lg"
                >
                  <option value="">Select agency</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createLoading} className="px-4 py-2 bg-primary text-dark font-bold rounded-lg disabled:opacity-50">
              {createLoading ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 bg-soft rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface">
              <th className="pb-4 text-xs uppercase font-black text-muted tracking-widest">Name</th>
              <th className="pb-4 text-xs uppercase font-black text-muted tracking-widest">Email</th>
              <th className="pb-4 text-xs uppercase font-black text-muted tracking-widest">Phone</th>
              {isSuperAdmin && <th className="pb-4 text-xs uppercase font-black text-muted tracking-widest">Agency</th>}
              <th className="pb-4 text-xs uppercase font-black text-muted tracking-widest">Roles</th>
              <th className="pb-4 text-xs uppercase font-black text-muted tracking-widest">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface">
            {rows.map((user) => (
              <tr key={user.id} className="group hover:bg-surface/50 transition-colors">
                <td className="py-5 font-bold text-sm">{user.name}</td>
                <td className="py-5 text-sm text-dark/80">{user.email}</td>
                <td className="py-5 text-sm text-dark/80">{user.phone}</td>
                {isSuperAdmin && <td className="py-5 text-sm text-dark/80">{agencyName(user.agencyId)}</td>}
                <td className="py-5">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className={`inline-block px-2 py-0.5 rounded-lg text-sm font-bold mr-1 ${
                        role === 'passenger' ? 'bg-success-100 text-success-700' : role === 'driver' ? 'bg-info-100 text-info-700' : 'bg-soft text-dark'
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
