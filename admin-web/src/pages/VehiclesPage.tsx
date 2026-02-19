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

  return (
    <section>
      <h2>Vehicles</h2>
      <p className="subtle">Approve or reject driver vehicles.</p>
      <table>
        <thead>
          <tr>
            <th>Driver</th>
            <th>Make / Model</th>
            <th>Color</th>
            <th>Plate</th>
            <th>Seats</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id}>
              <td>{getDriverName(v.driverId ?? '')}</td>
              <td>{v.make} {v.model}</td>
              <td>{v.color}</td>
              <td>{v.licensePlate}</td>
              <td>{v.seats}</td>
              <td>
                <span className={`status-chip status-${v.approvalStatus === 'pending' ? 'open' : v.approvalStatus === 'approved' ? 'approved' : 'rejected'}`}>
                  {v.approvalStatus.toUpperCase()}
                </span>
              </td>
              <td>
                {v.approvalStatus !== 'approved' && (
                  <button type="button" className="btn-sm btn-primary" onClick={() => handleApproval(v.id, 'approved')}>Approve</button>
                )}
                {v.approvalStatus !== 'rejected' && (
                  <button type="button" className="btn-sm btn-danger" onClick={() => handleApproval(v.id, 'rejected')}>Reject</button>
                )}
                {v.approvalStatus === 'approved' && (
                  <button type="button" className="btn-sm" onClick={() => handleApproval(v.id, 'pending')}>Set pending</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
