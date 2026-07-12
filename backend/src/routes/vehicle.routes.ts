import { Router } from 'express';
import {
  create,
  list,
  search,
  update,
  remove,
  purchase,
  restock,
} from '../controllers/vehicle.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { validate } from '../middleware/validate';
import {
  createVehicleSchema,
  updateVehicleSchema,
  restockSchema,
} from '../schemas/vehicle.schema';

const router = Router();

// All vehicle routes require authentication
router.use(authMiddleware);

// Search must come before /:id routes
router.get('/search', search);

router.get('/', list);
router.post('/', validate(createVehicleSchema), create);
router.put('/:id', validate(updateVehicleSchema), update);
router.post('/:id/purchase', purchase);

// Admin only routes
router.delete('/:id', adminMiddleware, remove);
router.post('/:id/restock', adminMiddleware, validate(restockSchema), restock);

export default router;
