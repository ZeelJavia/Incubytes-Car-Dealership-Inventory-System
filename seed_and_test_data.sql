-- ============================================================
-- Car Dealership Inventory System — PostgreSQL Test Data
-- ============================================================
-- Run against: car_dealership  (dev)  or  car_dealership_test  (test)
-- ============================================================

-- ────────────────────────────────────────────
-- STEP 0 — Clean slate (safe for re-running)
-- ────────────────────────────────────────────
TRUNCATE "Vehicle", "User" RESTART IDENTITY CASCADE;

-- ────────────────────────────────────────────
-- STEP 1 — Users
-- Passwords are bcrypt-hashed "Password123"
-- (bcrypt hash generated with 10 salt rounds)
-- ────────────────────────────────────────────
INSERT INTO "User" (id, name, email, "passwordHash", role, "createdAt")
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Alice Smith',
    'alice@example.com',
    '$2b$10$CwTycUXWue0Thq9StjUM0uJ8v/VmR7yMmTklCz7znNBX.kJzBPmA6', -- Password123
    'USER',
    NOW() - INTERVAL '7 days'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Admin User',
    'admin@example.com',
    '$2b$10$CwTycUXWue0Thq9StjUM0uJ8v/VmR7yMmTklCz7znNBX.kJzBPmA6', -- Password123
    'ADMIN',
    NOW() - INTERVAL '7 days'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Bob Jones',
    'bob@example.com',
    '$2b$10$CwTycUXWue0Thq9StjUM0uJ8v/VmR7yMmTklCz7znNBX.kJzBPmA6', -- Password123
    'USER',
    NOW() - INTERVAL '3 days'
  );

-- ────────────────────────────────────────────
-- STEP 2 — Vehicles (covers all categories
--          and a range of prices + quantities)
-- ────────────────────────────────────────────
INSERT INTO "Vehicle" (id, make, model, category, price, quantity, "createdAt", "updatedAt")
VALUES
  -- In-stock Sedans
  ('11111111-1111-1111-1111-111111111111', 'Toyota', 'Camry',     'Sedan', 25000.00, 10, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Toyota', 'Corolla',   'Sedan', 20000.00,  3, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Honda',  'Civic',     'Sedan', 22000.00,  5, NOW(), NOW()),

  -- SUVs
  ('44444444-4444-4444-4444-444444444444', 'Honda',  'CR-V',      'SUV',   35000.00,  2, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'BMW',    'X5',        'SUV',   65000.00,  1, NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'Ford',   'Explorer',  'SUV',   42000.00,  7, NOW(), NOW()),

  -- Trucks
  ('77777777-7777-7777-7777-777777777777', 'Ford',   'F-150',     'Truck', 45000.00,  8, NOW(), NOW()),
  ('88888888-8888-8888-8888-888888888888', 'Toyota', 'Tacoma',    'Truck', 38000.00,  4, NOW(), NOW()),

  -- Out-of-stock (quantity = 0) — edge case for purchase tests
  ('99999999-9999-9999-9999-999999999999', 'BMW',    'M3',        'Sedan', 75000.00,  0, NOW(), NOW()),

  -- Single-unit — edge case for race-condition purchase test
  ('aaaaaaaa-1111-1111-1111-111111111111', 'Porsche','911',       'Coupe', 99000.00,  1, NOW(), NOW()),

  -- High-price luxury
  ('bbbbbbbb-2222-2222-2222-222222222222', 'Rolls-Royce','Phantom','Sedan',450000.00, 2, NOW(), NOW());


-- ────────────────────────────────────────────
-- STEP 3 — Verification queries
--           (run these to confirm seed worked)
-- ────────────────────────────────────────────
SELECT id, name, email, role FROM "User";
SELECT id, make, model, category, price, quantity FROM "Vehicle" ORDER BY price;


-- ============================================================
-- EDGE-CASE QUERY TESTS (run after seeding)
-- ============================================================

-- [F6] List all vehicles
SELECT * FROM "Vehicle" ORDER BY "createdAt" DESC;

-- [F7-1] Filter by make (case-insensitive)
SELECT * FROM "Vehicle" WHERE LOWER(make) LIKE LOWER('%toyota%');

-- [F7-2] Filter by category
SELECT * FROM "Vehicle" WHERE category = 'Sedan';

-- [F7-3] Filter by price range
SELECT * FROM "Vehicle" WHERE price >= 20000 AND price <= 35000;

-- [F7-4] Multi-filter: make + category + minPrice
SELECT * FROM "Vehicle"
WHERE LOWER(make) LIKE LOWER('%toyota%')
  AND category = 'Sedan'
  AND price >= 22000;

-- [F7-5] No matches → empty result (not error)
SELECT * FROM "Vehicle" WHERE LOWER(make) LIKE LOWER('%lamborghini%');

-- [F10] Purchase simulation — decrement safely
-- Only decrement if quantity > 0 (atomic, prevents negative)
UPDATE "Vehicle"
SET quantity = quantity - 1,
    "updatedAt" = NOW()
WHERE id = '11111111-1111-1111-1111-111111111111'
  AND quantity > 0
RETURNING id, make, model, quantity;

-- [F10-edge] Attempt to purchase out-of-stock vehicle
-- This returns 0 rows (not an error) — app layer should convert to 409
UPDATE "Vehicle"
SET quantity = quantity - 1
WHERE id = '99999999-9999-9999-9999-999999999999'
  AND quantity > 0
RETURNING id, make, model, quantity;

-- [F11] Restock — increment quantity
UPDATE "Vehicle"
SET quantity = quantity + 5,
    "updatedAt" = NOW()
WHERE id = '99999999-9999-9999-9999-999999999999'
RETURNING id, make, model, quantity;

-- [F8] Partial update (price only)
UPDATE "Vehicle"
SET price = 26500,
    "updatedAt" = NOW()
WHERE id = '11111111-1111-1111-1111-111111111111'
RETURNING *;

-- [F9] Delete
DELETE FROM "Vehicle"
WHERE id = 'bbbbbbbb-2222-2222-2222-222222222222'
RETURNING id, make, model;

-- Verify delete — should return 0 rows
SELECT * FROM "Vehicle" WHERE id = 'bbbbbbbb-2222-2222-2222-222222222222';

-- [F12] Error scenario check — lookup non-existent id
SELECT * FROM "Vehicle" WHERE id = '00000000-0000-0000-0000-000000000000';
-- Expected: 0 rows → app layer returns 404

-- [Password verification — manual check]
-- The hash below maps to "Password123" (10 salt rounds)
-- SELECT crypt('Password123', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8v/') = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8v/VmR7yMmTklCz7znNBX.kJzBPmA6';
