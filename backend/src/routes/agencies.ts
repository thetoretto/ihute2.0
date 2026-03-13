import express, { Response } from 'express';
import prisma from '../prisma';
import { requireAuth, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import { UserType } from '@prisma/client';

const router = express.Router();

/** GET /api/agencies – list all (super admin) or own agency (agency admin) */
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.userType === UserType.SUPER_ADMIN) {
      const agencies = await prisma.agency.findMany({
        include: {
          users: { select: { id: true, name: true, email: true, userType: true } },
          _count: { select: { vehicles: true } },
        },
        orderBy: { name: 'asc' },
      });
      return res.json(agencies);
    }
    if (req.user?.userType === UserType.AGENCY_ADMIN && req.user.agencyId) {
      const agency = await prisma.agency.findUnique({
        where: { id: req.user.agencyId },
        include: {
          users: { select: { id: true, name: true, email: true, userType: true } },
          _count: { select: { vehicles: true } },
        },
      });
      if (!agency) return res.status(404).json({ error: 'Agency not found' });
      return res.json([agency]);
    }
    res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    console.error('Agencies list error:', error);
    res.status(500).json({ error: 'Failed to list agencies' });
  }
});

/** GET /api/agencies/:id – get one (super admin or own agency) */
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.userType !== UserType.SUPER_ADMIN && req.user?.agencyId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const agency = await prisma.agency.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, userType: true } },
        _count: { select: { vehicles: true } },
      },
    });
    if (!agency) return res.status(404).json({ error: 'Agency not found' });
    res.json(agency);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agency' });
  }
});

/** POST /api/agencies – create (super admin only) */
router.post('/', requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, contactInfo } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const agency = await prisma.agency.create({
      data: { name: name.trim(), contactInfo: contactInfo?.trim() || null },
    });
    res.status(201).json(agency);
  } catch (error) {
    console.error('Agency create error:', error);
    res.status(500).json({ error: 'Failed to create agency' });
  }
});

/** PUT /api/agencies/:id – update (super admin only) */
router.put('/:id', requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactInfo } = req.body;
    const agency = await prisma.agency.findUnique({ where: { id } });
    if (!agency) return res.status(404).json({ error: 'Agency not found' });
    const updated = await prisma.agency.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(contactInfo !== undefined && { contactInfo: contactInfo === '' ? null : String(contactInfo).trim() }),
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agency' });
  }
});

/** DELETE /api/agencies/:id – delete (super admin only); fails if agency has users */
router.delete('/:id', requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agency = await prisma.agency.findUnique({
      where: { id },
      include: { _count: { select: { users: true, vehicles: true } } },
    });
    if (!agency) return res.status(404).json({ error: 'Agency not found' });
    if (agency._count.users > 0) {
      return res.status(400).json({ error: 'Cannot delete agency with assigned users. Unassign users first.' });
    }
    await prisma.agency.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agency' });
  }
});

/** POST /api/agencies/:id/assign-admin – set user as agency admin (super admin only) */
router.post('/:id/assign-admin', requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id: agencyId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: 'Agency not found' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { agencyId, userType: UserType.AGENCY_ADMIN, agencySubRole: 'agency_manager' },
    });
    const { passwordHash, ...rest } = updated;
    res.json(rest);
  } catch (error) {
    console.error('Assign admin error:', error);
    res.status(500).json({ error: 'Failed to assign agency admin' });
  }
});

/** POST /api/agencies/:id/assign-scanner – set user as scanner for this agency (super admin or agency admin for own agency) */
router.post('/:id/assign-scanner', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id: agencyId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (req.user?.userType !== UserType.SUPER_ADMIN && req.user?.agencyId !== agencyId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: 'Agency not found' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { agencyId, userType: UserType.SCANNER, agencySubRole: 'agency_scanner' },
    });
    const { passwordHash, ...rest } = updated;
    res.json(rest);
  } catch (error) {
    console.error('Assign scanner error:', error);
    res.status(500).json({ error: 'Failed to assign scanner' });
  }
});

export default router;
