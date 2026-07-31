import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires a driver adapter for a direct (non-Accelerate) database
// connection - see https://pris.ly/d/client-constructor. This uses the
// pooled connection string (DATABASE_URL); prisma.config.mjs uses the
// direct one (DIRECT_URL) separately, for CLI commands like `db push`.
//
// Supabase requires SSL; node-postgres needs `rejectUnauthorized: false`
// for Supabase's certificate chain (see server/README.md if you hit
// "self-signed certificate" or P1010 errors here).
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Reuse a single PrismaClient instance across the app (and across hot
// reloads in dev) to avoid exhausting the DB connection pool.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export default prisma;
