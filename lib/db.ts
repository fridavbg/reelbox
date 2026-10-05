import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "./env";

// One client per server process; each client holds its own connection pool.
// Kept on globalThis so dev hot reloads don't open a new pool every time.
const globalForPrisma = globalThis as { prisma?: PrismaClient };

export function db(): PrismaClient {
  globalForPrisma.prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: serverEnv().DATABASE_URL }),
  });
  return globalForPrisma.prisma;
}
