const { Client } = require('pg');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Skipping extension check.');
    process.exit(0);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway.internal') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database. Ensuring extensions exist...');
    await client.query('CREATE EXTENSION IF NOT EXISTS citext;');
    console.log('Successfully verified/created citext extension.');
  } catch (error) {
    console.error('Failed to create extensions:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
