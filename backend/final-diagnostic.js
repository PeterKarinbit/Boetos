const fs = require('fs');
const path = require('path');

console.log('🔍 Final diagnostic - finding the exact source of the middleware error...\n');

// Test 1: Check if the issue is in the basic Express setup
console.log('Test 1: Basic Express setup');
const basicExpressTest = `
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Basic Express works' });
});

app.listen(4004, () => {
  console.log('Basic Express test passed');
  process.exit(0);
});`;

fs.writeFileSync('basic-test.js', basicExpressTest);
try {
  const { execSync } = require('child_process');
  execSync('node basic-test.js', { stdio: 'pipe', timeout: 5000 });
  console.log('✅ Basic Express works');
} catch (error) {
  console.log(`❌ Basic Express failed: ${error.message}`);
}

// Test 2: Check if the issue is in the compiled app.js
console.log('\nTest 2: Compiled app.js');
const appJsPath = path.join(__dirname, 'dist', 'app.js');
if (fs.existsSync(appJsPath)) {
  try {
    const app = require(appJsPath);
    console.log('✅ app.js can be required');
  } catch (error) {
    console.log(`❌ app.js failed to require: ${error.message}`);
  }
} else {
  console.log('❌ app.js not found');
}

// Test 3: Check if the issue is in the compiled index.js
console.log('\nTest 3: Compiled index.js');
const indexJsPath = path.join(__dirname, 'dist', 'index.js');
if (fs.existsSync(indexJsPath)) {
  const indexContent = fs.readFileSync(indexJsPath, 'utf8');
  
  // Look for any app.use() calls in index.js
  const useMatches = indexContent.match(/app\.use\(/g);
  if (useMatches) {
    console.log(`⚠️  Found ${useMatches.length} app.use() calls in index.js`);
  } else {
    console.log('✅ No app.use() calls in index.js');
  }
  
  // Look for any route imports in index.js
  const routeImports = indexContent.match(/require\(['"]\.\/routes\//g);
  if (routeImports) {
    console.log(`⚠️  Found ${routeImports.length} route imports in index.js`);
  } else {
    console.log('✅ No route imports in index.js');
  }
} else {
  console.log('❌ index.js not found');
}

// Test 4: Check if the issue is in environment variables
console.log('\nTest 4: Environment variables');
const requiredEnvVars = ['SESSION_SECRET', 'FRONTEND_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.log(`⚠️  Missing environment variable: ${envVar}`);
  } else {
    console.log(`✅ Environment variable ${envVar} is set`);
  }
}

// Test 5: Check if the issue is in the data-source initialization
console.log('\nTest 5: Data source initialization');
const dataSourcePath = path.join(__dirname, 'dist', 'data-source.js');
if (fs.existsSync(dataSourcePath)) {
  try {
    const dataSource = require(dataSourcePath);
    console.log('✅ data-source.js can be required');
  } catch (error) {
    console.log(`❌ data-source.js failed to require: ${error.message}`);
  }
} else {
  console.log('❌ data-source.js not found');
}

// Test 6: Create a minimal working version
console.log('\nTest 6: Creating minimal working version');
const minimalWorkingApp = `
const express = require('express');
const app = express();

// Only basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Minimal working app' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(4005, () => {
  console.log('Minimal working app started on port 4005');
  console.log('✅ SUCCESS: The issue is in the route/middleware imports');
  process.exit(0);
});`;

fs.writeFileSync('minimal-working.js', minimalWorkingApp);
try {
  const { execSync } = require('child_process');
  execSync('node minimal-working.js', { stdio: 'pipe', timeout: 5000 });
  console.log('✅ Minimal working app succeeded');
} catch (error) {
  console.log(`❌ Minimal working app failed: ${error.message}`);
}

// Clean up
['basic-test.js', 'minimal-working.js'].forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
});

console.log('\n🎯 Summary:');
console.log('If the minimal working app succeeds, the issue is in the route/middleware imports.');
console.log('If it fails, there is a deeper issue with the Express setup or environment.'); 