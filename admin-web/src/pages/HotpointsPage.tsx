import React, { useState } from 'react';
import type { Hotpoint } from '../types';
import { getHotpoints, createHotpoint, updateHotpoint, deleteHotpoint } from '../services/adminData';

const emptyForm: Partial<Hotpoint> = { name: '', address: '', latitude: 0, longitude: 0, country: '' };

export default function HotpointsPage() {
  const [hotpoints, setHotpoints] = useState<Hotpoint[]>(() => getHotpoints());
  const [editing, setEditing] = useState<Hotpoint | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<Hotpoint>>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const refresh = () => setHotpoints([...getHotpoints()]);

  const handleSaveNew = () => {
    if (!form.name || form.latitude == null || form.longitude == null) return;
    createHotpoint({
      name: form.name,
      address: form.address ?? '',
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      country: form.country,
    });
    setAdding(false);
    setForm(emptyForm);
    refresh();
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    updateHotpoint(editing.id, {
      name: form.name,
      address: form.address,
      latitude: form.latitude != null ? Number(form.latitude) : undefined,
      longitude: form.longitude != null ? Number(form.longitude) : undefined,
      country: form.country,
    });
    setEditing(null);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (deleteHotpoint(id)) {
      setDeleteConfirm(null);
      refresh();
    } else {
      alert('Cannot delete: hot point is in use by one or more trips.');
    }
  };

  const th = 'pb-4 text-[10px] uppercase font-black text-muted tracking-widest text-left';
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-dark">Hot points</h3>
        <button type="button" className="px-4 py-2 bg-primary text-dark rounded-xl font-bold text-sm" onClick={() => { setAdding(true); setForm(emptyForm); }}>
          Add hot point
        </button>
      </div>
      <p className="text-muted text-sm mb-6">Pickup and drop-off locations used for trips.</p>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface">
              <th className={th}>Name</th>
              <th className={th}>Address</th>
              <th className={th}>Country</th>
              <th className={th}>Coordinates</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface">
            {hotpoints.map((h) => (
              <tr key={h.id} className="group hover:bg-surface/50 transition-colors">
                <td className="py-5 font-bold text-sm">{h.name}</td>
                <td className="py-5 text-sm">{h.address ?? '—'}</td>
                <td className="py-5 text-sm">{h.country ?? '—'}</td>
                <td className="py-5 text-sm">{h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}</td>
                <td className="py-5">
                  <button type="button" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-surface hover:bg-soft mr-2" onClick={() => { setEditing(h); setForm({ name: h.name, address: h.address, latitude: h.latitude, longitude: h.longitude, country: h.country }); }}>Edit</button>
                  <button type="button" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-red-100 text-red-700 mr-2" onClick={() => setDeleteConfirm(h.id)}>Delete</button>
                  {deleteConfirm === h.id && (
                    <span className="inline-block ml-2">
                      Confirm? <button type="button" className="px-2 py-1 rounded text-sm font-bold bg-primary text-dark mr-1" onClick={() => handleDelete(h.id)}>Yes</button>
                      <button type="button" className="px-2 py-1 rounded text-sm font-bold bg-surface" onClick={() => setDeleteConfirm(null)}>No</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adding && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Add hot point</h3>
            <div className="form-group"><label>Name</label><input value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label>Address</label><input value={form.address ?? ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
            <div className="form-group"><label>Country</label><input value={form.country ?? ''} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} /></div>
            <div className="form-row">
              <div className="form-group"><label>Latitude</label><input type="number" step="any" value={form.latitude ?? ''} onChange={(e) => setForm((f) => ({ ...f, latitude: Number(e.target.value) }))} /></div>
              <div className="form-group"><label>Longitude</label><input type="number" step="any" value={form.longitude ?? ''} onChange={(e) => setForm((f) => ({ ...f, longitude: Number(e.target.value) }))} /></div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={handleSaveNew}>Save</button>
              <button type="button" className="btn-sm" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {editing && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Edit hot point</h3>
            <div className="form-group"><label>Name</label><input value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label>Address</label><input value={form.address ?? ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
            <div className="form-group"><label>Country</label><input value={form.country ?? ''} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} /></div>
            <div className="form-row">
              <div className="form-group"><label>Latitude</label><input type="number" step="any" value={form.latitude ?? ''} onChange={(e) => setForm((f) => ({ ...f, latitude: Number(e.target.value) }))} /></div>
              <div className="form-group"><label>Longitude</label><input type="number" step="any" value={form.longitude ?? ''} onChange={(e) => setForm((f) => ({ ...f, longitude: Number(e.target.value) }))} /></div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={handleSaveEdit}>Save</button>
              <button type="button" className="btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
