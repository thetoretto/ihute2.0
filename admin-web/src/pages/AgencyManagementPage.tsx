import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getTripsAsync,
  getVehiclesAsync,
  getBookingsAsync,
  getUsersAsync,
} from '../services/adminApiData';
import {
  isApiConfigured,
  getAgenciesApi,
  createAgencyApi,
  updateAgencyApi,
  deleteAgencyApi,
  assignAgencyAdminApi,
  type Agency,
} from '../services/api';
import { getUsersApi } from '../services/api';
import { useAdminScope } from '../context/AdminScopeContext';
import { adminSnapshot } from '../data/snapshot';
import type { Trip, Vehicle, Booking, User } from '../types';

export default function AgencyManagementPage() {
  const scope = useAdminScope();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [assignAgencyId, setAssignAgencyId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const refresh = useCallback(async () => {
    const [t, v, b, u] = await Promise.all([
      getTripsAsync(scope),
      getVehiclesAsync(scope),
      getBookingsAsync(scope),
      getUsersAsync(scope),
    ]);
    setTrips(t);
    setVehicles(v);
    setBookings(b);
    setUsers(u);
  }, [scope]);

  const refreshAgencies = useCallback(async () => {
    if (!isApiConfigured()) return;
    setLoadingAgencies(true);
    setError(null);
    try {
      const list = await getAgenciesApi();
      setAgencies(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load agencies');
    } finally {
      setLoadingAgencies(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!scope?.agencyId && isApiConfigured()) {
      void refreshAgencies();
    }
  }, [scope?.agencyId, refreshAgencies]);

  useEffect(() => {
    if (assignAgencyId && isApiConfigured()) {
      getUsersApi(undefined).then(setAllUsers).catch(() => setAllUsers([]));
    }
  }, [assignAgencyId]);

  const allAgenciesFromUsers = useMemo(
    () => (users.length > 0 ? users : adminSnapshot.users).filter((u) => (u.roles || []).includes('agency')),
    [users]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createAgencyApi({ name: formName.trim(), contactInfo: formContact.trim() || undefined });
      setFormName('');
      setFormContact('');
      setCreateOpen(false);
      await refreshAgencies();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setError(null);
    try {
      await updateAgencyApi(editId, { name: formName.trim(), contactInfo: formContact.trim() || null });
      setEditId(null);
      setFormName('');
      setFormContact('');
      await refreshAgencies();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this agency? Unassign all users first.')) return;
    setError(null);
    try {
      await deleteAgencyApi(id);
      await refreshAgencies();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const handleAssignAdmin = async (agencyId: string, userId: string) => {
    setError(null);
    try {
      await assignAgencyAdminApi(agencyId, userId);
      setAssignAgencyId(null);
      await refreshAgencies();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assign failed');
    }
  };

  // Super admin + API: show Agency CRUD
  if (!scope?.agencyId && isApiConfigured()) {
    const th = 'pb-4 text-xs uppercase font-black text-muted tracking-widest text-left';
    const agencyForEdit = editId ? agencies.find((a) => a.id === editId) : null;
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-soft">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-black text-dark mb-1">Agencies</h3>
              <p className="text-muted text-sm">Create, edit, delete agencies and assign agency admins.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreateOpen(true);
                setFormName('');
                setFormContact('');
                setError(null);
              }}
              className="px-4 py-2 bg-primary text-dark font-bold rounded-xl"
            >
              Create agency
            </button>
          </div>
          {error && (
            <p className="mb-4 text-danger text-sm font-semibold">{error}</p>
          )}
          {createOpen && (
            <form onSubmit={handleCreate} className="mb-6 p-4 bg-surface rounded-xl">
              <h4 className="font-bold text-dark mb-3">New agency</h4>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Name</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="py-2 px-3 border border-soft rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Contact info</label>
                  <input
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="py-2 px-3 border border-soft rounded-lg"
                    placeholder="Optional"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-primary text-dark font-bold rounded-lg">Save</button>
                <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 bg-soft rounded-lg">Cancel</button>
              </div>
            </form>
          )}
          {editId && agencyForEdit && (
            <form onSubmit={handleUpdate} className="mb-6 p-4 bg-surface rounded-xl">
              <h4 className="font-bold text-dark mb-3">Edit agency</h4>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Name</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="py-2 px-3 border border-soft rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Contact info</label>
                  <input
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="py-2 px-3 border border-soft rounded-lg"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-primary text-dark font-bold rounded-lg">Update</button>
                <button type="button" onClick={() => { setEditId(null); setFormName(''); setFormContact(''); }} className="px-4 py-2 bg-soft rounded-lg">Cancel</button>
              </div>
            </form>
          )}
          {loadingAgencies ? (
            <p className="text-muted">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface">
                    <th className={th}>Name</th>
                    <th className={th}>Contact</th>
                    <th className={th}>Users</th>
                    <th className={th}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface">
                  {agencies.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted">No agencies yet. Create one above.</td>
                    </tr>
                  ) : (
                    agencies.map((agency) => (
                      <tr key={agency.id} className="group hover:bg-surface/50">
                        <td className="py-4 font-bold">{agency.name}</td>
                        <td className="py-4 text-sm text-muted">{agency.contactInfo ?? '—'}</td>
                        <td className="py-4 text-sm">{agency.users?.length ?? agency._count?.vehicles ?? 0}</td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditId(agency.id);
                                setFormName(agency.name);
                                setFormContact(agency.contactInfo ?? '');
                                setError(null);
                              }}
                              className="px-2 py-1 text-sm font-bold bg-soft rounded-lg hover:bg-primary"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setAssignAgencyId(assignAgencyId === agency.id ? null : agency.id)}
                              className="px-2 py-1 text-sm font-bold bg-soft rounded-lg hover:bg-primary"
                            >
                              Assign admin
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(agency.id)}
                              className="px-2 py-1 text-sm font-bold text-danger bg-danger/10 rounded-lg hover:bg-danger/20"
                            >
                              Delete
                            </button>
                          </div>
                          {assignAgencyId === agency.id && (
                            <div className="mt-2 p-2 bg-surface rounded-lg">
                              <p className="text-xs font-semibold text-muted mb-1">Select user to set as agency admin:</p>
                              <select
                                className="w-full max-w-xs py-1.5 px-2 border border-soft rounded-lg text-sm"
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v) void handleAssignAdmin(agency.id, v);
                                }}
                              >
                                <option value="">Choose user…</option>
                                {allUsers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name ?? u.email} ({u.email})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-muted text-sm">
          <Link to="/users" className="font-bold text-dark hover:underline">View all users</Link> to create or manage accounts.
        </p>
      </div>
    );
  }

  // Super admin without API: fallback to users list (agency role)
  if (!scope?.agencyId) {
    const th = 'pb-4 text-xs uppercase font-black text-muted tracking-widest text-left';
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-soft">
        <h3 className="text-2xl font-black text-dark mb-2">Agencies</h3>
        <p className="text-muted text-sm mb-6">
          All agencies on the platform. Set VITE_API_BASE_URL to manage agencies (create, edit, assign admins).
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
              {allAgenciesFromUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">No agencies yet.</td>
                </tr>
              ) : (
                allAgenciesFromUsers.map((agency) => (
                  <tr key={agency.id} className="group hover:bg-surface/50 transition-colors">
                    <td className="py-5 font-bold text-sm">{agency.name}</td>
                    <td className="py-5 text-sm text-dark/80">{agency.email}</td>
                    <td className="py-5 text-sm text-dark/80">{agency.phone}</td>
                    <td className="py-5">
                      <span className="inline-block px-2 py-0.5 rounded-lg text-sm font-bold bg-soft text-dark">Agency</span>
                    </td>
                    <td className="py-5 text-sm">{agency.rating?.toFixed(1) ?? 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-muted text-sm mt-6">
          <Link to="/users" className="font-bold text-dark hover:underline">View all users</Link>
        </p>
      </div>
    );
  }

  // Agency admin: My agency overview
  const activeTrips = trips.filter((t) => t.status === 'active').length;
  const totalBookings = bookings.filter((b) => b.status !== 'cancelled').length;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8 shadow-sm border border-soft">
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
