import express from 'express';
import prisma from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { UserType } from '@prisma/client';

const router = express.Router();

// GET /api/scanner/count
router.get('/count', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = (req.query.userId as string) || req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: String(userId) } });
    res.json(user?.scanCount ?? 0);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

// POST /api/scanner/count/increment
router.post('/count/increment', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = (req.body?.userId || req.query.userId || req.user?.userId) as string;
    if (!userId) return res.json(0);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { scanCount: { increment: 1 } }
    });
    res.json(user.scanCount);
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment' });
  }
});

// GET /api/scanner/report
router.get('/report', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Return bookings validated by this user or agency
    const userId = req.user?.userId;
    const where: any = {};
    
    if (req.user?.userType === UserType.SCANNER) {
       where.validatedById = userId;
    } else if (req.user?.userType === UserType.AGENCY_ADMIN) {
       // All validations by agency scanners
       // Complex query: bookings where validatedBy.agencyId = user.agencyId
       // Prisma doesn't support deep relation filtering easily on self-relation without explicit relation
       // Simplified: bookings for trips of this agency
       where.trip = { driver: { agencyId: req.user.agencyId } };
       where.validatedAt = { not: null };
    } else {
       return res.json([]);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: { trip: true, passenger: true },
      orderBy: { validatedAt: 'desc' }
    });
    
    // Map to report format
    const report = bookings.map(b => ({
      id: `sr_${b.id}`,
      bookingId: b.id,
      route: 'Route info', // TODO: Fetch hotpoint names
      passengerName: b.guestName || b.passenger?.name,
      status: 'scanned',
      scannedAt: b.validatedAt,
    }));
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

export default router;
