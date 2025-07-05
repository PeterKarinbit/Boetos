const fs = require('fs');
const path = require('path');

console.log('🔍 Testing the actual compiled app.js file...\n');

// Read the compiled app.js
const appJsPath = path.join(__dirname, 'dist', 'app.js');
if (!fs.existsSync(appJsPath)) {
  console.log('❌ dist/app.js not found. Run npm run build first.');
  process.exit(1);
}

const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Look for app.use() calls
const useMatches = appJsContent.match(/app\.use\([^)]+\)/g);
if (useMatches) {
  console.log('Found app.use() calls:');
  useMatches.forEach((match, index) => {
    console.log(`${index + 1}. ${match}`);
  });
} else {
  console.log('No app.use() calls found');
}

// Look for middleware imports
const importMatches = appJsContent.match(/const \w+ = __importDefault\(require\([^)]+\)\)/g);
if (importMatches) {
  console.log('\nFound imports:');
  importMatches.forEach((match, index) => {
    console.log(`${index + 1}. ${match}`);
  });
} else {
  console.log('No imports found');
}

// Create a minimal test that mimics the actual app structure
console.log('\n🔍 Creating minimal test app...');

const createMinimalTestApp = () => {
  return `const express = require('express');
const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Minimal test app' });
});

app.listen(4003, () => {
  console.log('Minimal test server running on port 4003');
  process.exit(0);
});`;
};

// Test minimal app first
fs.writeFileSync('minimal-test.js', createMinimalTestApp());
try {
  const { execSync } = require('child_process');
  execSync('node minimal-test.js', { stdio: 'pipe', timeout: 5000 });
  console.log('✅ Minimal app works');
} catch (error) {
  console.log(`❌ Minimal app failed: ${error.message}`);
}

// Clean up
if (fs.existsSync('minimal-test.js')) {
  fs.unlinkSync('minimal-test.js');
}

console.log('\n🎯 The issue might be in the app structure or environment variables.'); 