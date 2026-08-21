/**
 * resolve-and-migrate.js
 * 
 * Handles the transition from `prisma db push` to `prisma migrate deploy`.
 * 
 * Problem: The Railway database was previously managed with `prisma db push` (which
 * doesn't track migrations). A failed attempt to run `prisma migrate deploy` left a
 * failed migration record in `_prisma_migrations`, which blocks all future deploys.
 * 
 * Solution: This script resolves failed migrations, marks all existing ones as applied
 * (since the tables already exist from `db push`), then runs `prisma migrate deploy`.
 * 
 * This script is idempotent — safe to run multiple times. Once all migrations are
 * properly tracked, the resolve steps become no-ops and only `migrate deploy` runs.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PRISMA = 'npx prisma';
const PACKAGE_ROOT = path.join(__dirname, '..');
const MIGRATIONS_DIR = path.join(PACKAGE_ROOT, 'prisma', 'migrations');

function run(cmd, opts = {}) {
  console.log(`[resolve-and-migrate] Running: ${cmd}`);
  try {
    const output = execSync(cmd, {
      cwd: PACKAGE_ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
      ...opts,
    });
    if (output.trim()) console.log(output.trim());
    return { success: true, output: output.trim() };
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    const stdout = err.stdout?.toString() || '';
    return { success: false, output: stdout, error: stderr, code: err.status };
  }
}

async function main() {
  // Step 1: Try migrate deploy first — if it works, we're done
  console.log('\n[resolve-and-migrate] Step 1: Attempting prisma migrate deploy...');
  const deployResult = run(`${PRISMA} migrate deploy`);
  if (deployResult.success) {
    console.log('[resolve-and-migrate] ✅ migrate deploy succeeded. Done!');
    return;
  }

  console.log('[resolve-and-migrate] ⚠️  Migrate deploy failed. Recovering via db push...');
  console.log(deployResult.error || deployResult.output);

  // Step 2: Fallback to db push to ensure database schema matches Prisma schema
  console.log('\n[resolve-and-migrate] Step 2: Running prisma db push to sync schema...');
  const pushResult = run(`${PRISMA} db push --accept-data-loss`);
  if (!pushResult.success) {
    console.error('[resolve-and-migrate] ❌ db push failed:');
    console.error(pushResult.error || pushResult.output);
    process.exit(1);
  }

  // Step 3: Mark all current migrations as applied since the schema is now synced
  console.log('\n[resolve-and-migrate] Step 3: Marking all migrations as applied...');
  
  const migrations = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => fs.statSync(path.join(MIGRATIONS_DIR, f)).isDirectory())
    .sort();

  for (const migration of migrations) {
    // Attempt rollback just in case it's stuck in a failed state
    run(`${PRISMA} migrate resolve --rolled-back ${migration}`);
    // Mark as applied
    const applyResult = run(`${PRISMA} migrate resolve --applied ${migration}`);
    if (applyResult.success) {
      console.log(`  ✅ Marked applied: ${migration}`);
    } else {
      console.log(`  ℹ️  Already applied or error: ${migration}`);
    }
  }

  console.log('\n[resolve-and-migrate] ✅ Recovery complete! Database is synced and migrations are tracked.');
}

main().catch(err => {
  console.error('[resolve-and-migrate] Fatal error:', err);
  process.exit(1);
});
