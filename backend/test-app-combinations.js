const fs = require('fs');
const path = require('path');

console.log('🔍 Testing app with different import combinations...\n');

// Create a test app with specific imports
const createTestApp = (imports) => {
  return `const express = require('express');
const app = express();

${imports.map(imp => `const ${imp.name} = require('${imp.path}');`).join('\n')}

// Test using each import as middleware
${imports.map(imp => `app.use('/test-${imp.name}', ${imp.name}.default || ${imp.name});`).join('\n')}

app.get('/', (req, res) => {
  res.json({ message: 'Test app working' });
});

app.listen(4002, () => {
  console.log('Test server running on port 4002');
  process.exit(0);
});`;
};

// Test combinations
const testCombinations = [
  ['authRouter'],
  ['googleAuthRoutes'],
  ['calendarRoutes'],
  ['activityRoutes'],
  ['meetingsRoutes'],
  ['voiceRoutes'],
  ['voiceAssistantRoutes'],
  ['userRoutes'],
  ['burnoutRoutes'],
  ['mentalHealthRoutes'],
  ['memoryRoutes'],
  ['sidekickRoutes'],
  ['notificationsRoutes'],
  ['authMiddleware'],
  ['auth'],
  ['authRouter', 'googleAuthRoutes'],
  ['authRouter', 'calendarRoutes'],
  ['authRouter', 'authMiddleware'],
  ['googleAuthRoutes', 'authMiddleware'],
  ['calendarRoutes', 'authMiddleware'],
  ['authRouter', 'googleAuthRoutes', 'authMiddleware'],
  ['authRouter', 'googleAuthRoutes', 'calendarRoutes', 'authMiddleware']
];

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

for (let i = 0; i < testCombinations.length; i++) {
  const combination = testCombinations[i];
  console.log(`Testing combination ${i + 1}: ${combination.join(', ')}`);
  
  // Get the actual import objects
  const importsToTest = imports.filter(imp => combination.includes(imp.name));
  
  // Create test app
  const testApp = createTestApp(importsToTest);
  fs.writeFileSync('test-app.js', testApp);
  
  try {
    // Try to run the test app
    const { execSync } = require('child_process');
    execSync('node test-app.js', { stdio: 'pipe', timeout: 5000 });
    console.log(`✅ Combination ${i + 1}: Works`);
  } catch (error) {
    if (error.message.includes('Router.use() requires a middleware function')) {
      console.log(`❌ Combination ${i + 1}: Middleware error - ${combination.join(', ')}`);
      console.log('This combination is causing the issue!');
      break;
    } else {
      console.log(`⚠️  Combination ${i + 1}: Other error - ${error.message}`);
    }
  }
}

// Clean up
if (fs.existsSync('test-app.js')) {
  fs.unlinkSync('test-app.js');
}

console.log('\n🎯 Check the output above to identify the problematic combination.'); 