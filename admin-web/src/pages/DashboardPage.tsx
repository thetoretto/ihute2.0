import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  ChevronRight,
  Zap,
} from 'lucide-react';
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
      byRoute
        .slice(0, 5)
        .map((r) => ({
          name: r.route.length > 20 ? r.route.slice(0, 18) + '…' : r.route,
          value: r.gross,
        })),
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

  const barHeights = useMemo(() => {
    if (trendData.length === 0) return [40, 70, 45, 90, 65, 80, 50];
    const max = Math.max(...trendData.map((d) => d.gross), 1);
    return trendData.slice(-7).map((d) => Math.max(20, (d.gross / max) * 100));
  }, [trendData]);

  return (
    <div className="space-y-10">
      {/* Hero cards - 3 column grid (template style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Primary dark card - Total Revenue */}
        <div className="bg-dark rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary opacity-10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted text-xs font-bold uppercase tracking-widest">
                  Gross Earnings
                </p>
                <CreditCard className="text-primary" />
              </div>
              <h2 className="text-4xl font-black text-primary mb-2">
                {formatRwf(metrics.grossEarnings)}
              </h2>
              <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                <TrendingUp size={16} /> Total revenue (RWF)
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <Link
                to="/income"
                className="flex-1 bg-primary text-dark py-3 rounded-xl font-black text-sm uppercase text-center"
              >
                Income
              </Link>
              <Link
                to="/tickets"
                className="flex-1 border border-white/20 py-3 rounded-xl font-black text-sm uppercase text-center"
              >
                Tickets
              </Link>
            </div>
          </div>
        </div>

        {/* User activity / trend bar card */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted text-xs font-bold uppercase tracking-widest">
              Earnings trend
            </p>
            <select
              value={trendRange}
              onChange={(e) => setTrendRange(e.target.value as 'day' | 'week')}
              className="text-sm font-bold border border-soft rounded-lg px-3 py-1.5 bg-surface"
            >
              <option value="week">By week</option>
              <option value="day">By day</option>
            </select>
          </div>
          <div className="flex items-end gap-2 h-32 mb-6">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-soft rounded-t-lg transition-all hover:bg-primary"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-2xl font-black text-dark">
                {metrics.totalBookings}
              </h4>
              <p className="text-xs text-muted">Completed bookings</p>
            </div>
            <div className="bg-surface p-3 rounded-2xl">
              <Users className="text-dark" size={24} />
            </div>
          </div>
        </div>

        {/* Quick action / stats card */}
        <div className="bg-soft rounded-[32px] p-8 border border-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-black text-dark mb-2">Quick stats</h3>
            <p className="text-dark/60 text-sm mb-6 leading-relaxed">
              {metrics.totalUsers} users · {metrics.totalTrips} trips · Commission{' '}
              {formatRwf(metrics.appCommission)}
            </p>
            <Link
              to="/activities"
              className="inline-flex items-center gap-2 bg-dark text-primary px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              View activities <ChevronRight size={18} />
            </Link>
          </div>
          <div className="absolute -bottom-6 -right-6 opacity-10">
            <Zap size={140} fill="#171C22" />
          </div>
        </div>
      </div>

      {/* Second row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
          <h3 className="text-lg font-black text-dark mb-4">Trend</h3>
          <BarChartTrend data={trendData} height={260} />
        </div>
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
          <h3 className="text-lg font-black text-dark mb-4">Earnings by route</h3>
          {donutData.length > 0 ? (
            <DonutChartBreakdown data={donutData} centerLabel="RWF" height={260} />
          ) : (
            <div className="min-h-[260px] flex items-center justify-center text-muted">
              No earnings data
            </div>
          )}
        </div>
      </div>

      {/* Transaction history table (template style) */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-dark">Transaction history</h3>
          <div className="flex gap-4">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-surface rounded-xl text-sm font-bold border border-soft"
            >
              <Filter size={16} /> Filter
            </button>
            <Link
              to="/income"
              className="text-sm font-bold text-muted hover:text-dark"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface">
                <th className="pb-4 text-[10px] uppercase font-black text-muted tracking-widest">
                  Client / Route
                </th>
                <th className="pb-4 text-[10px] uppercase font-black text-muted tracking-widest">
                  Date
                </th>
                <th className="pb-4 text-[10px] uppercase font-black text-muted tracking-widest">
                  Status
                </th>
                <th className="pb-4 text-[10px] uppercase font-black text-muted tracking-widest text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted">
                    No recent bookings.
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => {
                  const amount = b.seats * b.trip.pricePerSeat;
                  const positive = true;
                  return (
                    <tr
                      key={b.id}
                      className="group hover:bg-surface/50 transition-colors"
                    >
                      <td className="py-5">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              positive ? 'bg-green-50 text-green-600' : 'bg-soft text-dark'
                            }`}
                          >
                            <ArrowDownLeft size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{b.passenger.name}</p>
                            <p className="text-[11px] text-muted">
                              {b.trip.departureHotpoint.name} →{' '}
                              {b.trip.destinationHotpoint.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 text-sm font-medium text-dark/70">
                        {b.createdAt
                          ? new Date(b.createdAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            b.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-primary text-dark'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-5 text-right font-black text-sm text-green-600">
                        +{formatRwf(amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disputes widget + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
          <h3 className="text-2xl font-black text-dark mb-4">Support (Disputes)</h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['all', 'open', 'in_review', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setDisputeTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  disputeTab === tab
                    ? 'bg-dark text-primary'
                    : 'bg-surface text-dark hover:bg-soft'
                }`}
              >
                {tab === 'all' ? 'All' : tab === 'in_review' ? 'In review' : tab}
              </button>
            ))}
          </div>
          {filteredDisputes.length === 0 ? (
            <p className="text-muted text-sm">No disputes.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {filteredDisputes.slice(0, 5).map((d) => (
                  <li
                    key={d.id}
                    className="flex justify-between items-start py-2 border-b border-surface last:border-0"
                  >
                    <div>
                      <p className="text-[11px] text-muted">
                        {getReporterDisplay(d.reporterId)}
                      </p>
                      <p className="font-bold text-sm">
                        {d.type}: {d.description.slice(0, 40)}
                        {d.description.length > 40 ? '…' : ''}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        d.status === 'resolved'
                          ? 'bg-gray-100 text-gray-700'
                          : d.status === 'in_review'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-primary text-dark'
                      }`}
                    >
                      {d.status}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/disputes"
                className="inline-block mt-4 text-sm font-bold text-dark hover:underline"
              >
                View all disputes →
              </Link>
            </>
          )}
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
          <h3 className="text-2xl font-black text-dark mb-4">Quick links</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/users"
              className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary hover:text-dark"
            >
              Users
            </Link>
            <Link
              to="/hotpoints"
              className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary hover:text-dark"
            >
              Hot points
            </Link>
            <Link
              to="/routes"
              className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary hover:text-dark"
            >
              Routes
            </Link>
            <Link
              to="/activities"
              className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary hover:text-dark"
            >
              Activities
            </Link>
            <Link
              to="/tickets"
              className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary hover:text-dark"
            >
              Tickets
            </Link>
            <Link
              to="/vehicles"
              className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary hover:text-dark"
            >
              Vehicles
            </Link>
            <Link
              to="/disputes"
              className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary hover:text-dark"
            >
              Disputes
            </Link>
            <Link
              to="/income"
              className="px-4 py-2 bg-surface rounded-xl text-sm font-bold text-dark hover:bg-primary hover:text-dark"
            >
              Income
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
