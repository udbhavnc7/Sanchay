const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'web');
const rootDist = path.join(rootDir, 'dist');
const webDist = path.join(webDir, 'dist');

if (!fs.existsSync(path.join(webDir, 'node_modules'))) {
  console.log('==> Installing web dependencies in web/...');
  execSync('npm install', { cwd: webDir, stdio: 'inherit' });
} else {
  console.log('==> web/node_modules exists.');
}

console.log('==> Building web production bundle in web/...');
execSync('npm run build', { cwd: webDir, stdio: 'inherit' });

console.log('==> Copying web/dist to root dist/...');
fs.cpSync(webDist, rootDist, { recursive: true });

const androidAssetsWeb = path.join(rootDir, 'app', 'src', 'main', 'assets', 'web');
if (fs.existsSync(androidAssetsWeb)) {
  console.log('==> Syncing web/dist to Android assets (app/src/main/assets/web)...');
  fs.cpSync(webDist, androidAssetsWeb, { recursive: true });
}

console.log('==> Build completed successfully! Both dist/ and web/dist/ are ready.');
