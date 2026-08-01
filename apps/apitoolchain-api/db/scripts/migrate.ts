import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config } from "../../config";

/** Minimal forward-only migration runner (tracks applied files in a ledger). */
const dir = join(fileURLToPath(new URL("..", import.meta.url)), "migrations");
const pool = new pg.Pool({ connectionString: config.databaseUrl });

await pool.query(
  `CREATE TABLE IF NOT EXISTS platform_migrations (
     version text PRIMARY KEY,
     applied_at timestamptz NOT NULL DEFAULT now()
   )`,
);

const applied = new Set(
  (await pool.query("SELECT version FROM platform_migrations")).rows.map(
    (r) => r.version as string,
  ),
);

const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const f of files) {
  if (applied.has(f)) {
    console.log(`[migrate] skip ${f}`);
    continue;
  }
  const sql = readFileSync(join(dir, f), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      "INSERT INTO platform_migrations (version) VALUES ($1)",
      [f],
    );
    await client.query("COMMIT");
    console.log(`[migrate] applied ${f}`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

await pool.end();
console.log("[migrate] done");
