const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:3190@localhost:5432/antiai?schema=public'
  });
  await client.connect();
  try {
    await client.query(`ALTER TYPE "ProofStatus" ADD VALUE 'pending'`);
    console.log('Added pending to ProofStatus');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
