import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("[DATABASE] FATAL ERROR: DATABASE_URL environment variable is NOT set!");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection and log errors gracefully
pool.on('error', (err) => {
  console.error("[DATABASE] Unexpected error on idle client:", err.message);
});

export const db = drizzle(pool, { schema });
console.log("[DATABASE] Drizzle instance initialized.");
