import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/AppError';
import {
  createVehicle,
  listVehicles,
  searchVehicles,
  updateVehicle,
  deleteVehicle,
  purchaseVehicle,
  restockVehicle,
  SearchFilters,
} from '../services/vehicle.service';

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const vehicle = await createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
};

export const list = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const vehicles = await listVehicles();
    res.status(200).json(vehicles);
  } catch (error) {
    next(error);
  }
};

export const search = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { make, model, category, minPrice, maxPrice } = req.query;

    // Validate price params
    if (minPrice !== undefined && isNaN(Number(minPrice))) {
      throw new ValidationError('minPrice must be a valid number');
    }
    if (maxPrice !== undefined && isNaN(Number(maxPrice))) {
      throw new ValidationError('maxPrice must be a valid number');
    }

    const filters: SearchFilters = {};
    if (make) filters.make = make as string;
    if (model) filters.model = model as string;
    if (category) filters.category = category as string;
    if (minPrice !== undefined) filters.minPrice = Number(minPrice);
    if (maxPrice !== undefined) filters.maxPrice = Number(maxPrice);

    const vehicles = await searchVehicles(filters);
    res.status(200).json(vehicles);
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicle = await updateVehicle(id, req.body);
    res.status(200).json(vehicle);
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteVehicle(id);
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const purchase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicle = await purchaseVehicle(id);
    res.status(200).json(vehicle);
  } catch (error) {
    next(error);
  }
};

export const restock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicle = await restockVehicle(id, req.body);
    res.status(200).json(vehicle);
  } catch (error) {
    next(error);
  }
};
