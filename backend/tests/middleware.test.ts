import request from 'supertest';
import app from '../src/app';
import {
  prisma,
  cleanDatabase,
  createTestUser,
  createTestVehicle,
  authHeader,
  generateExpiredToken,
} from './helpers';

// Set env vars
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/car_dealership_test';
process.env.JWT_SECRET = 'car_dealership_jwt_secret_key_test_2024';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

describe('F3 — Auth Middleware', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Unit-style integration tests for auth middleware', () => {
    it('valid token allows access to protected route', async () => {
      const { token } = await createTestUser();
      const res = await request(app)
        .get('/api/vehicles')
        .set(authHeader(token));
      expect(res.status).toBe(200);
    });

    it('missing Authorization header returns 401', async () => {
      const res = await request(app).get('/api/vehicles');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('malformed token returns 401', async () => {
      const res = await request(app)
        .get('/api/vehicles')
        .set('Authorization', 'Bearer not.a.valid.jwt');
      expect(res.status).toBe(401);
    });

    it('expired token returns 401', async () => {
      const { user } = await createTestUser();
      const expiredToken = generateExpiredToken(user.id, user.role);

      const res = await request(app)
        .get('/api/vehicles')
        .set(authHeader(expiredToken));
      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('expired');
    });

    it('Bearer prefix is required — plain token returns 401', async () => {
      const { token } = await createTestUser();
      const res = await request(app)
        .get('/api/vehicles')
        .set('Authorization', token); // No "Bearer " prefix
      expect(res.status).toBe(401);
    });
  });
});

describe('F4 — Admin Middleware', () => {
  let adminToken: string;
  let userToken: string;
  let vehicleId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin@example.com' });
    const user = await createTestUser({ role: 'USER', email: 'user@example.com' });
    adminToken = admin.token;
    userToken = user.token;

    // Create a vehicle to test delete on
    const v = await createTestVehicle();
    vehicleId = v.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('ADMIN can access admin-only route (DELETE /api/vehicles/:id)', async () => {
    const res = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
  });

  it('USER gets 403 on admin-only route', async () => {
    const v = await createTestVehicle();
    const res = await request(app)
      .delete(`/api/vehicles/${v.id}`)
      .set(authHeader(userToken));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('unauthenticated user gets 401 (not 403) on admin route', async () => {
    const res = await request(app).delete(`/api/vehicles/${vehicleId}`);
    expect(res.status).toBe(401);
  });
});
