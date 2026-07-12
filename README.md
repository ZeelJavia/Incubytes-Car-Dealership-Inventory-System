# Car Dealership Inventory System

A full-stack Car Dealership Inventory System built with a REST API, PostgreSQL, JWT authentication, and a React SPA.

## Tech Stack

### Backend
- **Framework**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (`jsonwebtoken`) + `bcrypt` for password hashing
- **Testing**: Jest + Supertest
- **Validation**: Zod

### Frontend
- **Framework**: React (Bootstrapped with Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack Query (React Query)
- **Testing**: Vitest + React Testing Library + MSW (mock API)

---

## Features

### Authentication & Authorization
- User Registration and Login.
- Role-based Access Control (Roles: `USER`, `ADMIN`).
- JWT-based authentication middleware to protect routes.

### Inventory Management
- **List Vehicles**: View all vehicles with pagination.
- **Search & Filter**: Find vehicles by make, model, category, and price range.
- **Purchase Vehicle**: Buy a vehicle, updating inventory quantities safely.
- **Admin Tools**:
  - Add new vehicles to the inventory.
  - Update vehicle details.
  - Delete vehicles.
  - Restock vehicles (increment stock quantities).

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### 1. Database Setup
Create a PostgreSQL database for the project (and optionally a separate one for tests). 
Update the `DATABASE_URL` in your `.env` file (see below).

### 2. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/car_dealership"
JWT_SECRET="your_super_secret_jwt_key"
PORT=3000
```

Run database migrations to create the schema:
```bash
npm run db:migrate
```

Start the development server:
```bash
npm run dev
```

### 3. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory (if needed):
```env
VITE_API_URL="http://localhost:3000/api"
```

Start the development server:
```bash
npm run dev
```

---

## Testing

The project is built using Test-Driven Development (TDD).

### Run Backend Tests
```bash
cd backend
npm test
# To see coverage:
npm run test:coverage
```
*Note: Make sure your `.env.test` is configured properly before running backend tests to use a dedicated test database.*

### Run Frontend Tests
```bash
cd frontend
npm test
# To see coverage:
npm run test:coverage
```

## API Testing
Included in the root directory:
- `api_tests.http`: Standard HTTP requests for testing endpoints (compatible with REST Client extensions).
- `car_dealership.postman_collection.json`: Postman collection for easier visual testing.
