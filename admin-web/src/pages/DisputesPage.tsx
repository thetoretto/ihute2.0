import React, { useState, useEffect, useCallback } from 'react';
import { getDisputes as getDisputesApi, patchDispute as patchDisputeApi } from '../services/api';
import { getBookingsAsync, getUsersAsync } from '../services/adminApiData';
import { useAdminScope } from '../context/AdminScopeContext';
import type { Dispute, Booking, User } from '../types';

export default function DisputesPage() {
  const scope = useAdminScope();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Dispute['status'] | 'all'>('all');
  const [detail, setDetail] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolvedBy, setResolvedBy] = useState('admin');

  const refresh = useCallback(async () => {
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
  }, [scope]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = filter === 'all' ? disputes : disputes.filter((d) => d.status === filter);

  const getReporterName = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const getBooking = (bookingId: string) => bookings.find((b) => b.id === bookingId);
  const getRoute = (d: Dispute) => {
    const b = getBooking(d.bookingId);
    if (!b) return d.bookingId;
    return `${b.trip?.departureHotpoint?.name ?? '—'} → ${b.trip?.destinationHotpoint?.name ?? '—'}`;
  };

  const handleResolve = async () => {
    if (!detail || !resolution.trim()) return;
    try {
      await patchDisputeApi(detail.id, { status: 'resolved', resolution: resolution.trim(), resolvedBy });
      setDetail(null);
      setResolution('');
      await refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetStatus = async (id: string, status: Dispute['status']) => {
    try {
      await patchDisputeApi(id, { status });
      await refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const th = 'pb-4 text-xs uppercase font-black text-muted tracking-widest text-left';
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-soft">
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
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      d.status === 'resolved' ? 'bg-neutral-100 text-neutral-700' : d.status === 'in_review' ? 'bg-info-100 text-info-700' : 'bg-primary text-dark'
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
        <div className="fixed inset-0 bg-dark/40 flex items-center justify-center z-modal" role="dialog" aria-modal="true">
          <div className="bg-white border border-soft rounded-xl p-5 max-w-xl w-modal shadow-soft">
            <h3 className="text-lg font-black text-dark m-0 mb-3">Dispute {detail.id}</h3>
            <p><strong>Booking:</strong> {detail.bookingId} · <strong>Route:</strong> {getRoute(detail)}</p>
            <p><strong>Reporter:</strong> {getReporterName(detail.reporterId)} · <strong>Type:</strong> {detail.type} · <strong>Status:</strong>{' '}
            <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
              detail.status === 'resolved' ? 'bg-neutral-100 text-neutral-700' : detail.status === 'in_review' ? 'bg-info-100 text-info-700' : 'bg-primary text-dark'
            }`}>
              {detail.status.toUpperCase()}
            </span>
            </p>
            <p><strong>Description:</strong></p>
            <p className="text-muted mb-4">{detail.description}</p>
            {detail.status !== 'resolved' && (
              <>
                <div className="mb-3">
                  <label className="block mb-1 text-sm text-muted">Resolution</label>
                  <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} className="w-full py-2 px-2.5 border border-soft rounded-xl bg-white text-dark outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 text-sm text-muted">Resolved by</label>
                  <input value={resolvedBy} onChange={(e) => setResolvedBy(e.target.value)} className="w-full py-2 px-2.5 border border-soft rounded-xl bg-white text-dark outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="flex gap-2 flex-wrap mt-4">
                  <button type="button" className="min-h-10 px-4 py-0 bg-primary text-dark border border-primary/50 rounded-xl font-semibold cursor-pointer" onClick={handleResolve}>Mark resolved</button>
                  <button type="button" className="min-h-10 px-4 py-0 bg-muted text-dark border border-soft rounded-xl font-semibold cursor-pointer" onClick={() => setDetail(null)}>Close</button>
                </div>
              </>
            )}
            {detail.status === 'resolved' && detail.resolution && (
              <>
                <p><strong>Resolution:</strong> {detail.resolution}</p>
                <p className="text-muted mb-4">Resolved by {detail.resolvedBy} at {detail.resolvedAt ? new Date(detail.resolvedAt).toLocaleString() : ''}</p>
                <button type="button" className="min-h-10 px-4 py-0 bg-muted text-dark border border-soft rounded-xl font-semibold cursor-pointer" onClick={() => setDetail(null)}>Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
