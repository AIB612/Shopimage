import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("[DATABASE] FATAL ERROR: DATABASE_URL environment variable is NOT set!");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy",
});

// Avoid crashing at top level if connection fails immediately
pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected error on idle client', err.message);
});

export const db = drizzle(pool, { schema });
