/**
 * Script to remove console.log, console.info, console.debug statements
 * Only keeps console.warn and console.error
 * 
 * Usage: node scripts/remove-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '../src');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function removeConsoleLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Remove console.log, console.info, console.debug
  // Keep console.warn and console.error
  const patterns = [
    // Single line console.log/info/debug
    /^\s*console\.(log|info|debug)\([^;]*\);?\s*$/gm,
    // Multi-line console.log/info/debug
    /^\s*console\.(log|info|debug)\([^)]*\);?\s*$/gm,
  ];

  patterns.forEach((pattern) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      modified = true;
    }
  });

  // More aggressive: remove console.log/info/debug with any content
  const lines = content.split('\n');
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    // Keep lines that don't have console.log/info/debug
    if (!trimmed.match(/console\.(log|info|debug)\(/)) {
      return true;
    }
    // If it's a console.log/info/debug, remove it
    modified = true;
    return false;
  });

  if (modified) {
    fs.writeFileSync(filePath, filteredLines.join('\n'), 'utf8');
    console.warn(`✅ Cleaned: ${filePath}`);
    return true;
  }

  return false;
}

// Main execution
const files = getAllFiles(srcDir);
let cleanedCount = 0;

files.forEach((file) => {
  if (removeConsoleLogs(file)) {
    cleanedCount++;
  }
});

console.warn(`\n✅ Cleaned ${cleanedCount} files`);
console.warn('⚠️  Please review changes and test your application');
