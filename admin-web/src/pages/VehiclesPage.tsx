import React, { useState, useEffect, useCallback } from 'react';
import { getVehiclesAsync, getUsersAsync } from '../services/adminApiData';
import { createVehicleApi, updateVehicleApi } from '../services/api';
import { useAdminScope } from '../context/AdminScopeContext';
import type { Vehicle, User } from '../types';

export default function VehiclesPage() {
  const scope = useAdminScope();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    driverId: '',
    make: '',
    model: '',
    seats: 14,
    licensePlate: '',
    color: '',
  });

  const refresh = useCallback(async () => {
    const [v, u] = await Promise.all([getVehiclesAsync(scope), getUsersAsync(scope)]);
    setVehicles(v);
    setUsers(u);
  }, [scope]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const getDriverName = (driverId: string) => userMap.get(driverId)?.name ?? driverId;

  const driversAndAgency = users.filter(
    (u) => (u.roles || []).includes('driver') || (u.roles || []).includes('agency')
  );

  const handleApproval = async (vehicleId: string, approvalStatus: Vehicle['approvalStatus']) => {
    setAddError(null);
    try {
      await updateVehicleApi(vehicleId, { approvalStatus });
      await refresh();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to update vehicle');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!addForm.make?.trim() || !addForm.model?.trim() || !addForm.licensePlate?.trim()) {
      setAddError('Make, model, and license plate are required.');
      return;
    }
    if (!addForm.driverId?.trim()) {
      setAddError('Please select a driver.');
      return;
    }
    setAddLoading(true);
    try {
      await createVehicleApi({
        make: addForm.make.trim(),
        model: addForm.model.trim(),
        seats: addForm.seats,
        licensePlate: addForm.licensePlate.trim(),
        color: addForm.color.trim() || undefined,
        driverId: addForm.driverId,
        ownerId: addForm.driverId,
        agencyId: scope?.agencyId,
      });
      setAddOpen(false);
      setAddForm({ driverId: '', make: '', model: '', seats: 14, licensePlate: '', color: '' });
      await refresh();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to create vehicle');
    } finally {
      setAddLoading(false);
    }
  };

  const th = 'pb-4 text-xs uppercase font-black text-muted tracking-widest text-left';
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-soft">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-black text-dark mb-2">Vehicles</h3>
          <p className="text-muted text-sm">Approve or reject driver vehicles, or add a new vehicle.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="px-4 py-2 rounded-lg text-sm font-bold bg-surface hover:bg-soft" onClick={() => refresh()}>
            Refresh
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-dark"
            onClick={() => { setAddOpen(true); setAddError(null); }}
          >
            Add vehicle
          </button>
        </div>
      </div>

      {addError && (
        <div className="mb-4 p-3 rounded-lg bg-danger-100 text-danger-700 text-sm">{addError}</div>
      )}

      {addOpen && (
        <form onSubmit={handleAddSubmit} className="mb-6 p-4 rounded-xl border border-soft bg-surface/30">
          <h4 className="font-bold text-dark mb-3">New vehicle</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-muted mb-1">Driver</label>
              <select
                value={addForm.driverId}
                onChange={(e) => setAddForm((f) => ({ ...f, driverId: e.target.value }))}
                className="w-full border border-soft rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="">Select driver</option>
                {driversAndAgency.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted mb-1">Make</label>
              <input
                type="text"
                value={addForm.make}
                onChange={(e) => setAddForm((f) => ({ ...f, make: e.target.value }))}
                className="w-full border border-soft rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Toyota"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted mb-1">Model</label>
              <input
                type="text"
                value={addForm.model}
                onChange={(e) => setAddForm((f) => ({ ...f, model: e.target.value }))}
                className="w-full border border-soft rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Coaster"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted mb-1">Seats</label>
              <input
                type="number"
                min={1}
                value={addForm.seats}
                onChange={(e) => setAddForm((f) => ({ ...f, seats: parseInt(e.target.value, 10) || 1 }))}
                className="w-full border border-soft rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted mb-1">License plate</label>
              <input
                type="text"
                value={addForm.licensePlate}
                onChange={(e) => setAddForm((f) => ({ ...f, licensePlate: e.target.value }))}
                className="w-full border border-soft rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. RAB 123 A"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted mb-1">Color (optional)</label>
              <input
                type="text"
                value={addForm.color}
                onChange={(e) => setAddForm((f) => ({ ...f, color: e.target.value }))}
                className="w-full border border-soft rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. White"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={addLoading} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-dark disabled:opacity-50">
              {addLoading ? 'Creating…' : 'Create vehicle'}
            </button>
            <button type="button" className="px-4 py-2 rounded-lg text-sm font-bold bg-surface hover:bg-soft" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface">
              <th className={th}>Driver</th>
              <th className={th}>Make / Model</th>
              <th className={th}>Color</th>
              <th className={th}>Plate</th>
              <th className={th}>Seats</th>
              <th className={th}>Status</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface">
            {vehicles.map((v) => (
              <tr key={v.id} className="group hover:bg-surface/50 transition-colors">
                <td className="py-5 font-bold text-sm">{getDriverName(v.driverId ?? '')}</td>
                <td className="py-5 text-sm">{v.make} {v.model}</td>
                <td className="py-5 text-sm">{v.color}</td>
                <td className="py-5 text-sm">{v.licensePlate}</td>
                <td className="py-5 text-sm">{v.seats}</td>
                <td className="py-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    v.approvalStatus === 'pending' ? 'bg-primary text-dark' : v.approvalStatus === 'approved' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                  }`}>
                    {v.approvalStatus.toUpperCase()}
                  </span>
                </td>
                <td className="py-5">
                  {v.approvalStatus !== 'approved' && (
                    <button type="button" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-primary text-dark mr-2" onClick={() => handleApproval(v.id, 'approved')}>Approve</button>
                  )}
                  {v.approvalStatus !== 'rejected' && (
                    <button type="button" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-danger-100 text-danger-700 mr-2" onClick={() => handleApproval(v.id, 'rejected')}>Reject</button>
                  )}
                  {v.approvalStatus === 'approved' && (
                    <button type="button" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-surface hover:bg-soft" onClick={() => handleApproval(v.id, 'pending')}>Set pending</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
