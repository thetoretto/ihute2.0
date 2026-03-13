import express from 'express';
import prisma from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/ratings/driver/:driverId/summary
router.get('/driver/:driverId/summary', async (req, res) => {
  try {
    const { driverId } = req.params;
    const aggregations = await prisma.driverRating.aggregate({
      where: { driverId },
      _avg: { score: true },
      _count: { score: true }
    });
    res.json({
      average: Number(aggregations._avg.score?.toFixed(1)) || 0,
      count: aggregations._count.score || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// POST /api/ratings
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { bookingId, passengerId, score, comment } = req.body;
    
    // Permission check
    if (req.user?.userId !== passengerId) {
       res.status(403).json({ error: 'Access denied' });
       return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const rating = await prisma.driverRating.create({
      data: {
        bookingId,
        passengerId,
        driverId: booking.trip.driverId,
        score: Number(score),
        comment,
      }
    });
    
    // Update driver average (optional, or computed on fly)
    // ...

    res.status(201).json(rating);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

export default router;
