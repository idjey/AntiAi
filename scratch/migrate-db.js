const { execSync } = require('child_process');
require('dotenv').config();

async function run() {
  const source = process.env.SOURCE_DB_URL;
  const dest = process.env.DEST_DB_URL;

  if (!source || !dest) {
    console.error("Missing SOURCE_DB_URL or DEST_DB_URL");
    process.exit(1);
  }

  let srcUrl;
  try {
    srcUrl = new URL(source);
  } catch (e) {
    console.error("Invalid SOURCE_DB_URL format");
    process.exit(1);
  }

  const srcUser = decodeURIComponent(srcUrl.username);
  const srcPass = decodeURIComponent(srcUrl.password);
  const srcHost = srcUrl.hostname;
  const srcPort = srcUrl.port || 5432;
  const srcDb = srcUrl.pathname.replace('/', '');

  const pwd = process.cwd();

  console.log(`Connecting to ${srcHost} as user ${srcUser}...`);
  console.log("Creating backup from Supabase...");
  try {
    const env = { ...process.env, PGPASSWORD: srcPass };
    execSync(`docker run --rm -v "${pwd}:/workspace" -w /workspace -e PGPASSWORD="${srcPass}" postgres pg_dump -h ${srcHost} -p ${srcPort} -U ${srcUser} -d ${srcDb} -x -O --clean --if-exists --no-owner --no-privileges -f supabase_backup.sql`, { stdio: 'inherit', env });
    console.log("✅ Backup created: supabase_backup.sql");
  } catch (err) {
    console.error("❌ Failed to create backup.");
    process.exit(1);
  }

  console.log("Restoring backup to Railway...");
  try {
    execSync(`docker run --rm -v "${pwd}:/workspace" -w /workspace postgres psql "${dest}" -f supabase_backup.sql`, { stdio: 'inherit' });
    console.log("✅ Restore complete.");
  } catch (err) {
    console.error("❌ Failed to restore backup.");
    process.exit(1);
  }
}

run();
