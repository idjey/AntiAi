const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:xyomczEMEONCxhLLwymGULMXUEUAWdQH@tokaido.proxy.rlwy.net:13431/railway?schema=public",
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    console.log("Connected successfully with pg and ssl!");
    const res = await client.query('SELECT 1 as num');
    console.log(res.rows);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

main();
