import request from 'supertest';
import app from '../src/app';
import {
  prisma,
  cleanDatabase,
  createTestUser,
  authHeader,
} from './helpers';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../src/services/auth.service';

// Set env vars
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/car_dealership_test';
process.env.JWT_SECRET = 'car_dealership_jwt_secret_key_test_2024';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

describe('F1 — User Registration', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Unit tests
  describe('Unit: Password hashing', () => {
    it('hashes password — stored hash !== plaintext', async () => {
      const plain = 'mypassword123';
      const hash = await hashPassword(plain);
      expect(hash).not.toBe(plain);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('hashed password can be verified with comparePassword', async () => {
      const plain = 'mypassword123';
      const hash = await hashPassword(plain);
      const isValid = await comparePassword(plain, hash);
      const isInvalid = await comparePassword('wrong', hash);
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  // Integration tests
  describe('POST /api/auth/register', () => {
    it('returns 201 with token and user (no passwordHash) on success', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email', 'alice@example.com');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('stores hashed password (not plaintext) in database', async () => {
      const password = 'supersecretpass1';
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bob', email: 'bob@example.com', password });

      const user = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });
      expect(user).toBeTruthy();
      expect(user!.passwordHash).not.toBe(password);
      expect(user!.passwordHash.startsWith('$2b$')).toBe(true);
      const valid = await bcrypt.compare(password, user!.passwordHash);
      expect(valid).toBe(true);
    });

    it('returns 409 when email already exists', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice2', email: 'alice@example.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('Email already in use');
    });

    it('returns 400 for missing required fields', async () => {
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' }); // missing name
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', password: 'password123' }); // missing email
      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com' }); // missing password
      expect(res3.status).toBe(400);
    });

    it('returns 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'not-an-email', password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid email');
    });

    it('returns 400 for password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'short' });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('8 characters');
    });

    it('returned token is immediately usable on a protected route', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

      const { token } = registerRes.body;

      const protectedRes = await request(app)
        .get('/api/vehicles')
        .set(authHeader(token));

      expect(protectedRes.status).toBe(200);
    });

    it('error response has consistent shape { error: { message, code } }', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('message');
      expect(res.body.error).toHaveProperty('code');
    });
  });
});

describe('F2 — User Login', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 and valid JWT for correct credentials', async () => {
      await createTestUser({ email: 'alice@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('JWT decodes with userId and role', async () => {
      const { user } = await createTestUser({
        email: 'alice@example.com',
        password: 'password123',
        role: 'USER',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'password123' });

      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET!) as any;
      expect(decoded.userId).toBe(user.id);
      expect(decoded.role).toBe('USER');
    });

    it('returns 401 for wrong password', async () => {
      await createTestUser({ email: 'alice@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('returns 401 for unknown email (same message as wrong password)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('wrong-password and unknown-email return same error message (no user enumeration)', async () => {
      await createTestUser({ email: 'alice@example.com', password: 'password123' });

      const wrongPwdRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'wrong' });

      const unknownEmailRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(wrongPwdRes.body.error.message).toBe(unknownEmailRes.body.error.message);
    });

    it('returns 400 for missing email or password', async () => {
      const res1 = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com' });
      expect(res2.status).toBe(400);
    });
  });
});
