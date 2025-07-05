const fs = require('fs');
const path = require('path');

console.log('🔍 Testing imports one by one to find the problematic file...\n');

// Create a minimal test app
const createTestApp = (imports) => {
  return `const express = require('express');
const app = express();

${imports.map(imp => `const ${imp.name} = require('${imp.path}');`).join('\n')}

app.get('/', (req, res) => {
  res.json({ message: 'Test app' });
});

app.listen(4002, () => {
  console.log('Test server running on port 4002');
});`;
};

// Test each import individually
const imports = [
  { name: 'authRouter', path: './dist/routes/auth' },
  { name: 'googleAuthRoutes', path: './dist/routes/googleAuth' },
  { name: 'calendarRoutes', path: './dist/routes/calendar' },
  { name: 'activityRoutes', path: './dist/routes/activity' },
  { name: 'meetingsRoutes', path: './dist/routes/meetings' },
  { name: 'voiceRoutes', path: './dist/routes/voice' },
  { name: 'voiceAssistantRoutes', path: './dist/routes/voice-assistant' },
  { name: 'userRoutes', path: './dist/routes/user' },
  { name: 'burnoutRoutes', path: './dist/routes/burnout' },
  { name: 'mentalHealthRoutes', path: './dist/routes/mentalHealth' },
  { name: 'memoryRoutes', path: './dist/routes/memory' },
  { name: 'sidekickRoutes', path: './dist/routes/sidekick' },
  { name: 'notificationsRoutes', path: './dist/routes/notifications' },
  { name: 'authMiddleware', path: './dist/middleware/authMiddleware' },
  { name: 'auth', path: './dist/middleware/auth' }
];

for (let i = 0; i < imports.length; i++) {
  const importToTest = imports[i];
  console.log(`Testing ${importToTest.name} from ${importToTest.path}...`);
  
  // Create test app with just this import
  const testApp = createTestApp([importToTest]);
  fs.writeFileSync('test-app.js', testApp);
  
  try {
    // Try to require the module
    const modulePath = path.resolve(importToTest.path);
    const module = require(modulePath);
    
    // Check if it's a function (middleware) or has a default export
    if (typeof module === 'function') {
      console.log(`✅ ${importToTest.name}: Function middleware`);
    } else if (module && typeof module.default === 'function') {
      console.log(`✅ ${importToTest.name}: Default export function`);
    } else if (module && typeof module === 'object') {
      console.log(`⚠️  ${importToTest.name}: Object (might be router)`);
    } else {
      console.log(`❌ ${importToTest.name}: Invalid export type`);
    }
  } catch (error) {
    console.log(`❌ ${importToTest.name}: Error - ${error.message}`);
  }
}

// Clean up
if (fs.existsSync('test-app.js')) {
  fs.unlinkSync('test-app.js');
}

console.log('\n🎯 Check the output above to identify problematic imports.'); 