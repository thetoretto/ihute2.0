import React, { useState, useEffect } from 'react';
import { getVehicles, setVehicleApproval } from '../services/adminData';
import { adminSnapshot } from '../data/snapshot';
import { useAdminScope } from '../context/AdminScopeContext';
import type { Vehicle } from '../types';

export default function VehiclesPage() {
  const scope = useAdminScope();
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getVehicles(scope));

  useEffect(() => {
    setVehicles([...getVehicles(scope)]);
  }, [scope]);

  const refresh = () => setVehicles([...getVehicles(scope)]);

  const getDriverName = (driverId: string) => adminSnapshot.users.find((u) => u.id === driverId)?.name ?? driverId;

  const handleApproval = (vehicleId: string, approvalStatus: Vehicle['approvalStatus']) => {
    setVehicleApproval(vehicleId, approvalStatus);
    refresh();
  };

  const th = 'pb-4 text-[10px] uppercase font-black text-muted tracking-widest text-left';
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
      <h3 className="text-2xl font-black text-dark mb-2">Vehicles</h3>
      <p className="text-muted text-sm mb-6">Approve or reject driver vehicles.</p>
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
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    v.approvalStatus === 'pending' ? 'bg-primary text-dark' : v.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {v.approvalStatus.toUpperCase()}
                  </span>
                </td>
                <td className="py-5">
                  {v.approvalStatus !== 'approved' && (
                    <button type="button" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-primary text-dark mr-2" onClick={() => handleApproval(v.id, 'approved')}>Approve</button>
                  )}
                  {v.approvalStatus !== 'rejected' && (
                    <button type="button" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-red-100 text-red-700 mr-2" onClick={() => handleApproval(v.id, 'rejected')}>Reject</button>
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
