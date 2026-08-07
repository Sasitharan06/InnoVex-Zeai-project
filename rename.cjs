const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && !['node_modules', '.git', '.gemini', 'dist'].includes(f)) {
      walkDir(dirPath, callback);
    } else if (!isDirectory) {
      callback(path.join(dir, f));
    }
  });
}

function processFile(filePath) {
  const ext = path.extname(filePath);
  if (!['.js', '.jsx', '.css', '.html', '.json', '.md'].includes(ext)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  // Replace VirtuLab -> StepIn
  newContent = newContent.replace(/VirtuLab/g, 'StepIn');
  // Replace virtulab -> stepin
  newContent = newContent.replace(/virtulab/g, 'stepin');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated: ${filePath}`);
  }
}

walkDir(__dirname, processFile);
console.log('Renaming complete.');
