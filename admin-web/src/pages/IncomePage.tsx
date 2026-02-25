import React, { useState } from 'react';
import { CreditCard, Download } from 'lucide-react';
import { getCommissionRate, setCommissionRate } from '../config';
import {
  getDashboardMetrics,
  getEarningsByRoute,
  getEarningsByDriver,
  getEarningsByPeriod,
} from '../services/adminMetrics';
import { useAdminScope } from '../context/AdminScopeContext';

function downloadEarningsCsv(scope?: ReturnType<typeof useAdminScope>) {
  const byRoute = getEarningsByRoute(scope);
  const headers = ['Route', 'Gross (RWF)', 'Commission (RWF)', 'Net (RWF)'];
  const rows = byRoute.map((r) => [
    r.route,
    Number(r.gross).toLocaleString('en-RW', { maximumFractionDigits: 0 }),
    Number(r.commission).toLocaleString('en-RW', { maximumFractionDigits: 0 }),
    Number(r.net).toLocaleString('en-RW', { maximumFractionDigits: 0 }),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `earnings-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const tableTh =
  'pb-4 text-[10px] uppercase font-black text-muted tracking-widest text-left';

export default function IncomePage() {
  const scope = useAdminScope();
  const [rateInput, setRateInput] = useState(() =>
    String(Math.round(getCommissionRate() * 100))
  );
  const metrics = getDashboardMetrics(scope);
  const byRoute = getEarningsByRoute(scope);
  const byDriver = getEarningsByDriver(scope);
  const byPeriod = getEarningsByPeriod('day', scope);

  const handleRateChange = (value: string) => {
    setRateInput(value);
    const n = Number(value);
    if (!Number.isNaN(n)) setCommissionRate(n / 100);
  };

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark rounded-[32px] p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary opacity-10 rounded-full blur-2xl" />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-muted text-xs font-bold uppercase tracking-widest">
                Gross earnings
              </p>
              <p className="text-2xl font-black text-primary mt-1">
                {Number(metrics.grossEarnings).toLocaleString('en-RW', {
                  maximumFractionDigits: 0,
                })}{' '}
                RWF
              </p>
            </div>
            <CreditCard className="text-primary" size={28} />
          </div>
        </div>
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-soft">
          <p className="text-muted text-xs font-bold uppercase tracking-widest">
            App commission
          </p>
          <p className="text-2xl font-black text-dark mt-1">
            {Number(metrics.appCommission).toLocaleString('en-RW', {
              maximumFractionDigits: 0,
            })}{' '}
            RWF
          </p>
        </div>
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-soft">
          <p className="text-muted text-xs font-bold uppercase tracking-widest">
            Net platform earnings
          </p>
          <p className="text-2xl font-black text-dark mt-1">
            {Number(metrics.netPlatformEarnings).toLocaleString('en-RW', {
              maximumFractionDigits: 0,
            })}{' '}
            RWF
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-dark">Income</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-dark">Commission rate (0–30%)</span>
              <input
                type="number"
                min={0}
                max={30}
                step={1}
                value={rateInput}
                onChange={(e) => handleRateChange(e.target.value)}
                className="w-16 py-2 px-3 border border-soft rounded-xl text-sm font-bold text-center"
              />
              <span className="text-sm font-bold">%</span>
            </div>
            <button
              type="button"
              onClick={() => downloadEarningsCsv(scope)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-dark rounded-xl font-bold text-sm"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <p className="text-muted text-sm mb-8">
          Commission and earnings breakdown. Edit commission rate (0–30%).
        </p>

        <h4 className="text-lg font-black text-dark mb-4">By route</h4>
        <div className="w-full overflow-x-auto mb-10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface">
                <th className={tableTh}>Route</th>
                <th className={tableTh}>Gross (RWF)</th>
                <th className={tableTh}>Commission (RWF)</th>
                <th className={tableTh}>Net (RWF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {byRoute.map((r) => (
                <tr key={r.route} className="group hover:bg-surface/50 transition-colors">
                  <td className="py-5 font-medium text-sm">{r.route}</td>
                  <td className="py-5 text-sm">
                    {Number(r.gross).toLocaleString('en-RW', {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-5 text-sm">
                    {Number(r.commission).toLocaleString('en-RW', {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-5 text-sm">
                    {Number(r.net).toLocaleString('en-RW', {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="text-lg font-black text-dark mb-4">By driver</h4>
        <div className="w-full overflow-x-auto mb-10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface">
                <th className={tableTh}>Driver</th>
                <th className={tableTh}>Gross (RWF)</th>
                <th className={tableTh}>Commission (RWF)</th>
                <th className={tableTh}>Net (RWF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {byDriver.map((r) => (
                <tr key={r.driverId} className="group hover:bg-surface/50 transition-colors">
                  <td className="py-5 font-medium text-sm">{r.driverName}</td>
                  <td className="py-5 text-sm">
                    {Number(r.gross).toLocaleString('en-RW', {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-5 text-sm">
                    {Number(r.commission).toLocaleString('en-RW', {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-5 text-sm">
                    {Number(r.net).toLocaleString('en-RW', {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="text-lg font-black text-dark mb-4">By period (day)</h4>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface">
                <th className={tableTh}>Period</th>
                <th className={tableTh}>Gross (RWF)</th>
                <th className={tableTh}>Commission (RWF)</th>
                <th className={tableTh}>Net (RWF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {byPeriod.map((r) => (
                <tr key={r.period} className="group hover:bg-surface/50 transition-colors">
                  <td className="py-5 font-medium text-sm">{r.period}</td>
                  <td className="py-5 text-sm">
                    {Number(r.gross).toLocaleString('en-RW', {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-5 text-sm">
                    {Number(r.commission).toLocaleString('en-RW', {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-5 text-sm">
                    {Number(r.net).toLocaleString('en-RW', {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
