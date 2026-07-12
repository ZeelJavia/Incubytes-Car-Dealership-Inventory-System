import request from 'supertest';
import app from '../src/app';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  OutOfStockError,
} from '../src/errors/AppError';
import { errorHandler } from '../src/middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';

// Set env vars
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/car_dealership_test';
process.env.JWT_SECRET = 'car_dealership_jwt_secret_key_test_2024';
process.env.NODE_ENV = 'test';

describe('F12 — Centralized Error Handling', () => {
  describe('Unit: Custom error classes map to correct status codes', () => {
    const mockReq = {} as Request;
    const mockNext = jest.fn() as unknown as NextFunction;

    const callErrorHandler = (err: Error) => {
      let statusCode = 0;
      let body: any = {};
      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return mockRes;
        },
        json: (data: any) => {
          body = data;
          return mockRes;
        },
      } as unknown as Response;
      errorHandler(err, mockReq, mockRes, mockNext);
      return { statusCode, body };
    };

    it('ValidationError → 400', () => {
      const { statusCode, body } = callErrorHandler(new ValidationError('bad input'));
      expect(statusCode).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('bad input');
    });

    it('UnauthorizedError → 401', () => {
      const { statusCode, body } = callErrorHandler(new UnauthorizedError('not auth'));
      expect(statusCode).toBe(401);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('ForbiddenError → 403', () => {
      const { statusCode, body } = callErrorHandler(new ForbiddenError());
      expect(statusCode).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('NotFoundError → 404', () => {
      const { statusCode, body } = callErrorHandler(new NotFoundError('not found'));
      expect(statusCode).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('ConflictError → 409', () => {
      const { statusCode, body } = callErrorHandler(new ConflictError('conflict'));
      expect(statusCode).toBe(409);
      expect(body.error.code).toBe('CONFLICT');
    });

    it('OutOfStockError → 409', () => {
      const { statusCode, body } = callErrorHandler(new OutOfStockError());
      expect(statusCode).toBe(409);
      expect(body.error.code).toBe('OUT_OF_STOCK');
    });

    it('Unknown error → 500 with standard shape (no stack trace)', () => {
      const { statusCode, body } = callErrorHandler(new Error('something broke'));
      expect(statusCode).toBe(500);
      expect(body.error.message).toBe('Internal server error');
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(body).not.toHaveProperty('stack');
    });

    it('All errors have consistent { error: { message, code } } shape', () => {
      const errors = [
        new ValidationError('x'),
        new UnauthorizedError('x'),
        new ForbiddenError('x'),
        new NotFoundError('x'),
        new ConflictError('x'),
        new OutOfStockError('x'),
        new Error('x'),
      ];

      errors.forEach((err) => {
        const { body } = callErrorHandler(err);
        expect(body).toHaveProperty('error');
        expect(body.error).toHaveProperty('message');
        expect(body.error).toHaveProperty('code');
      });
    });
  });

  describe('Integration: unhandled errors return standard JSON (not stack trace)', () => {
    it('route that throws unhandled error returns 500 with JSON shape', async () => {
      // Register a test-only route that throws an unhandled error
      const express = require('express');
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/test-error', () => {
        throw new Error('Unhandled test error');
      });
      const { errorHandler: eh } = require('../src/middleware/errorHandler');
      testApp.use(eh);

      const res = await request(testApp).get('/test-error');
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('message', 'Internal server error');
      expect(res.body.error).toHaveProperty('code', 'INTERNAL_SERVER_ERROR');
      expect(res.body.error).not.toHaveProperty('stack');
    });
  });
});
