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
      
      const depth = path.relative(path.dirname(fullPath), path.join(__dirname, 'src')).split(path.sep).length;
      let relativePath = '';
      if (path.dirname(fullPath) === path.join(__dirname, 'src')) {
          relativePath = './prisma/prisma.service';
      } else {
          const upDirs = Array(depth - 1).fill('..').join('/');
          relativePath = upDirs ? upDirs + '/prisma/prisma.service' : './prisma/prisma.service';
      }

      const newContent = content.replace(/import\s+\{\s*PrismaService\s*\}\s+from\s+['"]@antiai\/database['"];?/g, 'import { PrismaService } from \'' + relativePath + '\';');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Updated ' + fullPath + ' with ' + relativePath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
