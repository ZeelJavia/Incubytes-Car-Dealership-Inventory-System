import { registerSchema, loginSchema } from '../src/schemas/auth.schema';
import {
  createVehicleSchema,
  updateVehicleSchema,
  restockSchema,
} from '../src/schemas/vehicle.schema';
import {
  decrementQuantity,
  incrementQuantity,
  buildWhereClause,
} from '../src/services/vehicle.service';
import { OutOfStockError, ValidationError } from '../src/errors/AppError';

// Set env vars
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/car_dealership_test';
process.env.JWT_SECRET = 'car_dealership_jwt_secret_key_test_2024';
process.env.NODE_ENV = 'test';

describe('F13 — Input Validation Schemas', () => {
  describe('registerSchema', () => {
    const validPayload = {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    };

    const cases = [
      { desc: 'accepts valid payload', payload: validPayload, valid: true },
      { desc: 'rejects missing name', payload: { email: 'a@b.com', password: 'password123' }, valid: false },
      { desc: 'rejects invalid email', payload: { name: 'Alice', email: 'notvalid', password: 'password123' }, valid: false },
      { desc: 'rejects short password (<8)', payload: { name: 'Alice', email: 'a@b.com', password: 'short' }, valid: false },
      { desc: 'rejects empty object', payload: {}, valid: false },
      { desc: 'rejects empty name', payload: { name: '', email: 'a@b.com', password: 'password123' }, valid: false },
    ];

    cases.forEach(({ desc, payload, valid }) => {
      it(desc, () => {
        const result = registerSchema.safeParse(payload);
        expect(result.success).toBe(valid);
      });
    });
  });

  describe('loginSchema', () => {
    const cases = [
      { desc: 'accepts valid payload', payload: { email: 'a@b.com', password: 'pw123' }, valid: true },
      { desc: 'rejects missing email', payload: { password: 'pw123' }, valid: false },
      { desc: 'rejects invalid email', payload: { email: 'not-email', password: 'pw123' }, valid: false },
      { desc: 'rejects missing password', payload: { email: 'a@b.com' }, valid: false },
      { desc: 'rejects empty password', payload: { email: 'a@b.com', password: '' }, valid: false },
    ];

    cases.forEach(({ desc, payload, valid }) => {
      it(desc, () => {
        const result = loginSchema.safeParse(payload);
        expect(result.success).toBe(valid);
      });
    });
  });

  describe('createVehicleSchema', () => {
    const validPayload = {
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000,
      quantity: 10,
    };

    const cases = [
      { desc: 'accepts valid payload', payload: validPayload, valid: true },
      { desc: 'accepts quantity = 0', payload: { ...validPayload, quantity: 0 }, valid: true },
      { desc: 'rejects negative price', payload: { ...validPayload, price: -1 }, valid: false },
      { desc: 'rejects price = 0', payload: { ...validPayload, price: 0 }, valid: false },
      { desc: 'rejects negative quantity', payload: { ...validPayload, quantity: -1 }, valid: false },
      { desc: 'rejects missing make', payload: { model: 'Camry', category: 'Sedan', price: 25000, quantity: 10 }, valid: false },
      { desc: 'rejects missing model', payload: { make: 'Toyota', category: 'Sedan', price: 25000, quantity: 10 }, valid: false },
      { desc: 'rejects missing category', payload: { make: 'Toyota', model: 'Camry', price: 25000, quantity: 10 }, valid: false },
      { desc: 'rejects missing price', payload: { make: 'Toyota', model: 'Camry', category: 'Sedan', quantity: 10 }, valid: false },
      { desc: 'rejects non-integer quantity', payload: { ...validPayload, quantity: 1.5 }, valid: false },
    ];

    cases.forEach(({ desc, payload, valid }) => {
      it(desc, () => {
        const result = createVehicleSchema.safeParse(payload);
        expect(result.success).toBe(valid);
      });
    });
  });

  describe('updateVehicleSchema', () => {
    const cases = [
      { desc: 'accepts partial update (price only)', payload: { price: 30000 }, valid: true },
      { desc: 'accepts full update', payload: { make: 'Honda', model: 'Civic', category: 'Sedan', price: 20000, quantity: 5 }, valid: true },
      { desc: 'rejects empty object', payload: {}, valid: false },
      { desc: 'rejects negative price', payload: { price: -1 }, valid: false },
      { desc: 'rejects price = 0', payload: { price: 0 }, valid: false },
      { desc: 'rejects negative quantity', payload: { quantity: -1 }, valid: false },
    ];

    cases.forEach(({ desc, payload, valid }) => {
      it(desc, () => {
        const result = updateVehicleSchema.safeParse(payload);
        expect(result.success).toBe(valid);
      });
    });
  });

  describe('restockSchema', () => {
    const cases = [
      { desc: 'accepts positive integer amount', payload: { amount: 5 }, valid: true },
      { desc: 'accepts amount = 1', payload: { amount: 1 }, valid: true },
      { desc: 'rejects amount = 0', payload: { amount: 0 }, valid: false },
      { desc: 'rejects negative amount', payload: { amount: -5 }, valid: false },
      { desc: 'rejects missing amount', payload: {}, valid: false },
      { desc: 'rejects non-integer amount', payload: { amount: 2.5 }, valid: false },
    ];

    cases.forEach(({ desc, payload, valid }) => {
      it(desc, () => {
        const result = restockSchema.safeParse(payload);
        expect(result.success).toBe(valid);
      });
    });
  });

  describe('Unit: decrementQuantity helper', () => {
    it('decrements by 1 by default', () => {
      expect(decrementQuantity(5)).toBe(4);
    });

    it('decrements by specified amount', () => {
      expect(decrementQuantity(10, 3)).toBe(7);
    });

    it('throws OutOfStockError when quantity is 0', () => {
      expect(() => decrementQuantity(0)).toThrow(OutOfStockError);
    });

    it('throws when amount exceeds quantity', () => {
      expect(() => decrementQuantity(2, 5)).toThrow(OutOfStockError);
    });
  });

  describe('Unit: incrementQuantity helper', () => {
    it('increments by specified amount', () => {
      expect(incrementQuantity(5, 3)).toBe(8);
    });

    it('throws ValidationError for amount = 0', () => {
      expect(() => incrementQuantity(5, 0)).toThrow(ValidationError);
    });

    it('throws ValidationError for negative amount', () => {
      expect(() => incrementQuantity(5, -1)).toThrow(ValidationError);
    });
  });

  describe('Unit: buildWhereClause (search filter builder)', () => {
    it('returns empty object for no filters', () => {
      const where = buildWhereClause({});
      expect(where).toEqual({});
    });

    it('adds make filter', () => {
      const where = buildWhereClause({ make: 'Toyota' });
      expect(where).toHaveProperty('make');
    });

    it('adds category filter', () => {
      const where = buildWhereClause({ category: 'SUV' });
      expect(where).toHaveProperty('category');
    });

    it('adds minPrice filter', () => {
      const where = buildWhereClause({ minPrice: 20000 });
      expect(where).toHaveProperty('price');
    });

    it('combines multiple filters (AND logic)', () => {
      const where = buildWhereClause({ make: 'Toyota', category: 'SUV', minPrice: 30000 });
      expect(where).toHaveProperty('make');
      expect(where).toHaveProperty('category');
      expect(where).toHaveProperty('price');
    });
  });
});
