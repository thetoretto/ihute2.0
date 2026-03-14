import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserType } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    userType: UserType;
    agencyId: string | null;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/** Sets req.user when Authorization is present; does not reject when absent. Use for public routes that support optional login. */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    next();
    return;
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    next();
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = payload;
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.userType !== UserType.SUPER_ADMIN) {
    res.status(403).json({ error: 'Super Admin access required' });
    return;
  }
  next();
};

export const requireAgencyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.userType !== UserType.AGENCY_ADMIN && req.user.userType !== UserType.SUPER_ADMIN)) {
    res.status(403).json({ error: 'Agency Admin access required' });
    return;
  }
  next();
};
