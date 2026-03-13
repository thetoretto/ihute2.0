import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const generateToken = (user: User) => {
  return jwt.sign(
    {
      userId: user.id,
      userType: user.userType,
      agencyId: user.agencyId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};
