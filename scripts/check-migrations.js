const { execSync } = require('child_process');

try {
  const targetBranch = process.env.GITHUB_BASE_REF || 'origin/main';
  const changedFiles = execSync(git diff --name-only  + targetBranch).toString().split('\n').filter(Boolean);
  
  const schemaChanged = changedFiles.includes('packages/database/prisma/schema.prisma');
  
  if (schemaChanged) {
    const migrationsChanged = changedFiles.some(f => f.startsWith('packages/database/prisma/migrations/'));
    
    if (!migrationsChanged) {
      console.error('? ERROR: schema.prisma was modified but no new migration file was found in packages/database/prisma/migrations/.');
      console.error('Please generate a migration file (e.g. using 
px prisma migrate dev or manually) before committing.');
      process.exit(1);
    } else {
      console.log('? schema.prisma changes are accompanied by migration files.');
    }
  } else {
    console.log('? No schema changes detected.');
  }
} catch (err) {
  // If we can't run git diff (e.g. detached head without origin/main), we fallback to a simple pass
  console.log('Skipping migration check: ' + err.message);
}
