const path = require('path');
const fs = require('fs');

function checkDir(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  let allOk = true;
  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      console.log(`Trying to require: ${filePath}`);
      require(filePath);
      console.log(`✅ Successfully required: ${file}`);
    } catch (err) {
      console.error(`❌ Error requiring ${file}:`, err.message);
      allOk = false;
      // Continue to next file instead of exiting
    }
  }
  return allOk;
}

const entitiesDir = path.join(__dirname, 'dist', 'entities');
const dbDir = path.join(__dirname, 'dist', 'db');

console.log('--- Checking entities ---');
const entitiesOk = checkDir(entitiesDir);
console.log('--- Checking db ---');
const dbOk = checkDir(dbDir);

if (entitiesOk && dbOk) {
  console.log('All entity and db files loaded successfully!');
} else {
  console.log('Some files failed to load. See errors above.');
} 