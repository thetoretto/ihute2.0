import express from 'express';
import prisma from '../prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { UserType } from '@prisma/client';

const router = express.Router();

/** Map DB vehicle to API shape (make, licensePlate, seats, approvalStatus for frontend) */
function toApiVehicle(v: {
  id: string;
  brand: string;
  model: string;
  capacity: number;
  plateNumber: string;
  color: string | null;
  status: string;
  approvalStatus: string;
  ownerId: string | null;
  driverId: string | null;
  agencyId: string | null;
}) {
  return {
    id: v.id,
    brand: v.brand,
    make: v.brand,
    model: v.model,
    capacity: v.capacity,
    seats: v.capacity,
    plateNumber: v.plateNumber,
    licensePlate: v.plateNumber,
    color: v.color ?? '',
    status: v.status,
    approvalStatus: v.approvalStatus as 'pending' | 'approved' | 'rejected',
    ownerId: v.ownerId,
    driverId: v.driverId,
    agencyId: v.agencyId,
  };
}

// GET /api/vehicles (Auth required)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.query;

    const where: any = {};
    const uid = userId as string | undefined;

    if (req.user?.userType === UserType.SUPER_ADMIN) {
      if (uid) where.OR = [{ driverId: uid }, { ownerId: uid }];
      // else no filter: super admin sees all vehicles
    } else if (req.user?.userType === UserType.AGENCY_ADMIN) {
      where.OR = [{ agencyId: req.user.agencyId }, { driver: { agencyId: req.user.agencyId } }];
    } else if (req.user?.userType === UserType.DRIVER) {
      where.OR = [{ driverId: req.user.userId }, { ownerId: req.user.userId }];
    } else {
      const fallbackUid = req.user?.userId;
      if (fallbackUid) where.OR = [{ driverId: fallbackUid }, { ownerId: fallbackUid }];
      else return res.json([]);
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(vehicles.map(toApiVehicle));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// GET /api/vehicles/:id (Auth required)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    // Same permission as list: driver/owner/agency/super
    const uid = req.user?.userId;
    if (req.user?.userType === UserType.SUPER_ADMIN) {
      // ok
    } else if (req.user?.userType === UserType.AGENCY_ADMIN) {
      if (vehicle.agencyId !== req.user.agencyId) {
        const driver = await prisma.user.findUnique({ where: { id: vehicle.driverId ?? '' } });
        if (driver?.agencyId !== req.user.agencyId) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
      }
    } else if (req.user?.userType === UserType.DRIVER) {
      if (vehicle.driverId !== uid && vehicle.ownerId !== uid) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    } else {
      if (vehicle.driverId !== uid && vehicle.ownerId !== uid) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }
    res.json(toApiVehicle(vehicle));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// POST /api/vehicles (Auth required)
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body || {};
    // Accept both backend and frontend field names
    const brand = body.brand ?? body.make;
    const model = body.model;
    const capacity = body.capacity ?? body.seats;
    const plateNumber = body.plateNumber ?? body.licensePlate;
    const color = body.color ?? null;
    const ownerId = body.ownerId ?? null;
    const driverId = body.driverId ?? null;
    const agencyId = body.agencyId ?? null;

    if (!brand || !model || capacity == null || !plateNumber) {
      res.status(400).json({
        error: 'Missing required fields: brand/make, model, capacity/seats, plateNumber/licensePlate',
      });
      return;
    }

    const uid = req.user?.userId;
    let finalOwnerId = ownerId;
    let finalDriverId = driverId;
    let finalAgencyId = agencyId;

    if (req.user?.userType === UserType.SUPER_ADMIN) {
      // Allow any ownerId, driverId, agencyId
    } else if (req.user?.userType === UserType.AGENCY_ADMIN) {
      finalAgencyId = req.user.agencyId ?? agencyId;
      if (driverId) {
        const driver = await prisma.user.findUnique({ where: { id: driverId } });
        if (!driver || driver.agencyId !== req.user.agencyId) {
          res.status(403).json({ error: 'Driver must belong to your agency' });
          return;
        }
      }
    } else if (req.user?.userType === UserType.DRIVER) {
      finalDriverId = uid;
      finalOwnerId = uid;
      finalAgencyId = null;
    } else {
      res.status(403).json({ error: 'Only drivers, agency admins, or super admins can create vehicles' });
      return;
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        brand: String(brand).trim(),
        model: String(model).trim(),
        capacity: Number(capacity),
        plateNumber: String(plateNumber).trim(),
        color: color != null ? String(color).trim() : null,
        ownerId: finalOwnerId || undefined,
        driverId: finalDriverId || undefined,
        agencyId: finalAgencyId || undefined,
      },
    });
    res.status(201).json(toApiVehicle(vehicle));
  } catch (error) {
    console.error('Vehicle create error:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// PUT /api/vehicles/:id (Auth required)
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const uid = req.user?.userId;
    let canEdit = false;
    if (req.user?.userType === UserType.SUPER_ADMIN) canEdit = true;
    else if (req.user?.userType === UserType.AGENCY_ADMIN && req.user.agencyId) {
      if (vehicle.agencyId === req.user.agencyId) canEdit = true;
      else {
        const driver = await prisma.user.findUnique({ where: { id: vehicle.driverId ?? '' } });
        if (driver?.agencyId === req.user.agencyId) canEdit = true;
      }
    } else if (req.user?.userType === UserType.DRIVER) {
      if (vehicle.driverId === uid || vehicle.ownerId === uid) canEdit = true;
    }
    if (!canEdit) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const body = req.body || {};
    const data: any = {};
    if (body.brand !== undefined) data.brand = String(body.brand).trim();
    if (body.make !== undefined) data.brand = String(body.make).trim();
    if (body.model !== undefined) data.model = String(body.model).trim();
    if (body.capacity !== undefined) data.capacity = Number(body.capacity);
    if (body.seats !== undefined) data.capacity = Number(body.seats);
    if (body.plateNumber !== undefined) data.plateNumber = String(body.plateNumber).trim();
    if (body.licensePlate !== undefined) data.plateNumber = String(body.licensePlate).trim();
    if (body.color !== undefined) data.color = body.color == null ? null : String(body.color).trim();
    if (body.status !== undefined) data.status = String(body.status);
    if (body.approvalStatus !== undefined) {
      const s = String(body.approvalStatus).toLowerCase();
      if (['pending', 'approved', 'rejected'].includes(s)) data.approvalStatus = s;
    }
    if (body.driverId !== undefined) data.driverId = body.driverId || null;
    if (body.ownerId !== undefined) data.ownerId = body.ownerId || null;
    if (body.agencyId !== undefined) data.agencyId = body.agencyId || null;

    const updated = await prisma.vehicle.update({
      where: { id },
      data,
    });
    res.json(toApiVehicle(updated));
  } catch (error) {
    console.error('Vehicle update error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

export default router;
