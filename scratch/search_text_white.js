const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const srcDir = path.join(__dirname, '..', 'src');
console.log('Scanning src directory:', srcDir);

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx')) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('text-white')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('text-white') && !line.includes('bg-indigo') && !line.includes('bg-emerald') && !line.includes('bg-red') && !line.includes('bg-gradient') && !line.includes('hover:text-white') && !line.includes('group-hover:text-white') && !line.includes('activeNavIndicator')) {
          console.log(`${filePath}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
});
