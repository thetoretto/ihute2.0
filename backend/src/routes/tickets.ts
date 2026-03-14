import express from 'express';
import prisma from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { UserType, BookingStatus } from '@prisma/client';

const router = express.Router();

// POST /api/tickets/validate — only trip creator (driver) or super admin can confirm tickets
router.post('/validate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { payload, validatorUserId } = req.body;

    // Only the trip's driver or super admin can confirm tickets
    if (req.user?.userType !== UserType.DRIVER && req.user?.userType !== UserType.SUPER_ADMIN) {
      res.status(403).json({ error: 'Only the trip driver can confirm tickets' });
      return;
    }

    const parts = (payload || '').split('|');
    if (parts.length < 5 || parts[0] !== 'IHTQR') {
      res.json({ valid: false, reason: 'Malformed QR payload' });
      return;
    }

    const [, ticketId, bookingId, passengerId, driverId, issuedAt] = parts;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: { include: { driver: true } } },
    });

    if (!booking) {
      res.json({ valid: false, reason: 'Booking not found' });
      return;
    }

    if (booking.status === 'CANCELLED') {
      res.json({ valid: false, reason: 'Ticket cancelled' });
      return;
    }

    const tripDriverId = booking.trip.driverId;
    const validatorId = validatorUserId || req.user!.userId;

    let canValidate = false;
    if (req.user!.userType === UserType.DRIVER && req.user!.userId === tripDriverId) {
      canValidate = true;
    } else if (req.user!.userType === UserType.SUPER_ADMIN) {
      canValidate = true;
    }

    if (!canValidate) {
      res.json({ valid: false, reason: 'Only the trip driver can confirm this ticket' });
      return;
    }

    const updateData: { validatedAt: Date; validatedById: string; status?: BookingStatus; paymentStatus?: string } = {
      validatedAt: new Date(),
      validatedById: validatorId,
    };
    // Cash: driver scan = cash collected → confirm booking and mark paid
    if (
      booking.paymentMethod === 'cash' &&
      booking.status === BookingStatus.PENDING_PAYMENT
    ) {
      updateData.status = BookingStatus.CONFIRMED;
      updateData.paymentStatus = 'paid';
    }

    if (!booking.validatedAt) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
      });
    }

    res.json({
      valid: true,
      scannedAt: new Date().toISOString(),
      bookingId,
      ticket: {
        bookingId: booking.id,
        passengerName: booking.guestName,
        seats: booking.seats,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

export default router;
