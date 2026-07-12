// Global setup: set env vars before any test runs
export default async function globalSetup() {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/car_dealership_test';
  process.env.JWT_SECRET = 'car_dealership_jwt_secret_key_test_2024';
  process.env.JWT_EXPIRES_IN = '7d';
  process.env.NODE_ENV = 'test';
}
