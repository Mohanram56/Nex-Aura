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
console.log('Adding referrerPolicy="no-referrer" to avatar img tags in:', srcDir);

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Replace avatar img tags to include referrerPolicy="no-referrer"
    content = content.replace(/<img([^>]*src={[^}]*avatarUrl[^}]*}[^>]*)\/>/g, (match) => {
      if (!match.includes('referrerPolicy')) {
        return match.replace('/>', ' referrerPolicy="no-referrer" />');
      }
      return match;
    });

    content = content.replace(/<img([^>]*src={[^}]*avatarUrl[^}]*}[^>]*)([^>]*[^/])>/g, (match) => {
      if (!match.includes('referrerPolicy')) {
        return match.replace('>', ' referrerPolicy="no-referrer">');
      }
      return match;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated referrerPolicy: ${filePath}`);
    }
  }
});

console.log('Referrer policy updates completed successfully!');
