import express from 'express';
import prisma from '../prisma';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { UserType, BookingStatus } from '@prisma/client';

const router = express.Router();

// GET /api/bookings (Auth required)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.query;
    
    // Permission check
    if (req.user?.userType !== UserType.SUPER_ADMIN) {
      if (req.user?.userType === UserType.AGENCY_ADMIN) {
        // Agency admin sees bookings for their agency's trips
        // Filter handled below
      } else if (req.user?.userId !== userId) {
        // Regular user can only see own bookings
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    const where: any = {};
    if (userId) where.passengerId = String(userId);
    
    if (req.user?.userType === UserType.AGENCY_ADMIN) {
       // Filter by agency trips
       where.trip = {
         driver: { agencyId: req.user.agencyId }
       };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        trip: {
          include: {
            driver: true,
            departureHotpoint: true,
            destinationHotpoint: true,
          }
        },
        passenger: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/bookings (Public - supports Guest and registered user via passengerId/passenger)
router.post('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body || {};
    let passengerId = body.passengerId;
    const passenger = body.passenger;
    if (!passengerId && passenger && (passenger.id || passenger.userId)) {
      passengerId = passenger.id ?? passenger.userId;
    }
    const { tripId, guest, seats, paymentMethod, isFullCar } = body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }
    if (trip.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Trip is not available' });
      return;
    }

    const requestedSeats = isFullCar ? trip.seatsAvailable : (seats || 1);
    if (requestedSeats > trip.seatsAvailable) {
      res.status(400).json({ error: 'Not enough seats available' });
      return;
    }

    // Validate passenger or guest
    if (!passengerId && !guest) {
      res.status(400).json({ error: 'Passenger or guest details required' });
      return;
    }

    // If registered user: ensure passenger exists; optional auth check when token present
    if (passengerId) {
      const user = await prisma.user.findUnique({ where: { id: passengerId } });
      if (!user) {
        res.status(400).json({ error: 'Passenger user not found' });
        return;
      }
      if (req.user && req.user.userId && req.user.userId !== passengerId) {
        res.status(403).json({ error: 'You can only book for yourself when logged in' });
        return;
      }
    }

    const bookingId = `b${Date.now()}`;
    const ticketId = `tk_${bookingId}`;
    
    const booking = await prisma.$transaction(async (tx) => {
      // Decrement seats
      await tx.trip.update({
        where: { id: tripId },
        data: {
          seatsAvailable: { decrement: requestedSeats },
          status: trip.seatsAvailable - requestedSeats === 0 ? 'FULL' : 'ACTIVE'
        }
      });

      // Create booking
      return await tx.booking.create({
        data: {
          tripId,
          passengerId: passengerId || null,
          guestName: guest?.name,
          guestPhone: guest?.phone,
          guestEmail: guest?.email,
          deliveryMethod: guest?.deliveryMethod,
          seats: requestedSeats,
          isFullCar: !!isFullCar,
          paymentMethod,
          paymentStatus: 'pending',
          status: BookingStatus.PENDING_PAYMENT,
          ticketId,
          ticketNumber: bookingId.toUpperCase(), // Simple generation
          ticketIssuedAt: new Date(),
        },
        include: {
          trip: { include: { driver: true, departureHotpoint: true, destinationHotpoint: true } },
          passenger: true
        }
      });
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Booking failed' });
  }
});

// POST /api/bookings/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const { passengerId } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: true }
    });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    if ((booking.passengerId || '') !== passengerId) {
      res.status(403).json({ error: 'Only the booking passenger can cancel' });
      return;
    }
    if (booking.status === BookingStatus.CANCELLED) {
      res.status(400).json({ error: 'Booking already cancelled' });
      return;
    }
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELLED }
      }),
      prisma.trip.update({
        where: { id: booking.tripId },
        data: {
          seatsAvailable: { increment: booking.seats },
          status: 'ACTIVE'
        }
      })
    ]);
    const updated = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { trip: true, passenger: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Cancel failed' });
  }
});

// GET /api/bookings/:id/rating (get rating for this booking)
router.get('/:id/rating', async (req, res) => {
  try {
    const rating = await prisma.driverRating.findFirst({
      where: { bookingId: req.params.id }
    });
    res.json(rating || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

// GET /api/bookings/:id/ticket (Public - for guest confirmation)
router.get('/:id/ticket', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        trip: {
          include: {
            driver: true,
            departureHotpoint: true,
            destinationHotpoint: true,
          }
        },
        passenger: true,
      }
    });
    if (!booking) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    
    // Generate QR payload
    const qrPayload = `IHTQR|${booking.ticketId}|${booking.id}|${booking.passengerId || 'guest'}|${booking.trip.driverId}|${booking.ticketIssuedAt?.toISOString()}`;
    
    res.json({
      ...booking,
      qrPayload,
      passengerName: booking.passenger?.name || booking.guestName,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// GET /api/bookings/:id/ticket/pdf (Public - printable ticket as HTML for "Print to PDF")
router.get('/:id/ticket/pdf', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        trip: {
          include: {
            driver: true,
            departureHotpoint: true,
            destinationHotpoint: true,
          },
        },
        passenger: true,
      },
    });
    if (!booking) {
      res.status(404).send('Ticket not found');
      return;
    }
    const passengerName = booking.passenger?.name || booking.guestName || 'Guest';
    const from = booking.trip?.departureHotpoint?.name ?? '—';
    const to = booking.trip?.destinationHotpoint?.name ?? '—';
    const date = booking.trip?.departureDate ?? '';
    const time = booking.trip?.departureTime ?? '';
    const qrPayload = `IHTQR|${booking.ticketId}|${booking.id}|${booking.passengerId || 'guest'}|${booking.trip.driverId}|${booking.ticketIssuedAt?.toISOString()}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Ticket ${booking.ticketNumber ?? booking.id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 400px; margin: 24px auto; padding: 16px; }
    h1 { font-size: 1.25rem; margin-bottom: 8px; }
    .row { margin: 8px 0; }
    .label { color: #666; font-size: 0.875rem; }
    .value { font-weight: 600; }
    .qr { margin-top: 16px; padding: 12px; background: #f5f5f5; font-size: 0.75rem; word-break: break-all; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Ihute – Trip ticket</h1>
  <div class="row"><span class="label">Ticket</span><br><span class="value">${booking.ticketNumber ?? booking.ticketId ?? booking.id}</span></div>
  <div class="row"><span class="label">Passenger</span><br><span class="value">${passengerName}</span></div>
  <div class="row"><span class="label">Route</span><br><span class="value">${from} → ${to}</span></div>
  <div class="row"><span class="label">Date & time</span><br><span class="value">${date} ${time}</span></div>
  <div class="row"><span class="label">Seats</span><br><span class="value">${booking.seats}</span></div>
  <div class="qr" title="QR payload">${qrPayload}</div>
  <p style="margin-top: 16px; font-size: 0.75rem; color: #666;">Print this page (Ctrl+P) and choose "Save as PDF" to download.</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="ticket-${booking.ticketNumber ?? booking.id}.html"`);
    res.send(html);
  } catch (error) {
    res.status(500).send('Failed to fetch ticket');
  }
});

export default router;
