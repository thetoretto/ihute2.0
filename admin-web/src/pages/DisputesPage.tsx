import React, { useState, useEffect } from 'react';
import { getDisputes, getBookings, resolveDispute, setDisputeStatus } from '../services/adminData';
import { adminSnapshot } from '../data/snapshot';
import { useAdminScope } from '../context/AdminScopeContext';
import type { Dispute } from '../types';

export default function DisputesPage() {
  const scope = useAdminScope();
  const [disputes, setDisputes] = useState<Dispute[]>(() => getDisputes(scope));
  const [filter, setFilter] = useState<Dispute['status'] | 'all'>('all');
  const [detail, setDetail] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolvedBy, setResolvedBy] = useState('admin');

  useEffect(() => {
    setDisputes([...getDisputes(scope)]);
  }, [scope]);

  const refresh = () => setDisputes([...getDisputes(scope)]);

  const filtered = filter === 'all' ? disputes : disputes.filter((d) => d.status === filter);

  const bookings = getBookings(scope);
  const getReporterName = (id: string) => adminSnapshot.users.find((u) => u.id === id)?.name ?? id;
  const getBooking = (bookingId: string) => bookings.find((b) => b.id === bookingId);
  const getRoute = (d: Dispute) => {
    const b = getBooking(d.bookingId);
    if (!b) return '—';
    return `${b.trip.departureHotpoint.name} → ${b.trip.destinationHotpoint.name}`;
  };

  const handleResolve = () => {
    if (!detail || !resolution.trim()) return;
    resolveDispute(detail.id, resolution.trim(), resolvedBy);
    setDetail(null);
    setResolution('');
    refresh();
  };

  const handleSetStatus = (id: string, status: Dispute['status']) => {
    setDisputeStatus(id, status);
    refresh();
  };

  return (
    <section>
      <div className="header-row">
        <h2>Disputes</h2>
        <div className="chip-row">
          {(['all', 'open', 'in_review', 'resolved'] as const).map((s) => (
            <button key={s} className={`chip ${filter === s ? 'chip-active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <p className="subtle">Resolve payment, cancellation, and other disputes.</p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Booking</th>
            <th>Route</th>
            <th>Reporter</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.bookingId}</td>
              <td>{getRoute(d)}</td>
              <td>{getReporterName(d.reporterId)}</td>
              <td>{d.type}</td>
              <td>
                <span className={`status-chip status-${d.status === 'in_review' ? 'in_review' : d.status}`}>
                  {d.status.toUpperCase()}
                </span>
              </td>
              <td>{new Date(d.createdAt).toLocaleDateString()}</td>
              <td>
                <button type="button" className="btn-sm" onClick={() => { setDetail(d); setResolution(d.resolution ?? ''); }}>View</button>
                {d.status !== 'resolved' && (
                  <>
                    {d.status !== 'in_review' && <button type="button" className="btn-sm" onClick={() => handleSetStatus(d.id, 'in_review')}>In review</button>}
                    <button type="button" className="btn-sm btn-primary" onClick={() => setDetail(d)}>Resolve</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
    </section>
  );
}
