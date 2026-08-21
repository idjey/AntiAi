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

  // Step 2: If P3009 (failed migrations), resolve them
  if (deployResult.error.includes('P3009') || deployResult.output.includes('P3009')) {
    console.log('[resolve-and-migrate] ⚠️  Found failed migrations (P3009). Resolving...');

    // Get all migration directory names
    const migrations = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => fs.statSync(path.join(MIGRATIONS_DIR, f)).isDirectory())
      .sort();

    console.log(`[resolve-and-migrate] Found ${migrations.length} migrations to resolve:`);
    migrations.forEach(m => console.log(`  - ${m}`));

    // First, roll back the failed migration to clear the failed state
    for (const migration of migrations) {
      console.log(`\n[resolve-and-migrate] Rolling back (if failed): ${migration}`);
      const rollbackResult = run(`${PRISMA} migrate resolve --rolled-back ${migration}`);
      if (rollbackResult.success) {
        console.log(`  ✅ Rolled back: ${migration}`);
      } else if (rollbackResult.error.includes('cannot be rolled back') || 
                 rollbackResult.error.includes('already applied')) {
        console.log(`  ℹ️  Already applied or not failed: ${migration}`);
      } else {
        console.log(`  ℹ️  Skipped (${rollbackResult.error.trim().split('\n')[0]})`);
      }
    }

    // Then mark all migrations as applied (since db push already created the tables)
    for (const migration of migrations) {
      console.log(`\n[resolve-and-migrate] Marking as applied: ${migration}`);
      const applyResult = run(`${PRISMA} migrate resolve --applied ${migration}`);
      if (applyResult.success) {
        console.log(`  ✅ Marked applied: ${migration}`);
      } else if (applyResult.error.includes('already') || applyResult.error.includes('has already been applied')) {
        console.log(`  ℹ️  Already marked as applied: ${migration}`);
      } else {
        console.log(`  ⚠️  Could not mark as applied: ${applyResult.error.trim().split('\n')[0]}`);
      }
    }

    // Step 3: Retry migrate deploy
    console.log('\n[resolve-and-migrate] Step 3: Retrying prisma migrate deploy...');
    const retryResult = run(`${PRISMA} migrate deploy`);
    if (retryResult.success) {
      console.log('[resolve-and-migrate] ✅ migrate deploy succeeded after resolving. Done!');
      return;
    }

    console.error('[resolve-and-migrate] ❌ migrate deploy still failed after resolving:');
    console.error(retryResult.error || retryResult.output);
    process.exit(1);
  }

  // Some other error
  console.error('[resolve-and-migrate] ❌ migrate deploy failed with unexpected error:');
  console.error(deployResult.error || deployResult.output);
  process.exit(1);
}

main().catch(err => {
  console.error('[resolve-and-migrate] Fatal error:', err);
  process.exit(1);
});
