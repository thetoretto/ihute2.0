import React, { useState } from 'react';

export default function SettingsPage() {
  const [commission, setCommission] = useState('10');

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-soft max-w-2xl">
      <h3 className="text-2xl font-black text-dark mb-2">Platform settings</h3>
      <p className="text-muted text-sm mb-6">
        Configure platform-wide options. Only visible to system admins.
      </p>
      <div className="space-y-6">
        <div>
          <label htmlFor="commission" className="block text-sm font-semibold text-muted mb-1.5">
            Commission (%)
          </label>
          <input
            id="commission"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="w-full max-w-xs py-2.5 px-3 border border-soft rounded-xl bg-white text-dark"
          />
          <p className="text-xs text-muted mt-1">Default commission rate (e.g. 10%). Backend integration coming soon.</p>
        </div>
        <p className="text-sm text-muted">
          More settings (payment providers, notifications, etc.) can be added here.
        </p>
      </div>
    </div>
  );
}
