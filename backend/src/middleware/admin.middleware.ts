import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';

export const adminMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new UnauthorizedError('Not authenticated'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Admin access required'));
  }

  next();
};
