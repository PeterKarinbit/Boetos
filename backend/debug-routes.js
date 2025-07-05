const fs = require('fs');
const path = require('path');

// List of all route files to test
const routeFiles = [
  'auth.ts',
  'googleAuth.ts', 
  'calendar.ts',
  'activity.ts',
  'meetings.ts',
  'voice.ts',
  'voice-assistant.ts',
  'user.ts',
  'burnout.ts',
  'mentalHealth.ts',
  'memory.ts',
  'sidekick.ts',
  'notifications.ts'
];

// List of middleware files to test
const middlewareFiles = [
  'authMiddleware.ts',
  'auth.ts'
];

console.log('🔍 Debugging route and middleware files...\n');

// Test route files
console.log('📁 Testing route files:');
for (const file of routeFiles) {
  const filePath = path.join(__dirname, 'src', 'routes', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has proper export
    if (!content.includes('export default router')) {
      console.log(`❌ ${file}: Missing 'export default router'`);
    } else if (content.includes('// ... (convert the rest of the file')) {
      console.log(`❌ ${file}: Contains placeholder comment instead of actual routes`);
    } else {
      console.log(`✅ ${file}: Looks good`);
    }
  } else {
    console.log(`❌ ${file}: File not found`);
  }
}

console.log('\n🔧 Testing middleware files:');
for (const file of middlewareFiles) {
  const filePath = path.join(__dirname, 'src', 'middleware', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has proper export
    if (!content.includes('export default')) {
      console.log(`❌ ${file}: Missing 'export default'`);
    } else if (content.includes('// ... (copy the logic from the original JS file')) {
      console.log(`❌ ${file}: Contains placeholder comment instead of actual middleware`);
    } else {
      console.log(`✅ ${file}: Looks good`);
    }
  } else {
    console.log(`❌ ${file}: File not found`);
  }
}

console.log('\n🔍 Checking compiled output...');
const distRoutesPath = path.join(__dirname, 'dist', 'routes');
const distMiddlewarePath = path.join(__dirname, 'dist', 'middleware');

if (fs.existsSync(distRoutesPath)) {
  const distRouteFiles = fs.readdirSync(distRoutesPath);
  console.log(`📁 Compiled route files: ${distRouteFiles.join(', ')}`);
} else {
  console.log('❌ dist/routes directory not found');
}

if (fs.existsSync(distMiddlewarePath)) {
  const distMiddlewareFiles = fs.readdirSync(distMiddlewarePath);
  console.log(`🔧 Compiled middleware files: ${distMiddlewareFiles.join(', ')}`);
} else {
  console.log('❌ dist/middleware directory not found');
}

console.log('\n🎯 Next steps:');
console.log('1. Fix any files marked with ❌');
console.log('2. Run: npm run build');
console.log('3. Run: npm run start'); 