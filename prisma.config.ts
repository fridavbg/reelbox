import { defineConfig } from "prisma/config";

// The Prisma CLI doesn't load .env by itself. Load it when present; CI and
// Vercel set the variables directly.
try {
  process.loadEnvFile();
} catch {
  // No .env file.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations need a direct connection, not the pooled one the app uses.
    url: process.env.DATABASE_URL_UNPOOLED,
  },
});
