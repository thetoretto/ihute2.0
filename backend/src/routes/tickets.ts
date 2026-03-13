import express from 'express';
import prisma from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { UserType } from '@prisma/client';

const router = express.Router();

// POST /api/tickets/validate (Driver/Scanner)
router.post('/validate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { payload, validatorUserId } = req.body;
    
    // Check permission
    if (req.user?.userType !== UserType.DRIVER && req.user?.userType !== UserType.SCANNER && req.user?.userType !== UserType.SUPER_ADMIN) {
       res.status(403).json({ error: 'Access denied' });
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
      include: { trip: { include: { driver: true } } }
    });

    if (!booking) {
      res.json({ valid: false, reason: 'Booking not found' });
      return;
    }
    
    if (booking.status === 'CANCELLED') {
      res.json({ valid: false, reason: 'Ticket cancelled' });
      return;
    }

    // Check if user can validate this trip
    const tripDriverId = booking.trip.driverId;
    const validatorId = validatorUserId || req.user.userId;
    
    let canValidate = false;
    if (req.user.userType === UserType.DRIVER && req.user.userId === tripDriverId) {
      canValidate = true;
    } else if (req.user.userType === UserType.SCANNER) {
      // Check agency match
      const validator = await prisma.user.findUnique({ where: { id: validatorId } });
      const tripDriver = booking.trip.driver;
      if (validator?.agencyId && validator.agencyId === tripDriver.agencyId) {
        canValidate = true;
      }
    } else if (req.user.userType === UserType.SUPER_ADMIN) {
      canValidate = true;
    }

    if (!canValidate) {
      res.json({ valid: false, reason: 'Ticket belongs to another driver/agency' });
      return;
    }

    // Mark as validated
    if (!booking.validatedAt) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          validatedAt: new Date(),
          validatedById: validatorId
        }
      });
      // Increment scanner count
      if (req.user.userType === UserType.SCANNER) {
         await prisma.user.update({
           where: { id: validatorId },
           data: { scanCount: { increment: 1 } }
         });
      }
    }

    res.json({ 
      valid: true, 
      scannedAt: new Date().toISOString(),
      bookingId,
      ticket: {
        bookingId: booking.id,
        passengerName: booking.guestName, // or passenger.name
        seats: booking.seats,
        // ... other details
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

export default router;
