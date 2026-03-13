import React, { useState, useEffect, useCallback } from 'react';
import { getScannerReportApi, isApiConfigured } from '../services/api';

interface ReportItem {
  id: string;
  bookingId: string;
  route: string;
  passengerName: string | null;
  status: string;
  scannedAt: string | null;
}

export default function ScannerReportPage() {
  const [report, setReport] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      setReport([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getScannerReportApi();
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load report');
      setReport([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-soft">
        <p className="text-muted">Loading scanner report…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-soft">
        <p className="text-danger font-semibold">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 px-4 py-2 bg-primary text-dark font-bold rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  const th = 'pb-4 text-xs uppercase font-black text-muted tracking-widest text-left';
  return (
    <div className="bg-white rounded-xl shadow-sm border border-soft overflow-hidden">
      <div className="p-6 border-b border-soft flex items-center justify-between">
        <h3 className="text-xl font-black text-dark">Scanner report</h3>
        <button
          type="button"
          onClick={() => void load()}
          className="px-3 py-1.5 text-sm font-bold bg-surface rounded-lg hover:bg-primary"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface bg-surface/50">
              <th className={th}>Booking</th>
              <th className={th}>Route</th>
              <th className={th}>Passenger</th>
              <th className={th}>Status</th>
              <th className={th}>Scanned at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface">
            {report.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No scanned tickets in report yet.
                </td>
              </tr>
            ) : (
              report.map((row) => (
                <tr key={row.id} className="hover:bg-surface/30">
                  <td className="py-4 font-mono text-sm">{row.bookingId}</td>
                  <td className="py-4 text-sm">{row.route}</td>
                  <td className="py-4 text-sm">{row.passengerName ?? '—'}</td>
                  <td className="py-4">
                    <span className="inline-block px-2 py-0.5 rounded-lg text-sm font-bold bg-soft text-dark">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-muted">
                    {row.scannedAt ? new Date(row.scannedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
