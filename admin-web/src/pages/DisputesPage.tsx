import React, { useState, useEffect, useCallback } from 'react';
import { getDisputes as getDisputesLocal, getBookings, resolveDispute as resolveDisputeLocal, setDisputeStatus as setDisputeStatusLocal } from '../services/adminData';
import { getDisputes as getDisputesApi, patchDispute as patchDisputeApi, isApiConfigured } from '../services/api';
import { getBookingsAsync, getUsersAsync } from '../services/adminApiData';
import { adminSnapshot } from '../data/snapshot';
import { useAdminScope } from '../context/AdminScopeContext';
import type { Dispute, Booking, User } from '../types';

export default function DisputesPage() {
  const scope = useAdminScope();
  const useApi = isApiConfigured();
  const [disputes, setDisputes] = useState<Dispute[]>(() => (useApi ? [] : getDisputesLocal(scope)));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(useApi);
  const [filter, setFilter] = useState<Dispute['status'] | 'all'>('all');
  const [detail, setDetail] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolvedBy, setResolvedBy] = useState('admin');

  const refresh = useCallback(async () => {
    if (useApi) {
      setLoading(true);
      try {
        const [list, b, u] = await Promise.all([
          getDisputesApi(scope),
          getBookingsAsync(scope),
          getUsersAsync(scope),
        ]);
        setDisputes(list);
        setBookings(b);
        setUsers(u);
      } finally {
        setLoading(false);
      }
    } else {
      setDisputes([...getDisputesLocal(scope)]);
    }
  }, [scope, useApi]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = filter === 'all' ? disputes : disputes.filter((d) => d.status === filter);

  const bookingsForRoute = useApi ? bookings : getBookings(scope);
  const getReporterName = (id: string) =>
    useApi
      ? (users.find((u) => u.id === id)?.name ?? id)
      : (adminSnapshot.users.find((u) => u.id === id)?.name ?? id);
  const getBooking = (bookingId: string) => bookingsForRoute.find((b) => b.id === bookingId);
  const getRoute = (d: Dispute) => {
    const b = getBooking(d.bookingId);
    if (!b) return d.bookingId;
    return `${b.trip?.departureHotpoint?.name ?? '—'} → ${b.trip?.destinationHotpoint?.name ?? '—'}`;
  };

  const handleResolve = async () => {
    if (!detail || !resolution.trim()) return;
    if (useApi) {
      try {
        await patchDisputeApi(detail.id, { status: 'resolved', resolution: resolution.trim(), resolvedBy });
        setDetail(null);
        setResolution('');
        await refresh();
      } catch (err) {
        console.error(err);
      }
    } else {
      resolveDisputeLocal(detail.id, resolution.trim(), resolvedBy);
      setDetail(null);
      setResolution('');
      refresh();
    }
  };

  const handleSetStatus = async (id: string, status: Dispute['status']) => {
    if (useApi) {
      try {
        await patchDisputeApi(id, { status });
        await refresh();
      } catch (err) {
        console.error(err);
      }
    } else {
      setDisputeStatusLocal(id, status);
      refresh();
    }
  };

  const th = 'pb-4 text-[10px] uppercase font-black text-muted tracking-widest text-left';
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-dark">Disputes</h3>
        <div className="flex gap-2">
          {(['all', 'open', 'in_review', 'resolved'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === s ? 'bg-dark text-primary' : 'bg-surface text-dark hover:bg-soft'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <p className="text-muted text-sm mb-6">Resolve payment, cancellation, and other disputes.</p>
      {useApi && <p className="text-muted text-xs mb-4">Using server API (VITE_API_BASE_URL).</p>}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface">
              <th className={th}>ID</th>
              <th className={th}>Booking</th>
              <th className={th}>Route</th>
              <th className={th}>Reporter</th>
              <th className={th}>Type</th>
              <th className={th}>Status</th>
              <th className={th}>Created</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface">
            {loading ? (
              <tr><td colSpan={8} className="py-8 text-center text-muted">Loading…</td></tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="group hover:bg-surface/50 transition-colors">
                  <td className="py-5 text-sm font-medium">{d.id}</td>
                  <td className="py-5 text-sm">{d.bookingId}</td>
                  <td className="py-5 text-sm">{getRoute(d)}</td>
                  <td className="py-5 text-sm">{getReporterName(d.reporterId)}</td>
                  <td className="py-5 text-sm">{d.type}</td>
                  <td className="py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      d.status === 'resolved' ? 'bg-gray-100 text-gray-700' : d.status === 'in_review' ? 'bg-blue-100 text-blue-700' : 'bg-primary text-dark'
                    }`}>
                      {d.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-5 text-sm">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="py-5">
                    <button type="button" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-surface hover:bg-soft mr-2" onClick={() => { setDetail(d); setResolution(d.resolution ?? ''); }}>View</button>
                    {d.status !== 'resolved' && (
                      <>
                        {d.status !== 'in_review' && <button type="button" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-surface hover:bg-soft mr-2" onClick={() => handleSetStatus(d.id, 'in_review')}>In review</button>}
                        <button type="button" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-primary text-dark" onClick={() => setDetail(d)}>Resolve</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card modal-wide">
            <h3>Dispute {detail.id}</h3>
            <p><strong>Booking:</strong> {detail.bookingId} · <strong>Route:</strong> {getRoute(detail)}</p>
            <p><strong>Reporter:</strong> {getReporterName(detail.reporterId)} · <strong>Type:</strong> {detail.type} · <strong>Status:</strong>{' '}
            <span className={`status-chip status-${detail.status === 'in_review' ? 'in_review' : detail.status}`}>
              {detail.status.toUpperCase()}
            </span>
            </p>
            <p><strong>Description:</strong></p>
            <p className="subtle">{detail.description}</p>
            {detail.status !== 'resolved' && (
              <>
                <div className="form-group">
                  <label>Resolution</label>
                  <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} />
                </div>
                <div className="form-group">
                  <label>Resolved by</label>
                  <input value={resolvedBy} onChange={(e) => setResolvedBy(e.target.value)} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-primary" onClick={handleResolve}>Mark resolved</button>
                  <button type="button" className="btn-sm" onClick={() => setDetail(null)}>Close</button>
                </div>
              </>
            )}
            {detail.status === 'resolved' && detail.resolution && (
              <>
                <p><strong>Resolution:</strong> {detail.resolution}</p>
                <p className="subtle">Resolved by {detail.resolvedBy} at {detail.resolvedAt ? new Date(detail.resolvedAt).toLocaleString() : ''}</p>
                <button type="button" className="btn-sm" onClick={() => setDetail(null)}>Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
