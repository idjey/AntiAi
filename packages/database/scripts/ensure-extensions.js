/**
 * ensure-extensions.js
 * 
 * Attempts to run CREATE EXTENSION IF NOT EXISTS for required Postgres
 * extensions before prisma db push. This is a best-effort script:
 * - If DATABASE_URL is not set, skip gracefully.
 * - If the `pg` module is not installed, skip gracefully.
 * - If the DB connection or CREATE EXTENSION fails (e.g. permissions),
 *   log a warning but DO NOT block deployment (exit 0).
 * 
 * Prisma's `extensions = [citext]` in schema.prisma may handle extension
 * creation on its own in many cases.
 */

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log('[ensure-extensions] DATABASE_URL is not set. Skipping extension check.');
    process.exit(0);
  }

  let Client;
  try {
    ({ Client } = require('pg'));
  } catch (err) {
    console.warn('[ensure-extensions] WARNING: "pg" module not found. Skipping extension check.');
    console.warn('[ensure-extensions] Prisma will attempt to create extensions via schema push.');
    process.exit(0);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway.internal') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('[ensure-extensions] Connected to database. Ensuring extensions exist...');
    await client.query('CREATE EXTENSION IF NOT EXISTS citext;');
    console.log('[ensure-extensions] Successfully verified/created citext extension.');
  } catch (error) {
    // Non-fatal: log the error but don't block deployment
    console.warn('[ensure-extensions] WARNING: Could not create extensions:', error.message);
    console.warn('[ensure-extensions] Continuing anyway — Prisma may handle this during db push.');
  } finally {
    try {
      await client.end();
    } catch (_) {
      // ignore close errors
    }
  }
}

run();
