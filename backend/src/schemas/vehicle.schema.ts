import { z } from 'zod';

export const createVehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  category: z.string().min(1, 'Category is required'),
  price: z
    .number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0'),
  quantity: z
    .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(0, 'Quantity must be >= 0'),
});

export const updateVehicleSchema = z
  .object({
    make: z.string().min(1, 'Make is required').optional(),
    model: z.string().min(1, 'Model is required').optional(),
    category: z.string().min(1, 'Category is required').optional(),
    price: z
      .number({ invalid_type_error: 'Price must be a number' })
      .positive('Price must be greater than 0')
      .optional(),
    quantity: z
      .number({ invalid_type_error: 'Quantity must be a number' })
      .int('Quantity must be an integer')
      .min(0, 'Quantity must be >= 0')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const restockSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .int('Amount must be an integer')
    .positive('Amount must be greater than 0'),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type RestockInput = z.infer<typeof restockSchema>;
