const fs = require('fs');
const path = require('path');

console.log('🔧 Creating a clean index.ts file...\n');

const cleanIndexContent = `import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 4001;

async function startServer() {
  try {
    // Start the server
    app.listen(PORT, () => {
      console.log(\`Server is running on port \${PORT}\`);
      console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
    });

    // Handle server errors
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();`;

// Write the clean index.ts file
const indexTsPath = path.join(__dirname, 'src', 'index.ts');
fs.writeFileSync(indexTsPath, cleanIndexContent);
console.log('✅ Created clean index.ts file');

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

console.log('\n🎯 Clean index.ts created successfully!');
console.log('Ready to test the server.'); 