import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getDashboardMetrics,
  getEarningsByPeriod,
  getEarningsByRoute,
} from '../services/adminMetrics';
import { getBookings, getDisputes } from '../services/adminData';
import { useAdminScope } from '../context/AdminScopeContext';
import { adminSnapshot } from '../data/snapshot';
import BarChartTrend from '../components/BarChartTrend';
import DonutChartBreakdown from '../components/DonutChartBreakdown';
import type { TrendDataPoint } from '../components/BarChartTrend';
import type { BreakdownItem } from '../components/DonutChartBreakdown';
import { formatRwf } from '@shared';
import type { Dispute } from '../types';

function MetricCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: 'kpi-revenue' | 'kpi-customers' | 'kpi-active' | 'kpi-alert';
}) {
  return (
    <div className={`metric-card ${variant}`}>
      <p className="metric-label">{label}</p>
      <h3 className="metric-value">{value}</h3>
    </div>
  );
}

function getReporterDisplay(reporterId: string): string {
  const user = adminSnapshot.users.find((u) => u.id === reporterId);
  return user ? user.email || user.name : reporterId;
}

export default function DashboardPage() {
  const scope = useAdminScope();
  const [trendRange, setTrendRange] = useState<'day' | 'week'>('week');

  const metrics = getDashboardMetrics(scope);
  const byPeriod = useMemo(
    () => getEarningsByPeriod(trendRange, scope),
    [scope, trendRange]
  );
  const byRoute = useMemo(() => getEarningsByRoute(scope), [scope]);
  const bookings = useMemo(() => getBookings(scope), [scope]);
  const disputes = useMemo(() => getDisputes(scope), [scope]);

  const trendData: TrendDataPoint[] = useMemo(
    () => byPeriod.slice(-12),
    [byPeriod]
  );

  const donutData: BreakdownItem[] = useMemo(
    () =>
      byRoute.slice(0, 5).map((r) => ({ name: r.route.length > 20 ? r.route.slice(0, 18) + '…' : r.route, value: r.gross })),
    [byRoute]
  );

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .filter((b) => b.status !== 'cancelled')
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 7),
    [bookings]
  );

  const [disputeTab, setDisputeTab] = useState<Dispute['status'] | 'all'>('all');
  const filteredDisputes = useMemo(() => {
    if (disputeTab === 'all') return disputes;
    return disputes.filter((d) => d.status === disputeTab);
  }, [disputes, disputeTab]);

  const tagClass = (i: number) => ['tag-a', 'tag-b', 'tag-c', 'tag-d'][i % 4];

  return (
    <section>
      <div className="dashboard-kpi-row">
        <MetricCard
          label="Total Users"
          value={String(metrics.totalUsers)}
          variant="kpi-customers"
        />
        <MetricCard
          label="Total Trips"
          value={String(metrics.totalTrips)}
          variant="kpi-active"
        />
        <MetricCard
          label="Gross Earnings"
          value={formatRwf(metrics.grossEarnings)}
          variant="kpi-revenue"
        />
        <MetricCard
          label="App Commission"
          value={formatRwf(metrics.appCommission)}
          variant="kpi-alert"
        />
      </div>

      <div className="dashboard-charts-row">
        <div className="dashboard-widget">
          <div className="header-row">
            <h3 className="dashboard-widget-title">Trend</h3>
            <select
              className="select-filter"
              style={{ minWidth: '100px' }}
              value={trendRange}
              onChange={(e) => setTrendRange(e.target.value as 'day' | 'week')}
            >
              <option value="week">By week</option>
              <option value="day">By day</option>
            </select>
          </div>
          <BarChartTrend data={trendData} height={260} />
        </div>
        <div className="dashboard-widget">
          <div className="header-row">
            <h3 className="dashboard-widget-title">Earnings by route</h3>
          </div>
          {donutData.length > 0 ? (
            <DonutChartBreakdown
              data={donutData}
              centerLabel="RWF"
              height={260}
            />
          ) : (
            <div className="chart-container" style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lp-muted)' }}>
              No earnings data
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-charts-row">
        <div className="dashboard-widget">
          <h3 className="dashboard-widget-title">Transactions</h3>
          {recentBookings.length === 0 ? (
            <p className="subtle" style={{ margin: 0 }}>No recent bookings.</p>
          ) : (
            <>
              {recentBookings.map((b, i) => (
                <div key={b.id} className="dashboard-list-item">
                  <div>
                    <span className="dashboard-list-item-name">
                      {b.passenger.name}
                    </span>
                    <span className={`tag ${tagClass(i)}`} style={{ marginLeft: 8 }}>
                      {b.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="dashboard-list-item-meta">
                      {b.trip.departureHotpoint.name} → {b.trip.destinationHotpoint.name}
                    </span>
                    <br />
                    <strong>+{formatRwf(b.seats * b.trip.pricePerSeat)}</strong>
                  </div>
                </div>
              ))}
              <Link to="/income" className="dashboard-view-all">
                View all transactions
              </Link>
            </>
          )}
        </div>
        <div className="dashboard-widget">
          <h3 className="dashboard-widget-title">Support (Disputes)</h3>
          <div className="dashboard-widget-tabs">
            {(['all', 'open', 'in_review', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`chip ${disputeTab === tab ? 'chip-active' : ''}`}
                onClick={() => setDisputeTab(tab)}
              >
                {tab === 'all' ? 'All' : tab === 'in_review' ? 'In review' : tab}
              </button>
            ))}
          </div>
          {filteredDisputes.length === 0 ? (
            <p className="subtle" style={{ margin: 0 }}>No disputes.</p>
          ) : (
            <>
              {filteredDisputes.slice(0, 5).map((d) => (
                <div key={d.id} className="dashboard-list-item">
                  <div>
                    <span className="dashboard-list-item-meta">
                      {getReporterDisplay(d.reporterId)}
                    </span>
                    <br />
                    <span className="dashboard-list-item-name">
                      {d.type}: {d.description.slice(0, 40)}
                      {d.description.length > 40 ? '…' : ''}
                    </span>
                  </div>
                  <span className={`status-chip status-${d.status === 'in_review' ? 'in_review' : d.status}`}>
                    {d.status.toUpperCase()}
                  </span>
                </div>
              ))}
              <Link to="/disputes" className="dashboard-view-all">
                View all disputes
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-quick-links">
        <h3>Quick links</h3>
        <div className="dashboard-links">
          <Link to="/users" className="dashboard-link">Users</Link>
          <Link to="/hotpoints" className="dashboard-link">Hot points</Link>
          <Link to="/routes" className="dashboard-link">Routes</Link>
          <Link to="/activities" className="dashboard-link">Activities</Link>
          <Link to="/tickets" className="dashboard-link">Tickets</Link>
          <Link to="/vehicles" className="dashboard-link">Vehicles</Link>
          <Link to="/disputes" className="dashboard-link">Disputes</Link>
          <Link to="/income" className="dashboard-link">Income</Link>
        </div>
      </div>
    </section>
  );
}
