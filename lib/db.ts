import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "./env";

// Prisma 7 uses pg's pool defaults: no connection timeout, and idle
// connections closed after 10 seconds.
const POOL_SETTINGS = {
  // A stalled connection (e.g. while Neon wakes up) fails instead of hanging.
  connectionTimeoutMillis: 10_000,
  // Neon suspends after 5 minutes idle and closes every connection, so
  // keeping them longer gains nothing.
  idleTimeoutMillis: 4 * 60_000,
  // Detects connections that died while the server was idle.
  keepAlive: true,
};

// One client per server process; each client holds its own connection pool.
// Kept on globalThis so dev hot reloads don't open a new pool every time.
const globalForPrisma = globalThis as { prisma?: PrismaClient };

export function db(): PrismaClient {
  globalForPrisma.prisma ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: serverEnv().DATABASE_URL,
      ...POOL_SETTINGS,
    }),
  });
  return globalForPrisma.prisma;
}
