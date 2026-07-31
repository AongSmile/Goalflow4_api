// Prisma 7 CLI configuration (db push / migrate / studio / seed).
//
// This is only read by the `prisma` CLI, not by the app at runtime - the
// app's own PrismaClient gets its connection string separately, via a
// driver adapter in src/config/prisma.ts.
//
// File extension is .mjs (not .ts) because the Prisma CLI loads this file
// directly (not through the project's own tsc build) - .mjs needs no
// transpilation and works regardless of the rest of the project being
// TypeScript/ESM.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // prisma/seed.ts is TypeScript - tsx runs it directly with no separate
    // build step needed (it's a one-off dev script, not part of the
    // compiled server in dist/).
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Supabase gives you two connection strings:
    //   DATABASE_URL - pooled (pgbouncer), used by the app at runtime
    //   DIRECT_URL   - direct, required for schema changes (db push / migrate)
    // The Prisma CLI needs the DIRECT one here.
    url: env("DIRECT_URL"),
  },
});
