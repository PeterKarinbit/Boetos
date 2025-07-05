const fs = require('fs');
const path = require('path');

console.log('🔧 Creating a clean app.ts file...\n');

const cleanAppContent = `import express, { Application, Request, Response, NextFunction } from 'express';

const app: Application = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the Boetos API!',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

export default app;`;

// Write the clean app.ts file
const appTsPath = path.join(__dirname, 'src', 'app.ts');
fs.writeFileSync(appTsPath, cleanAppContent);
console.log('✅ Created clean app.ts file');

// Clean build
console.log('\n🔧 Running clean build...');
const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful');
} catch (error) {
  console.log('❌ Build failed');
  process.exit(1);
}

// Test the clean app
console.log('\n🧪 Testing the clean app...');
const testAppContent = `
const app = require('./dist/app.js');
const express = require('express');
const testApp = express();

testApp.use(app.default);

testApp.listen(4006, () => {
  console.log('✅ Clean app test successful - server running on port 4006');
  process.exit(0);
});`;

fs.writeFileSync('test-clean-app.js', testAppContent);
try {
  execSync('node test-clean-app.js', { stdio: 'pipe', timeout: 5000 });
  console.log('✅ Clean app test passed');
} catch (error) {
  console.log(`❌ Clean app test failed: ${error.message}`);
}

// Clean up
if (fs.existsSync('test-clean-app.js')) {
  fs.unlinkSync('test-clean-app.js');
}

console.log('\n🎯 Clean app created successfully!');
console.log('You can now gradually add back routes and middleware as needed.');