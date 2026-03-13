import express from 'express';
import prisma from '../prisma';
import { requireAuth, requireSuperAdmin, requireAgencyAdmin, AuthRequest } from '../middleware/auth';
import { UserType } from '@prisma/client';

const router = express.Router();

// GET /api/disputes (Auth required)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId, status, agencyId } = req.query;
    
    const where: any = {};
    if (userId) where.reporterId = String(userId);
    if (status) where.status = String(status);
    
    // Scope enforcement
    if (req.user?.userType === UserType.AGENCY_ADMIN) {
       // Disputes for trips by agency drivers
       where.booking = {
         trip: { driver: { agencyId: req.user.agencyId } }
       };
    } else if (req.user?.userType === UserType.DRIVER) {
       // Disputes against driver? Or created by driver?
       // Typically drivers don't see disputes against them in this list unless specified
       // Let's allow seeing disputes they reported
       if (!userId) where.reporterId = req.user.userId;
    } else if (req.user?.userType === UserType.USER) {
       where.reporterId = req.user.userId;
    } else if (req.user?.userType === UserType.SUPER_ADMIN) {
       if (agencyId) {
         where.booking = {
           trip: { driver: { agencyId: String(agencyId) } }
         };
       }
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        booking: {
          include: { trip: true, passenger: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

// GET /api/disputes/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const dispute = await prisma.dispute.findUnique({ where: { id: req.params.id } });
    if (!dispute) {
      res.status(404).json({ error: 'Dispute not found' });
      return;
    }
    // TODO: Add permission check (reporter or admin)
    res.json(dispute);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dispute' });
  }
});

// PATCH /api/disputes/:id (Admin/Agency)
router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.userType !== UserType.SUPER_ADMIN && req.user?.userType !== UserType.AGENCY_ADMIN) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    const { status, resolution } = req.body;
    const updated = await prisma.dispute.update({
      where: { id: req.params.id },
      data: { status, resolution }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update dispute' });
  }
});

export default router;
