import express from 'express';
import prisma from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { UserType, TripType, TripStatus } from '@prisma/client';

const router = express.Router();

// PUT /api/driver/drive-mode
router.put('/drive-mode', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { fromId, toId, seatsAvailable, pricePerSeat, vehicleId } = req.body;
    const driverId = req.user?.userId;
    
    if (req.user?.userType !== UserType.DRIVER) {
      res.status(403).json({ error: 'Only drivers can enable drive mode' });
      return;
    }

    if (!fromId || !toId || seatsAvailable == null || pricePerSeat == null) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check for active scheduled trips collision
    const activeScheduled = await prisma.trip.findFirst({
      where: {
        driverId,
        type: TripType.SCHEDULED,
        status: { in: [TripStatus.ACTIVE, TripStatus.FULL] },
        // TODO: Time check logic (within 2 hours)
      }
    });
    
    if (activeScheduled) {
       // Simplified check for now
       // res.status(400).json({ error: 'Active scheduled trip conflict' });
    }

    const driveMode = await prisma.driverDriveMode.upsert({
      where: { driverId },
      create: {
        driverId: driverId!,
        fromHotpointId: fromId,
        toHotpointId: toId,
        seatsAvailable: Number(seatsAvailable),
        pricePerSeat: Number(pricePerSeat),
        vehicleId,
      },
      update: {
        fromHotpointId: fromId,
        toHotpointId: toId,
        seatsAvailable: Number(seatsAvailable),
        pricePerSeat: Number(pricePerSeat),
        vehicleId,
      }
    });
    
    res.json(driveMode);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update drive mode' });
  }
});

// DELETE /api/driver/drive-mode
router.delete('/drive-mode', requireAuth, async (req: AuthRequest, res) => {
  try {
    await prisma.driverDriveMode.delete({ where: { driverId: req.user?.userId } });
    res.status(204).end();
  } catch (error) {
    // Ignore not found
    res.status(204).end();
  }
});

// GET /api/driver/drive-mode/status
router.get('/drive-mode/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const mode = await prisma.driverDriveMode.findUnique({ where: { driverId: req.user?.userId } });
    if (!mode) {
      res.json({ inDriveMode: false });
    } else {
      res.json({ inDriveMode: true, ...mode });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// GET /api/driver/instant-queue (Public/Auth)
router.get('/instant-queue', async (req, res) => {
  try {
    const { fromId, toId } = req.query;
    const where: any = {};
    if (fromId) where.fromHotpointId = String(fromId);
    if (toId) where.toHotpointId = String(toId);
    
    const list = await prisma.driverDriveMode.findMany({ where });
    // Resolve relations manually or include
    // Prisma include not supported on upsert/delete easily, but findMany yes
    // Need to include driver info
    // Re-query with include if needed or adjust schema relations
    // For now returning raw list
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// GET /api/driver/activities (trip-level stats for driver)
router.get('/activities', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.query.userId as string || req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const driverId = user?.agencySubRole === 'agency_scanner' && user?.agencyId ? user.agencyId : userId;
    const trips = await prisma.trip.findMany({
      where: { driverId },
      include: { departureHotpoint: true, destinationHotpoint: true, driver: true, vehicle: true }
    });
    const activities = await Promise.all(trips.map(async (trip) => {
      const tripBookings = await prisma.booking.findMany({
        where: { tripId: trip.id, status: { not: 'CANCELLED' } }
      });
      const bookedSeats = tripBookings.reduce((s, b) => s + b.seats, 0);
      const collectedAmount = tripBookings.reduce((s, b) => s + b.seats * trip.pricePerSeat, 0);
      return {
        trip,
        bookingsCount: tripBookings.length,
        bookedSeats,
        remainingSeats: Math.max(0, trip.seatsAvailable),
        collectedAmount,
      };
    }));
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// GET /api/driver/activity-summary
router.get('/activity-summary', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.query.userId as string || req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const driverId = user?.agencySubRole === 'agency_scanner' && user?.agencyId ? user.agencyId : userId;
    const trips = await prisma.trip.findMany({ where: { driverId } });
    const tripIds = trips.map((t) => t.id);
    const bookings = await prisma.booking.findMany({
      where: { tripId: { in: tripIds }, status: { not: 'CANCELLED' } }
    });
    let doneCount = 0, activeCount = 0, bookingsCount = bookings.length, remainingSeats = 0, income = 0;
    trips.forEach((trip) => {
      if (trip.status === 'COMPLETED') doneCount++;
      else if (trip.status === 'ACTIVE' || trip.status === 'FULL') activeCount++;
      remainingSeats += Math.max(0, trip.seatsAvailable);
      const tripBookings = bookings.filter((b) => b.tripId === trip.id);
      income += tripBookings.reduce((s, b) => s + b.seats * trip.pricePerSeat, 0);
    });
    res.json({ doneCount, activeCount, bookingsCount, remainingSeats, income });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /api/driver/activity-log (event feed)
router.get('/activity-log', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const driverId = user?.agencySubRole === 'agency_scanner' && user?.agencyId ? user.agencyId : userId;
    const trips = await prisma.trip.findMany({
      where: { driverId },
      include: { departureHotpoint: true, destinationHotpoint: true }
    });
    const tripIds = new Set(trips.map((t) => t.id));
    const driverBookings = await prisma.booking.findMany({
      where: { tripId: { in: Array.from(tripIds) } },
      include: { trip: true, passenger: true }
    });
    const route = (t: { departureHotpoint: { name: string }; destinationHotpoint: { name: string } }) =>
      `${t?.departureHotpoint?.name || ''} → ${t?.destinationHotpoint?.name || ''}`;
    const entries: { id: string; kind: string; timestamp: string; tripId?: string; bookingId?: string; trip?: unknown; title: string; subtitle: string; metadata?: Record<string, unknown> }[] = [];
    for (const trip of trips) {
      const tripRoute = route(trip);
      const depDate = trip.departureDate || new Date().toISOString().slice(0, 10);
      const depTime = trip.departureTime || '00:00';
      const tripTs = new Date(`${depDate}T${depTime}:00`).toISOString();
      entries.push({ id: `log-trip-${trip.id}`, kind: 'trip_created', timestamp: tripTs, tripId: trip.id, trip, title: 'Trip created', subtitle: tripRoute, metadata: { route: tripRoute } });
      if (trip.status === 'COMPLETED') entries.push({ id: `log-completed-${trip.id}`, kind: 'trip_completed', timestamp: tripTs, tripId: trip.id, trip, title: 'Trip completed', subtitle: tripRoute, metadata: { route: tripRoute } });
    }
    for (const b of driverBookings) {
      const trip = b.trip;
      const tripRoute = trip ? route(trip) : '—';
      const passengerName = b.guestName || b.passenger?.name || 'Passenger';
      entries.push({ id: `log-booking-${b.id}`, kind: 'booking_created', timestamp: b.createdAt.toISOString(), tripId: trip?.id, bookingId: b.id, trip, title: `${b.seats} seat(s) booked`, subtitle: tripRoute, metadata: { passengerName, seats: b.seats, route: tripRoute } });
      if (b.validatedAt) entries.push({ id: `log-scanned-${b.id}`, kind: 'ticket_scanned', timestamp: b.validatedAt.toISOString(), tripId: trip?.id, bookingId: b.id, trip, title: 'Ticket scanned', subtitle: tripRoute, metadata: { passengerName, seats: b.seats, route: tripRoute } });
    }
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

// POST /api/driver/withdraw – request payout to driver's phone (PawaPay)
router.post('/withdraw', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.userType !== UserType.DRIVER) {
      res.status(403).json({ error: 'Only drivers can withdraw' });
      return;
    }
    const driverId = req.user.userId;
    const { amount, phone } = req.body;
    if (amount == null || Number(amount) <= 0) {
      res.status(400).json({ error: 'Valid amount required' });
      return;
    }
    const amt = Number(amount);
    const recipientPhone = phone ?? (await prisma.user.findUnique({ where: { id: driverId }, select: { phone: true } }))?.phone;
    if (!recipientPhone?.trim()) {
      res.status(400).json({ error: 'Phone number required for payout' });
      return;
    }
    // TODO: when PAWAPAY_API_KEY set, call PawaPay payout API and set externalId from response transaction_id
    const withdrawal = await prisma.driverWithdrawal.create({
      data: {
        driverId,
        amount: amt,
        provider: 'pawapay',
        externalId: null,
        status: 'pending',
      },
    });
    res.status(201).json({ id: withdrawal.id, status: withdrawal.status, amount: withdrawal.amount });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

export default router;
