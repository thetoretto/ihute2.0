import express from 'express';
import prisma from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { UserType, TripStatus, TripType } from '@prisma/client';

const router = express.Router();

// GET /api/trips (Search - Public)
router.get('/', async (req, res) => {
  try {
    const { fromId, toId, date, type } = req.query;
    
    const where: any = {
      status: TripStatus.ACTIVE,
    };
    
    if (fromId) where.departureHotpointId = String(fromId);
    if (toId) where.destinationHotpointId = String(toId);
    if (date) where.departureDate = String(date);
    if (type) where.type = type === 'insta' ? TripType.INSTANT : TripType.SCHEDULED;

    const trips = await prisma.trip.findMany({
      where,
      include: {
        driver: { select: { id: true, name: true, rating: true, statusBadge: true } },
        vehicle: true,
        departureHotpoint: true,
        destinationHotpoint: true,
      },
      orderBy: { departureTime: 'asc' }
    });
    
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// GET /api/trips/driver/:userId (Auth required) - must be before /:id
router.get('/driver/:userId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    // Check permission: user must be the driver, or agency admin of the driver, or super admin
    if (req.user?.userType !== UserType.SUPER_ADMIN) {
      if (req.user?.userId !== userId) {
        // Check agency
        const driver = await prisma.user.findUnique({ where: { id: userId } });
        if (!driver || driver.agencyId !== req.user?.agencyId) {
           res.status(403).json({ error: 'Access denied' });
           return;
        }
      }
    }

    const trips = await prisma.trip.findMany({
      where: { driverId: userId },
      include: {
        driver: { select: { id: true, name: true } },
        vehicle: true,
        departureHotpoint: true,
        destinationHotpoint: true,
      },
      orderBy: { departureDate: 'desc' }
    });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch driver trips' });
  }
});

// GET /api/trips/:id (Public)
router.get('/:id', async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        driver: { select: { id: true, name: true, rating: true, statusBadge: true } },
        vehicle: true,
        departureHotpoint: true,
        destinationHotpoint: true,
      }
    });
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// POST /api/trips (Auth required)
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body;
    const driverId = body.driverId || req.user?.userId;
    
    // Permission check
    if (driverId !== req.user?.userId) {
      if (req.user?.userType !== UserType.SUPER_ADMIN) {
         const driver = await prisma.user.findUnique({ where: { id: driverId } });
         if (!driver || driver.agencyId !== req.user?.agencyId) {
            res.status(403).json({ error: 'Cannot create trip for this driver' });
            return;
         }
      }
    }

    const trip = await prisma.trip.create({
      data: {
        type: body.type === 'insta' ? TripType.INSTANT : TripType.SCHEDULED,
        departureHotpointId: body.departureHotpointId,
        destinationHotpointId: body.destinationHotpointId,
        departureDate: body.departureDate,
        departureTime: body.departureTime || '09:00',
        arrivalTime: body.arrivalTime,
        durationMinutes: body.durationMinutes,
        seatsAvailable: body.seatsAvailable ?? 4,
        pricePerSeat: body.pricePerSeat ?? 0,
        allowFullCar: !!body.allowFullCar,
        paymentMethods: body.paymentMethods || ['cash', 'mobile_money', 'card'],
        driverId,
        vehicleId: body.vehicleId,
        status: TripStatus.ACTIVE,
      },
      include: {
        driver: true,
        vehicle: true,
        departureHotpoint: true,
        destinationHotpoint: true,
      }
    });
    res.status(201).json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// PUT /api/trips/:id/status (Auth required)
router.put('/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    // Permission check (Driver, Agency, Admin)
    const canEdit = 
      req.user?.userType === UserType.SUPER_ADMIN ||
      req.user?.userId === trip.driverId ||
      (req.user?.userType === UserType.AGENCY_ADMIN && req.user.agencyId); // Need to verify agency match if agency admin
    
    if (!canEdit) {
       // Deep check for agency
       const driver = await prisma.user.findUnique({ where: { id: trip.driverId } });
       if (!driver || driver.agencyId !== req.user?.agencyId) {
          res.status(403).json({ error: 'Access denied' });
          return;
       }
    }

    // Cancellation logic (check bookings)
    if (status === TripStatus.CANCELLED) {
      const bookings = await prisma.booking.count({
        where: { tripId: trip.id, status: { not: 'CANCELLED' } }
      });
      if (bookings > 0) {
        res.status(400).json({ error: 'Cannot cancel trip with active bookings' });
        return;
      }
    }

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { status },
      include: {
        driver: true,
        vehicle: true,
        departureHotpoint: true,
        destinationHotpoint: true,
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/trips/bulk (Admin)
router.post('/bulk', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { baseTripData, departureDate, startTime, intervalMinutes, endTime } = req.body;
    if (!baseTripData?.driverId || !baseTripData?.vehicleId || !baseTripData?.departureHotpointId || !baseTripData?.destinationHotpointId) {
      res.status(400).json({ error: 'Missing baseTripData fields' });
      return;
    }
    const durationMins = baseTripData.durationMinutes ?? 180;
    const slots: string[] = [];
    const [sh, sm] = (startTime || '06:00').split(':').map(Number);
    let totalMins = sh * 60 + sm;
    const interval = intervalMinutes || 60;
    const endMins = endTime ? (() => { const [eh, em] = endTime.split(':').map(Number); return eh * 60 + em; })() : totalMins + interval * 48;
    while (slots.length < 48 && totalMins <= endMins) {
      const h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      totalMins += interval;
    }
    const created = [];
    for (let i = 0; i < slots.length; i++) {
      const depTime = slots[i];
      const [dh, dm] = depTime.split(':').map(Number);
      const arrMins = (dh * 60 + dm + durationMins) % (24 * 60);
      const arrTime = `${String(Math.floor(arrMins / 60)).padStart(2, '0')}:${String(arrMins % 60).padStart(2, '0')}`;
      const trip = await prisma.trip.create({
        data: {
          type: TripType.SCHEDULED,
          departureHotpointId: baseTripData.departureHotpointId,
          destinationHotpointId: baseTripData.destinationHotpointId,
          departureDate,
          departureTime: depTime,
          arrivalTime: arrTime,
          durationMinutes: durationMins,
          seatsAvailable: baseTripData.seatsAvailable ?? 4,
          pricePerSeat: baseTripData.pricePerSeat ?? 0,
          allowFullCar: !!baseTripData.allowFullCar,
          paymentMethods: (baseTripData.paymentMethods as string[]) || ['cash', 'mobile_money', 'card'],
          driverId: baseTripData.driverId,
          vehicleId: baseTripData.vehicleId,
          status: TripStatus.ACTIVE,
        },
        include: {
          driver: true,
          vehicle: true,
          departureHotpoint: true,
          destinationHotpoint: true,
        }
      });
      created.push(trip);
    }
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Bulk create failed' });
  }
});

export default router;
