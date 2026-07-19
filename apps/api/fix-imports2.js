const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const relToSrc = path.relative(path.dirname(fullPath), path.join(__dirname, 'src'));
      const depth = relToSrc ? relToSrc.split(path.sep).length : 0;
      let relativePath = '';
      if (depth === 0) {
          relativePath = './prisma/prisma.service';
      } else {
          const upDirs = Array(depth).fill('..').join('/');
          relativePath = upDirs + '/prisma/prisma.service';
      }

      const newContent = content.replace(/import\s+\{\s*PrismaService\s*\}\s+from\s+['"](?:\.\.\/)+prisma\/prisma\.service['"];?/g, 'import { PrismaService } from \'' + relativePath + '\';')
                                .replace(/import\s+\{\s*PrismaService\s*\}\s+from\s+['"]@antiai\/database['"];?/g, 'import { PrismaService } from \'' + relativePath + '\';');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Updated ' + fullPath + ' with ' + relativePath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
