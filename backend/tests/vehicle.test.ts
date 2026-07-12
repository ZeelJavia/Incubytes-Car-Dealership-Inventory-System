import request from 'supertest';
import app from '../src/app';
import {
  prisma,
  cleanDatabase,
  createTestUser,
  createTestVehicle,
  authHeader,
} from './helpers';

// Set env vars
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/car_dealership_test';
process.env.JWT_SECRET = 'car_dealership_jwt_secret_key_test_2024';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

const validVehicle = {
  make: 'Toyota',
  model: 'Camry',
  category: 'Sedan',
  price: 25000,
  quantity: 10,
};

describe('F5 — Create Vehicle', () => {
  let userToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const { token } = await createTestUser({ role: 'USER' });
    userToken = token;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('creates vehicle and returns 201 with generated id', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader(userToken))
      .send(validVehicle);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.make).toBe('Toyota');
    expect(res.body.price).toBe(25000);
    expect(res.body.quantity).toBe(10);
  });

  it('created vehicle appears in subsequent GET /api/vehicles', async () => {
    const createRes = await request(app)
      .post('/api/vehicles')
      .set(authHeader(userToken))
      .send({ ...validVehicle, make: 'Honda' });

    const listRes = await request(app)
      .get('/api/vehicles')
      .set(authHeader(userToken));

    const found = listRes.body.find((v: any) => v.id === createRes.body.id);
    expect(found).toBeDefined();
    expect(found.make).toBe('Honda');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/vehicles').send(validVehicle);
    expect(res.status).toBe(401);
  });

  it('returns 400 for negative price', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader(userToken))
      .send({ ...validVehicle, price: -100 });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Price must be greater than 0');
  });

  it('returns 400 for price = 0', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader(userToken))
      .send({ ...validVehicle, price: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative quantity', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader(userToken))
      .send({ ...validVehicle, quantity: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Quantity must be');
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set(authHeader(userToken))
      .send({ make: 'Toyota' }); // missing model, category, price, quantity
    expect(res.status).toBe(400);
  });
});

describe('F6 — List Vehicles', () => {
  let userToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const { token } = await createTestUser({ role: 'USER' });
    userToken = token;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('returns 200 + empty array when no vehicles exist', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('returns correct count and shape after seeding vehicles', async () => {
    await createTestVehicle({ make: 'Toyota' });
    await createTestVehicle({ make: 'Honda' });
    await createTestVehicle({ make: 'Ford' });

    const res = await request(app)
      .get('/api/vehicles')
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    const v = res.body[0];
    expect(v).toHaveProperty('id');
    expect(v).toHaveProperty('make');
    expect(v).toHaveProperty('model');
    expect(v).toHaveProperty('category');
    expect(v).toHaveProperty('price');
    expect(v).toHaveProperty('quantity');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(401);
  });
});

describe('F7 — Search/Filter Vehicles', () => {
  let userToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const { token } = await createTestUser({ role: 'USER' });
    userToken = token;

    // Seed vehicles for search tests
    await createTestVehicle({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 5 });
    await createTestVehicle({ make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 3 });
    await createTestVehicle({ make: 'Honda', model: 'CR-V', category: 'SUV', price: 35000, quantity: 2 });
    await createTestVehicle({ make: 'Ford', model: 'F-150', category: 'Truck', price: 45000, quantity: 8 });
    await createTestVehicle({ make: 'BMW', model: 'X5', category: 'SUV', price: 65000, quantity: 1 });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('filters by make (case-insensitive)', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=toyota')
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    res.body.forEach((v: any) => expect(v.make.toLowerCase()).toContain('toyota'));
  });

  it('filters by category', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?category=SUV')
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    res.body.forEach((v: any) => expect(v.category).toBe('SUV'));
  });

  it('filters by price range (minPrice and maxPrice)', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?minPrice=20000&maxPrice=35000')
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((v: any) => {
      expect(v.price).toBeGreaterThanOrEqual(20000);
      expect(v.price).toBeLessThanOrEqual(35000);
    });
  });

  it('combines multiple filters (AND logic)', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=toyota&category=Sedan&minPrice=22000')
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].make).toBe('Toyota');
    expect(res.body[0].model).toBe('Camry');
  });

  it('returns empty array (not error) when no matches', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=Lamborghini')
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns 400 for non-numeric minPrice', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?minPrice=notanumber')
      .set(authHeader(userToken));

    expect(res.status).toBe(400);
  });

  it('returns 400 for non-numeric maxPrice', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?maxPrice=abc')
      .set(authHeader(userToken));

    expect(res.status).toBe(400);
  });

  it('requires auth token', async () => {
    const res = await request(app).get('/api/vehicles/search?make=Toyota');
    expect(res.status).toBe(401);
  });
});

describe('F8 — Update Vehicle', () => {
  let userToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const { token } = await createTestUser({ role: 'USER' });
    userToken = token;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('updates vehicle and returns 200 with updated fields', async () => {
    const v = await createTestVehicle({ price: 20000 });

    const res = await request(app)
      .put(`/api/vehicles/${v.id}`)
      .set(authHeader(userToken))
      .send({ price: 25000 });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(25000);
  });

  it('partial update leaves other fields untouched', async () => {
    const v = await createTestVehicle({
      make: 'Toyota',
      model: 'Camry',
      price: 20000,
      quantity: 5,
    });

    const res = await request(app)
      .put(`/api/vehicles/${v.id}`)
      .set(authHeader(userToken))
      .send({ price: 30000 }); // only update price

    expect(res.status).toBe(200);
    expect(res.body.make).toBe('Toyota');
    expect(res.body.model).toBe('Camry');
    expect(res.body.quantity).toBe(5);
    expect(res.body.price).toBe(30000);
  });

  it('returns 404 for non-existent vehicle id', async () => {
    const res = await request(app)
      .put('/api/vehicles/00000000-0000-0000-0000-000000000000')
      .set(authHeader(userToken))
      .send({ price: 25000 });

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth token', async () => {
    const v = await createTestVehicle();
    const res = await request(app)
      .put(`/api/vehicles/${v.id}`)
      .send({ price: 25000 });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid field values (negative price)', async () => {
    const v = await createTestVehicle();
    const res = await request(app)
      .put(`/api/vehicles/${v.id}`)
      .set(authHeader(userToken))
      .send({ price: -100 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative quantity on update', async () => {
    const v = await createTestVehicle();
    const res = await request(app)
      .put(`/api/vehicles/${v.id}`)
      .set(authHeader(userToken))
      .send({ quantity: -5 });
    expect(res.status).toBe(400);
  });
});

describe('F9 — Delete Vehicle', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin-del@example.com' });
    const user = await createTestUser({ role: 'USER', email: 'user-del@example.com' });
    adminToken = admin.token;
    userToken = user.token;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('admin can delete a vehicle (returns 200)', async () => {
    const v = await createTestVehicle();
    const res = await request(app)
      .delete(`/api/vehicles/${v.id}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
  });

  it('deleted vehicle no longer appears in GET /api/vehicles', async () => {
    const v = await createTestVehicle({ make: 'DeleteMe' });
    await request(app)
      .delete(`/api/vehicles/${v.id}`)
      .set(authHeader(adminToken));

    const listRes = await request(app)
      .get('/api/vehicles')
      .set(authHeader(adminToken));

    const found = listRes.body.find((vehicle: any) => vehicle.id === v.id);
    expect(found).toBeUndefined();
  });

  it('non-admin user gets 403', async () => {
    const v = await createTestVehicle();
    const res = await request(app)
      .delete(`/api/vehicles/${v.id}`)
      .set(authHeader(userToken));
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent vehicle id', async () => {
    const res = await request(app)
      .delete('/api/vehicles/00000000-0000-0000-0000-000000000000')
      .set(authHeader(adminToken));
    expect(res.status).toBe(404);
  });
});

describe('F10 — Purchase Vehicle', () => {
  let userToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const { token } = await createTestUser({ role: 'USER', email: 'buyer@example.com' });
    userToken = token;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('decrements quantity by 1 on successful purchase', async () => {
    const v = await createTestVehicle({ quantity: 5 });

    const res = await request(app)
      .post(`/api/vehicles/${v.id}/purchase`)
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(4);
  });

  it('blocks purchase when quantity is 0 (returns 409)', async () => {
    const v = await createTestVehicle({ quantity: 0 });

    const res = await request(app)
      .post(`/api/vehicles/${v.id}/purchase`)
      .set(authHeader(userToken));

    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain('out of stock');
  });

  it('quantity never goes negative', async () => {
    const v = await createTestVehicle({ quantity: 1 });

    // First purchase succeeds
    const res1 = await request(app)
      .post(`/api/vehicles/${v.id}/purchase`)
      .set(authHeader(userToken));
    expect(res1.status).toBe(200);
    expect(res1.body.quantity).toBe(0);

    // Second purchase blocked
    const res2 = await request(app)
      .post(`/api/vehicles/${v.id}/purchase`)
      .set(authHeader(userToken));
    expect(res2.status).toBe(409);

    // Verify in database
    const dbVehicle = await prisma.vehicle.findUnique({ where: { id: v.id } });
    expect(dbVehicle!.quantity).toBe(0);
  });

  it('returns 404 for non-existent vehicle', async () => {
    const res = await request(app)
      .post('/api/vehicles/00000000-0000-0000-0000-000000000000/purchase')
      .set(authHeader(userToken));
    expect(res.status).toBe(404);
  });

  it('returns 401 without auth token', async () => {
    const v = await createTestVehicle({ quantity: 5 });
    const res = await request(app).post(`/api/vehicles/${v.id}/purchase`);
    expect(res.status).toBe(401);
  });

  it('concurrent purchases at quantity=1 — only one succeeds (race condition test)', async () => {
    const v = await createTestVehicle({ quantity: 1 });

    // Fire two simultaneous purchase requests
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/vehicles/${v.id}/purchase`)
        .set(authHeader(userToken)),
      request(app)
        .post(`/api/vehicles/${v.id}/purchase`)
        .set(authHeader(userToken)),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    // Database quantity must not be negative
    const dbVehicle = await prisma.vehicle.findUnique({ where: { id: v.id } });
    expect(dbVehicle!.quantity).toBeGreaterThanOrEqual(0);
  });
});

describe('F11 — Restock Vehicle', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createTestUser({ role: 'ADMIN', email: 'admin-rs@example.com' });
    const user = await createTestUser({ role: 'USER', email: 'user-rs@example.com' });
    adminToken = admin.token;
    userToken = user.token;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('admin can restock and quantity increases correctly', async () => {
    const v = await createTestVehicle({ quantity: 3 });

    const res = await request(app)
      .post(`/api/vehicles/${v.id}/restock`)
      .set(authHeader(adminToken))
      .send({ amount: 7 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(10);
  });

  it('non-admin gets 403 on restock', async () => {
    const v = await createTestVehicle({ quantity: 5 });
    const res = await request(app)
      .post(`/api/vehicles/${v.id}/restock`)
      .set(authHeader(userToken))
      .send({ amount: 5 });
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent vehicle', async () => {
    const res = await request(app)
      .post('/api/vehicles/00000000-0000-0000-0000-000000000000/restock')
      .set(authHeader(adminToken))
      .send({ amount: 5 });
    expect(res.status).toBe(404);
  });

  it('rejects amount <= 0', async () => {
    const v = await createTestVehicle({ quantity: 5 });

    const res0 = await request(app)
      .post(`/api/vehicles/${v.id}/restock`)
      .set(authHeader(adminToken))
      .send({ amount: 0 });
    expect(res0.status).toBe(400);

    const resNeg = await request(app)
      .post(`/api/vehicles/${v.id}/restock`)
      .set(authHeader(adminToken))
      .send({ amount: -5 });
    expect(resNeg.status).toBe(400);
  });

  it('rejects missing amount field', async () => {
    const v = await createTestVehicle({ quantity: 5 });
    const res = await request(app)
      .post(`/api/vehicles/${v.id}/restock`)
      .set(authHeader(adminToken))
      .send({});
    expect(res.status).toBe(400);
  });
});
