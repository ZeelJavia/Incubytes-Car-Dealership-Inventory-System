import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { ConflictError, UnauthorizedError } from '../errors/AppError';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

const SALT_ROUNDS = 10;
const INVALID_CREDENTIALS_MSG = 'Invalid email or password';

export const registerUser = async (input: RegisterInput) => {
  const { name, email, password } = input;

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError('Email already in use');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'USER' },
  });

  // Issue JWT
  const token = signToken(user.id, user.role);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
};

export const loginUser = async (input: LoginInput) => {
  const { email, password } = input;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError(INVALID_CREDENTIALS_MSG);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError(INVALID_CREDENTIALS_MSG);
  }

  const token = signToken(user.id, user.role);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
};

const signToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');

  // Use a numeric expiry (seconds) to avoid StringValue type issues
  const expiresIn = 60 * 60 * 24 * 7; // 7 days in seconds

  return jwt.sign({ userId, role }, secret, { expiresIn });
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
