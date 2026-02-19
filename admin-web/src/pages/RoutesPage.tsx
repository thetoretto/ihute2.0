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

  return (
    <section>
      <h2>Routes</h2>
      <p className="subtle">Distinct origin–destination pairs derived from trips.</p>
      <table>
        <thead>
          <tr>
            <th>Route</th>
            <th>Trip count</th>
            <th>Bookings</th>
            <th>Last activity</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((r) => (
            <tr key={`${r.originId}-${r.destId}`}>
              <td>{r.originName} → {r.destName}</td>
              <td>{r.tripCount}</td>
              <td>{r.bookingCount}</td>
              <td>{r.lastActivity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
