import express from 'express';
import prisma from '../prisma';
import { requireAuth, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import { UserType, UserStatus } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const router = express.Router();

// In-memory stores for user prefs (API parity; can move to DB later)
const profileCompleteByUserId: Record<string, boolean> = {};
const notificationPrefsByUserId: Record<string, Record<string, boolean>> = {};
const withdrawalMethodsByUserId: Record<string, Record<string, unknown>> = {};
const paymentMethodsByUserId: Record<string, { id: string; type: string; label?: string; detail?: string; isDefault: boolean }[]> = {};

// GET /api/users (Admin/Agency)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { role, agencyId } = req.query;
    
    if (req.user?.userType !== UserType.SUPER_ADMIN && req.user?.userType !== UserType.AGENCY_ADMIN) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const where: any = {};
    if (role) {
       if (role === 'driver') where.userType = UserType.DRIVER;
       if (role === 'agency') where.userType = UserType.AGENCY_ADMIN;
       if (role === 'scanner') where.userType = UserType.SCANNER;
       if (role === 'passenger') where.userType = UserType.USER;
    }
    
    if (agencyId) where.agencyId = String(agencyId);
    
    // Agency admin scope
    if (req.user?.userType === UserType.AGENCY_ADMIN) {
      where.agencyId = req.user.agencyId;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/** POST /api/users – create any user (super admin only) */
router.post('/', requireAuth, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { email, password, name, phone, userType: userTypeStr, agencyId } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }
    const rawType = String(userTypeStr || 'USER').toUpperCase();
    const validTypes = ['SUPER_ADMIN', 'AGENCY_ADMIN', 'SCANNER', 'DRIVER', 'USER'];
    if (!validTypes.includes(rawType)) {
      res.status(400).json({ error: 'Invalid userType. Must be one of: SUPER_ADMIN, AGENCY_ADMIN, SCANNER, DRIVER, USER' });
      return;
    }
    const userType = rawType as UserType;
    const needsAgency = [UserType.AGENCY_ADMIN, UserType.SCANNER, UserType.DRIVER].includes(userType);
    if (needsAgency && !agencyId) {
      res.status(400).json({ error: 'agencyId is required for Driver, Agency admin, and Scanner' });
      return;
    }
    if (needsAgency && agencyId) {
      const agency = await prisma.agency.findUnique({ where: { id: String(agencyId) } });
      if (!agency) {
        res.status(400).json({ error: 'Agency not found' });
        return;
      }
    }
    const emailNorm = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }
    const passwordHash = await hashPassword(password);
    const agencySubRole =
      userType === UserType.AGENCY_ADMIN ? 'agency_manager'
      : userType === UserType.SCANNER ? 'agency_scanner'
      : null;
    const user = await prisma.user.create({
      data: {
        email: emailNorm,
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        passwordHash,
        userType,
        status: UserStatus.APPROVED,
        agencyId: needsAgency ? String(agencyId) : null,
        agencySubRole,
      },
    });
    const { passwordHash: _, ...rest } = user;
    res.status(201).json(rest);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

function canAccessUser(req: AuthRequest, userId: string): boolean {
  return req.user?.userId === userId || req.user?.userType === UserType.SUPER_ADMIN;
}
// GET /api/users/:id/profile-complete
router.get('/:id/profile-complete', requireAuth, (req: AuthRequest, res) => {
  if (!canAccessUser(req, req.params.id)) return res.status(403).json({ error: 'Access denied' });
  res.json(!!profileCompleteByUserId[req.params.id]);
});
// PUT /api/users/:id/profile-complete
router.put('/:id/profile-complete', requireAuth, (req: AuthRequest, res) => {
  if (!canAccessUser(req, req.params.id)) return res.status(403).json({ error: 'Access denied' });
  profileCompleteByUserId[req.params.id] = !!req.body?.complete;
  res.json({ complete: !!profileCompleteByUserId[req.params.id] });
});
// GET /api/users/:id/notification-prefs
router.get('/:id/notification-prefs', requireAuth, (req: AuthRequest, res) => {
  if (!canAccessUser(req, req.params.id)) return res.status(403).json({ error: 'Access denied' });
  const prefs = notificationPrefsByUserId[req.params.id] || { tripUpdates: true, messageAlerts: true, promotions: true };
  res.json(prefs);
});
// PUT /api/users/:id/notification-prefs
router.put('/:id/notification-prefs', requireAuth, (req: AuthRequest, res) => {
  if (!canAccessUser(req, req.params.id)) return res.status(403).json({ error: 'Access denied' });
  notificationPrefsByUserId[req.params.id] = { ...req.body };
  res.json(notificationPrefsByUserId[req.params.id]);
});
// GET /api/users/:id/withdrawal-methods
router.get('/:id/withdrawal-methods', requireAuth, (req: AuthRequest, res) => {
  if (!canAccessUser(req, req.params.id)) return res.status(403).json({ error: 'Access denied' });
  res.json(withdrawalMethodsByUserId[req.params.id] || {});
});
// PUT /api/users/:id/withdrawal-methods
router.put('/:id/withdrawal-methods', requireAuth, (req: AuthRequest, res) => {
  if (!canAccessUser(req, req.params.id)) return res.status(403).json({ error: 'Access denied' });
  withdrawalMethodsByUserId[req.params.id] = { ...req.body };
  res.json(withdrawalMethodsByUserId[req.params.id]);
});
// GET /api/users/:id/payment-methods
router.get('/:id/payment-methods', requireAuth, (req: AuthRequest, res) => {
  if (!canAccessUser(req, req.params.id)) return res.status(403).json({ error: 'Access denied' });
  res.json(paymentMethodsByUserId[req.params.id] || []);
});
// POST /api/users/:id/payment-methods
router.post('/:id/payment-methods', requireAuth, (req: AuthRequest, res) => {
  if (!canAccessUser(req, req.params.id)) return res.status(403).json({ error: 'Access denied' });
  const list = paymentMethodsByUserId[req.params.id] || [];
  const { type, label, detail, isDefault } = req.body || {};
  const id = `pm_${Date.now()}`;
  const method = { id, type: type || 'card', label, detail, isDefault: !!isDefault };
  if (isDefault) list.forEach((m) => (m.isDefault = false));
  list.push(method);
  paymentMethodsByUserId[req.params.id] = list;
  res.status(201).json(method);
});
// DELETE /api/users/:id/payment-methods/:methodId
router.delete('/:id/payment-methods/:methodId', requireAuth, (req: AuthRequest, res) => {
  if (!canAccessUser(req, req.params.id)) return res.status(403).json({ error: 'Access denied' });
  const list = (paymentMethodsByUserId[req.params.id] || []).filter((m) => m.id !== req.params.methodId);
  paymentMethodsByUserId[req.params.id] = list;
  res.status(204).end();
});
// PATCH /api/users/:id/payment-methods/:methodId/default
router.patch('/:id/payment-methods/:methodId/default', requireAuth, (req: AuthRequest, res) => {
  if (!canAccessUser(req, req.params.id)) return res.status(403).json({ error: 'Access denied' });
  const list = paymentMethodsByUserId[req.params.id] || [];
  list.forEach((m) => (m.isDefault = m.id === req.params.methodId));
  res.json(list.find((m) => m.id === req.params.methodId) || {});
});

// GET /api/users/:id (Auth required)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    // Permission check
    if (req.user?.userId !== id && req.user?.userType !== UserType.SUPER_ADMIN && req.user?.userType !== UserType.AGENCY_ADMIN) {
       res.status(403).json({ error: 'Access denied' });
       return;
    }
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/users/:id/profile (Auth required)
router.put('/:id/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    
    if (req.user?.userId !== id && req.user?.userType !== UserType.SUPER_ADMIN) {
       res.status(403).json({ error: 'Access denied' });
       return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        email: email?.toLowerCase(),
        phone,
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
