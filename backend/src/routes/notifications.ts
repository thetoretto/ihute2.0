import express from 'express';
import prisma from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/notifications/driver/:driverId
router.get('/driver/:driverId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { driverId } = req.params;
    if (req.user?.userId !== driverId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    const list = await prisma.notification.findMany({
      where: { userId: driverId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications/driver/:driverId/read
router.post('/driver/:driverId/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { driverId } = req.params;
    if (req.user?.userId !== driverId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    await prisma.notification.updateMany({
      where: { userId: driverId, read: false },
      data: { read: true }
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

export default router;
