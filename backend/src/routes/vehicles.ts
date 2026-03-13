import express from 'express';
import prisma from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { UserType } from '@prisma/client';

const router = express.Router();

// GET /api/vehicles (Auth required)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.query;
    
    // Permission check
    if (req.user?.userType !== UserType.SUPER_ADMIN) {
       // Drivers/Agencies can see their own vehicles
       // If userId param is provided, check if it matches user or agency
       if (userId && userId !== req.user?.userId) {
          // Allow agency admin to see driver's vehicles?
          // For now, restrict to own or agency scope
       }
    }

    const where: any = {};
    const uid = (userId as string) || req.user?.userId;

    if (req.user?.userType === UserType.SUPER_ADMIN) {
      if (uid) where.OR = [{ driverId: uid }, { ownerId: uid }];
    } else if (req.user?.userType === UserType.AGENCY_ADMIN) {
      where.OR = [{ agencyId: req.user.agencyId }, { driver: { agencyId: req.user.agencyId } }];
    } else if (req.user?.userType === UserType.DRIVER) {
      where.OR = [{ driverId: req.user.userId }, { ownerId: req.user.userId }];
    } else {
      if (uid) where.OR = [{ driverId: uid }, { ownerId: uid }];
      else return res.json([]);
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

export default router;
