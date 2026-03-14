import express from 'express';
import prisma from '../prisma';
import { generateToken, hashPassword, comparePassword } from '../utils/auth';
import { UserType, UserStatus } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/auth/me (Auth required) - current user from JWT for session restore
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { passwordHash, ...rest } = user;
    res.json(rest);
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    // Allow login by email or phone
    const identifier = email?.trim().toLowerCase() || phone?.trim();
    if (!identifier) {
      res.status(400).json({ error: 'Email or phone is required' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.status !== UserStatus.APPROVED) {
      res.status(403).json({ error: 'Account is not approved' });
      return;
    }

    const token = generateToken(user);
    
    // Return user without sensitive data
    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, agencyId } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const emailNorm = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }

    const hashedPassword = await hashPassword(password);
    
    // Map role string to UserType. Super admin cannot be created via public register.
    let userType: UserType = UserType.USER;
    if (role === 'driver') userType = UserType.DRIVER;
    if (role === 'agency') userType = UserType.AGENCY_ADMIN;
    if (role === 'scanner') userType = UserType.SCANNER;
    if (role === 'admin') {
      res.status(403).json({ error: 'Super admin accounts can only be created by an existing super admin.' });
      return;
    }

    // Status logic
    let status: UserStatus = UserStatus.APPROVED;
    if (userType === UserType.DRIVER || userType === UserType.AGENCY_ADMIN) {
      // status = UserStatus.PENDING; // Uncomment if approval flow is desired
    }

    const user = await prisma.user.create({
      data: {
        email: emailNorm,
        phone,
        name,
        passwordHash: hashedPassword,
        userType,
        status,
        agencyId: agencyId || null,
        statusBadge: userType === UserType.DRIVER ? 'New Driver' : undefined,
      }
    });

    const token = generateToken(user);
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register-minimal (no password - for mobile quick signup)
router.post('/register-minimal', async (req, res) => {
  try {
    const { name, phone, email, role } = req.body;
    const id = `u_${Date.now()}`;
    const emailVal = (email || '').trim().toLowerCase();
    const finalEmail = emailVal || `phone-${id}@ihute.local`;
    if (emailVal) {
      const existing = await prisma.user.findUnique({ where: { email: finalEmail } });
      if (existing) {
        res.status(400).json({ error: 'An account with this email already exists.' });
        return;
      }
    }
    let userType: UserType = UserType.USER;
    if (role === 'driver') userType = UserType.DRIVER;
    if (role === 'agency') userType = UserType.AGENCY_ADMIN;
    const user = await prisma.user.create({
      data: {
        id,
        name: (name || '').trim(),
        email: finalEmail,
        phone: (phone || '').trim(),
        userType,
        status: UserStatus.APPROVED,
        statusBadge: userType === UserType.DRIVER ? 'New Driver' : 'Traveler',
      }
    });
    const token = generateToken(user);
    const { passwordHash, ...rest } = user;
    res.status(201).json({ token, user: rest });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// In-memory OTP store for dev parity (key -> { code, expiresAt })
const pendingOtps: Record<string, { code: string; expiresAt: number }> = {};
const OTP_TTL_MS = 10 * 60 * 1000;
const DEV_OTP = '123456';

function normalizeOtpKey(phoneOrEmail: string): string {
  return (phoneOrEmail || '').trim().toLowerCase().replace(/\s/g, '');
}

// POST /api/auth/otp/send
router.post('/otp/send', (req, res) => {
  const key = normalizeOtpKey(req.body?.phoneOrEmail || req.body?.key || '');
  pendingOtps[key] = { code: DEV_OTP, expiresAt: Date.now() + OTP_TTL_MS };
  res.json({ success: true });
});

// POST /api/auth/otp/verify
router.post('/otp/verify', (req, res) => {
  const key = normalizeOtpKey(req.body?.phoneOrEmail || req.body?.key || '');
  const code = (req.body?.code || '').trim();
  const pending = pendingOtps[key];
  const valid = !!pending && pending.expiresAt >= Date.now() && pending.code === code;
  if (valid) delete pendingOtps[key];
  res.json(valid);
});

// POST /api/auth/otp/create-user
router.post('/otp/create-user', async (req, res) => {
  try {
    const { phone, email } = req.body;
    const hasPhone = !!phone?.trim();
    const hasEmail = !!email?.trim();
    if (hasPhone === hasEmail) {
      res.status(400).json({ error: 'Provide exactly one of phone or email.' });
      return;
    }
    const id = `u_${Date.now()}`;
    const finalEmail = hasEmail ? (email as string).trim().toLowerCase() : `phone-${id}@ihute.local`;
    if (hasEmail) {
      const existing = await prisma.user.findUnique({ where: { email: finalEmail } });
      if (existing) {
        res.status(400).json({ error: 'An account with this email already exists.' });
        return;
      }
    }
    const user = await prisma.user.create({
      data: {
        id,
        name: 'Guest',
        email: finalEmail,
        phone: hasPhone ? (phone as string).trim() : '',
        userType: UserType.USER,
        status: UserStatus.APPROVED,
        statusBadge: 'Traveler',
      }
    });
    const token = generateToken(user);
    const { passwordHash, ...rest } = user;
    res.status(201).json({ token, user: rest });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
