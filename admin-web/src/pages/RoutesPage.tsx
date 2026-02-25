import React, { useMemo } from 'react';
import { adminSnapshot } from '../data/snapshot';

interface RouteRow {
  originId: string;
  originName: string;
  destId: string;
  destName: string;
  tripCount: number;
  bookingCount: number;
  lastActivity: string;
}

export default function RoutesPage() {
  const routes = useMemo(() => {
    const map = new Map<string, { originName: string; destName: string; tripCount: number; bookingCount: number; lastActivity: string }>();
    for (const trip of adminSnapshot.trips) {
      const key = `${trip.departureHotpoint.id}:${trip.destinationHotpoint.id}`;
      const bookingCount = adminSnapshot.bookings.filter((b) => b.trip.id === trip.id).length;
      const lastDate = adminSnapshot.bookings
        .filter((b) => b.trip.id === trip.id)
        .map((b) => b.createdAt)
        .sort()
        .pop() ?? trip.departureTime;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          originName: trip.departureHotpoint.name,
          destName: trip.destinationHotpoint.name,
          tripCount: 1,
          bookingCount,
          lastActivity: lastDate,
        });
      } else {
        existing.tripCount += 1;
        existing.bookingCount += bookingCount;
        if (lastDate > existing.lastActivity) existing.lastActivity = lastDate;
      }
    }
    const rows: RouteRow[] = [];
    map.forEach((data, key) => {
      const [originId, destId] = key.split(':');
      rows.push({
        originId,
        originName: data.originName,
        destId,
        destName: data.destName,
        tripCount: data.tripCount,
        bookingCount: data.bookingCount,
        lastActivity: data.lastActivity,
      });
    });
    rows.sort((a, b) => b.tripCount - a.tripCount);
    return rows;
  }, []);

  const th = 'pb-4 text-[10px] uppercase font-black text-muted tracking-widest text-left';
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
      <h3 className="text-2xl font-black text-dark mb-2">Routes</h3>
      <p className="text-muted text-sm mb-6">Distinct origin–destination pairs derived from trips.</p>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface">
              <th className={th}>Route</th>
              <th className={th}>Trip count</th>
              <th className={th}>Bookings</th>
              <th className={th}>Last activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface">
            {routes.map((r) => (
              <tr key={`${r.originId}-${r.destId}`} className="group hover:bg-surface/50 transition-colors">
                <td className="py-5 font-bold text-sm">{r.originName} → {r.destName}</td>
                <td className="py-5 text-sm">{r.tripCount}</td>
                <td className="py-5 text-sm">{r.bookingCount}</td>
                <td className="py-5 text-sm">{r.lastActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
