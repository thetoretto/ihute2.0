import express from 'express';
import prisma from '../prisma';
import { requireAuth, requireSuperAdmin } from '../middleware/auth';

const router = express.Router();

// GET /api/hotpoints (Public)
router.get('/', async (req, res) => {
  try {
    const list = await prisma.hotpoint.findMany({ orderBy: { name: 'asc' } });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hotpoints' });
  }
});

// POST /api/hotpoints (Admin)
router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { name, address, latitude, longitude, country } = req.body;
    if (!name || latitude == null || longitude == null) {
      res.status(400).json({ error: 'name, latitude, and longitude are required' });
      return;
    }
    const hotpoint = await prisma.hotpoint.create({
      data: {
        name,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        country,
      }
    });
    res.status(201).json(hotpoint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create hotpoint' });
  }
});

// PUT /api/hotpoints/:id (Admin)
router.put('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, country } = req.body;
    const hotpoint = await prisma.hotpoint.update({
      where: { id },
      data: {
        name,
        address,
        latitude: latitude != null ? Number(latitude) : undefined,
        longitude: longitude != null ? Number(longitude) : undefined,
        country,
      }
    });
    res.json(hotpoint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hotpoint' });
  }
});

// DELETE /api/hotpoints/:id (Admin)
router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Check usage
    const inUse = await prisma.trip.findFirst({
      where: {
        OR: [{ departureHotpointId: id }, { destinationHotpointId: id }]
      }
    });
    if (inUse) {
      res.status(400).json({ error: 'Cannot delete: hot point is in use by one or more trips.' });
      return;
    }
    await prisma.hotpoint.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete hotpoint' });
  }
});

export default router;
