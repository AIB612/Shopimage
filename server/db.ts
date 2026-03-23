import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("[DATABASE] FATAL ERROR: DATABASE_URL is not set in Environment Variables!");
}

const pool = new pg.Pool({
  connectionString: dbUrl || "postgres://dummy:dummy@localhost:5432/dummy",
});

pool.on('error', (err) => {
  console.error("[DATABASE] Pool Error:", err.message);
});

export const db = drizzle(pool, { schema });
console.log("[DATABASE] Connection pool created.");
