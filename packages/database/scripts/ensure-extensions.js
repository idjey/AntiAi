const { Client } = require('pg');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log('[ensure-extensions] DATABASE_URL is not set. Skipping extension check.');
    process.exit(0);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway.internal') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('[ensure-extensions] Connected to database.');

    // Log connection info for debugging
    const dbInfo = await client.query('SELECT current_database(), current_schema(), current_user');
    console.log(`[ensure-extensions] Database: ${dbInfo.rows[0].current_database}, Schema: ${dbInfo.rows[0].current_schema}, User: ${dbInfo.rows[0].current_user}`);

    // Create the extension explicitly in the public schema
    await client.query('CREATE EXTENSION IF NOT EXISTS "citext" SCHEMA public;');
    console.log('[ensure-extensions] Ran CREATE EXTENSION IF NOT EXISTS citext SCHEMA public.');

    // VERIFY the extension actually exists
    const extCheck = await client.query("SELECT extname, extnamespace::regnamespace as schema FROM pg_extension WHERE extname = 'citext'");
    if (extCheck.rows.length === 0) {
      console.error('[ensure-extensions] CRITICAL: citext extension not found in pg_extension after CREATE EXTENSION succeeded!');
      console.error('[ensure-extensions] This likely means the database user lacks CREATE privileges.');
      process.exit(1);
    }
    console.log(`[ensure-extensions] Verified: citext extension exists in schema "${extCheck.rows[0].schema}".`);

    // VERIFY the citext type is actually usable
    const typeCheck = await client.query("SELECT typname FROM pg_type WHERE typname = 'citext'");
    if (typeCheck.rows.length === 0) {
      console.error('[ensure-extensions] CRITICAL: citext type not found in pg_type even though extension exists!');
      process.exit(1);
    }
    console.log('[ensure-extensions] Verified: citext type is available.');

  } catch (error) {
    console.error('[ensure-extensions] Failed:', error.message);
    // Exit non-zero so the deploy fails visibly rather than silently
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
