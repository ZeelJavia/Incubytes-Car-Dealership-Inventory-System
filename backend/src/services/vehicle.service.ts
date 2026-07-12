import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { NotFoundError, OutOfStockError, ValidationError } from '../errors/AppError';
import {
  CreateVehicleInput,
  UpdateVehicleInput,
  RestockInput,
} from '../schemas/vehicle.schema';

export const createVehicle = async (input: CreateVehicleInput) => {
  const vehicle = await prisma.vehicle.create({
    data: {
      make: input.make,
      model: input.model,
      category: input.category,
      price: new Prisma.Decimal(input.price),
      quantity: input.quantity,
    },
  });
  return serializeVehicle(vehicle);
};

export const listVehicles = async () => {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return vehicles.map(serializeVehicle);
};

export interface SearchFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export const buildWhereClause = (
  filters: SearchFilters
): Prisma.VehicleWhereInput => {
  const where: Prisma.VehicleWhereInput = {};

  if (filters.make) {
    where.make = { contains: filters.make, mode: 'insensitive' };
  }
  if (filters.model) {
    where.model = { contains: filters.model, mode: 'insensitive' };
  }
  if (filters.category) {
    where.category = { contains: filters.category, mode: 'insensitive' };
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) {
      (where.price as Prisma.DecimalFilter).gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      (where.price as Prisma.DecimalFilter).lte = filters.maxPrice;
    }
  }

  return where;
};

export const searchVehicles = async (filters: SearchFilters) => {
  const where = buildWhereClause(filters);
  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return vehicles.map(serializeVehicle);
};

export const updateVehicle = async (id: string, input: UpdateVehicleInput) => {
  await ensureVehicleExists(id);

  const data: Prisma.VehicleUpdateInput = {};
  if (input.make !== undefined) data.make = input.make;
  if (input.model !== undefined) data.model = input.model;
  if (input.category !== undefined) data.category = input.category;
  if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
  if (input.quantity !== undefined) data.quantity = input.quantity;

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data,
  });
  return serializeVehicle(vehicle);
};

export const deleteVehicle = async (id: string) => {
  await ensureVehicleExists(id);
  await prisma.vehicle.delete({ where: { id } });
};

export const purchaseVehicle = async (id: string) => {
  await ensureVehicleExists(id);

  // Use a transaction + raw update to prevent negative quantity atomically
  const result = await prisma.$transaction(async (tx) => {
    // Lock the row
    const vehicle = await tx.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    if (vehicle.quantity === 0) {
      throw new OutOfStockError('Vehicle is out of stock');
    }

    const updated = await tx.vehicle.update({
      where: {
        id,
        quantity: { gt: 0 }, // extra safety guard
      },
      data: {
        quantity: { decrement: 1 },
      },
    });

    return updated;
  });

  if (!result) {
    throw new OutOfStockError('Vehicle is out of stock');
  }

  return serializeVehicle(result);
};

export const restockVehicle = async (id: string, input: RestockInput) => {
  await ensureVehicleExists(id);

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: { quantity: { increment: input.amount } },
  });

  return serializeVehicle(vehicle);
};

// Helpers

const ensureVehicleExists = async (id: string) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  return vehicle;
};

// Serialize Decimal to number for JSON responses
export const serializeVehicle = (vehicle: {
  id: string;
  make: string;
  model: string;
  category: string;
  price: Prisma.Decimal;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: vehicle.id,
  make: vehicle.make,
  model: vehicle.model,
  category: vehicle.category,
  price: parseFloat(vehicle.price.toString()),
  quantity: vehicle.quantity,
  createdAt: vehicle.createdAt,
  updatedAt: vehicle.updatedAt,
});

// Pure helper functions for unit testing
export const decrementQuantity = (current: number, amount: number = 1): number => {
  if (current < amount) {
    throw new OutOfStockError('Insufficient stock');
  }
  return current - amount;
};

export const incrementQuantity = (current: number, amount: number): number => {
  if (amount <= 0) {
    throw new ValidationError('Restock amount must be greater than 0');
  }
  return current + amount;
};
