const { execSync } = require('child_process');
const path = require('path');

function runCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    execSync(command, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

async function cleanStart() {
  console.log('====== BOETOS CLEAN START ======');
  console.log('1. Direct type conflict fix...');

  const dropTypeSuccess = runCommand('node src/drop-type.js');
  if (!dropTypeSuccess) {
    console.error('Type conflict fix failed. Will attempt database repair anyway...');
  }

  console.log('\n2. Repairing database...');

  const repairSuccess = runCommand('npm run repair-db');
  if (!repairSuccess) {
    console.error('Database repair failed. Attempting to continue anyway...');
  }

  console.log('\n3. Starting application with database connection reset...');

  // Set environment variable to skip database initialization in data-source.js
  process.env.SKIP_DB_INIT = 'true';

  // Import and run the index.js file to start the application
  try {
    console.log('Loading application...');
    require('./index');
    console.log('Application loaded successfully!');
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Run the clean start process
cleanStart();
