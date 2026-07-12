// Global teardown: close prisma connection
export default async function globalTeardown() {
  // Prisma connections are closed per-test via the shared client
}
