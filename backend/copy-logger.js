const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'src', 'utils', 'logger.js');
const destDir = path.join(__dirname, 'dist', 'utils');
const dest = path.join(destDir, 'logger.js');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied logger.js to dist/utils/'); 