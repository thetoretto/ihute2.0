import React, { useState } from 'react';
import { getCommissionRate, setCommissionRate } from '../config';
import { getDashboardMetrics, getEarningsByRoute, getEarningsByDriver, getEarningsByPeriod } from '../services/adminMetrics';
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

export default function IncomePage() {
  const scope = useAdminScope();
  const [rateInput, setRateInput] = useState(() => String(Math.round(getCommissionRate() * 100)));
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
    <section>
      <div className="header-row">
        <h2>Income</h2>
        <button type="button" className="btn-primary" onClick={() => downloadEarningsCsv(scope)}>Export CSV</button>
      </div>
      <p className="subtle">Commission and earnings breakdown. Edit commission rate (0–30%).</p>

      <div className="dashboard-kpi-row" style={{ marginBottom: 16 }}>
        <div className="metric-card kpi-revenue">
          <p className="metric-label">Gross earnings</p>
          <h3 className="metric-value">{Number(metrics.grossEarnings).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</h3>
        </div>
        <div className="metric-card kpi-alert">
          <p className="metric-label">App commission</p>
          <h3 className="metric-value">{Number(metrics.appCommission).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</h3>
        </div>
        <div className="metric-card kpi-active">
          <p className="metric-label">Net platform earnings</p>
          <h3 className="metric-value">{Number(metrics.netPlatformEarnings).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</h3>
        </div>
      </div>

      <div className="income-box">
        <div className="income-row">
          <span>Commission rate (0–30%)</span>
          <div>
            <input
              type="number"
              min={0}
              max={30}
              step={1}
              value={rateInput}
              onChange={(e) => handleRateChange(e.target.value)}
              className="income-cell-input"
            />
            %
          </div>
        </div>
      </div>

      <h3>By route</h3>
      <table>
        <thead>
          <tr>
            <th>Route</th>
            <th>Gross (RWF)</th>
            <th>Commission (RWF)</th>
            <th>Net (RWF)</th>
          </tr>
        </thead>
        <tbody>
          {byRoute.map((r) => (
            <tr key={r.route}>
              <td>{r.route}</td>
              <td>{Number(r.gross).toLocaleString('en-RW', { maximumFractionDigits: 0 })}</td>
              <td>{Number(r.commission).toLocaleString('en-RW', { maximumFractionDigits: 0 })}</td>
              <td>{Number(r.net).toLocaleString('en-RW', { maximumFractionDigits: 0 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>By driver</h3>
      <table>
        <thead>
          <tr>
            <th>Driver</th>
            <th>Gross (RWF)</th>
            <th>Commission (RWF)</th>
            <th>Net (RWF)</th>
          </tr>
        </thead>
        <tbody>
          {byDriver.map((r) => (
            <tr key={r.driverId}>
              <td>{r.driverName}</td>
              <td>{Number(r.gross).toLocaleString('en-RW', { maximumFractionDigits: 0 })}</td>
              <td>{Number(r.commission).toLocaleString('en-RW', { maximumFractionDigits: 0 })}</td>
              <td>{Number(r.net).toLocaleString('en-RW', { maximumFractionDigits: 0 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>By period (day)</h3>
      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th>Gross (RWF)</th>
            <th>Commission (RWF)</th>
            <th>Net (RWF)</th>
          </tr>
        </thead>
        <tbody>
          {byPeriod.map((r) => (
            <tr key={r.period}>
              <td>{r.period}</td>
              <td>{Number(r.gross).toLocaleString('en-RW', { maximumFractionDigits: 0 })}</td>
              <td>{Number(r.commission).toLocaleString('en-RW', { maximumFractionDigits: 0 })}</td>
              <td>{Number(r.net).toLocaleString('en-RW', { maximumFractionDigits: 0 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
