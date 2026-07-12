import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Set env before any imports
process.env.DATABASE_URL = 'postgresql://postgres@127.0.0.1:5432/car_dealership_test';
process.env.JWT_SECRET = 'car_dealership_jwt_secret_key_test_2024';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export { prisma };

export const cleanDatabase = async () => {
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
};

export const createTestUser = async (
  overrides: Partial<{
    name: string;
    email: string;
    password: string;
    role: 'USER' | 'ADMIN';
  }> = {}
) => {
  const data = {
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `test-${Date.now()}@example.com`,
    password: overrides.password ?? 'password123',
    role: overrides.role ?? 'USER',
  };

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
    },
  });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: 60 * 60 * 24 * 7 } // 7 days as number
  );

  return { user, token, password: data.password };
};

export const createTestVehicle = async (
  overrides: Partial<{
    make: string;
    model: string;
    category: string;
    price: number;
    quantity: number;
  }> = {}
) => {
  return prisma.vehicle.create({
    data: {
      make: overrides.make ?? 'Toyota',
      model: overrides.model ?? 'Camry',
      category: overrides.category ?? 'Sedan',
      price: new Prisma.Decimal(overrides.price ?? 25000),
      quantity: overrides.quantity ?? 10,
    },
  });
};

export const generateExpiredToken = (userId: string, role: string = 'USER') => {
  // Sign with iat set 10 seconds in the past and exp = iat + 1s → already expired
  const iat = Math.floor(Date.now() / 1000) - 10;
  return jwt.sign(
    { userId, role, iat, exp: iat + 1 },
    process.env.JWT_SECRET!
  );
};

export const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});
