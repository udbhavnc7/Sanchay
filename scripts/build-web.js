const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'web');
const rootDist = path.join(rootDir, 'dist');
const webDist = path.join(webDir, 'dist');

if (!fs.existsSync(path.join(webDir, 'pnpm-lock.yaml'))) {
  throw new Error('web/pnpm-lock.yaml is required for a reproducible build.');
}

// Never trust a cached node_modules or resolve a new dependency graph on deploy.
// Build tools are devDependencies, including when the host sets NODE_ENV=production.
console.log('==> Installing web dependencies from the frozen pnpm lockfile...');
execSync('pnpm install --frozen-lockfile --prod=false', { cwd: webDir, stdio: 'inherit' });

console.log('==> Building web production bundle in web/...');
fs.rmSync(webDist, { recursive: true, force: true });
execSync('pnpm run build', { cwd: webDir, stdio: 'inherit' });
if (!fs.existsSync(path.join(webDist, 'index.html')) || !fs.statSync(path.join(webDist, 'index.html')).isFile()) {
  throw new Error('Web build did not produce web/dist/index.html; publication targets were not changed.');
}

// Only replace published outputs after a successful build with a real entry point.
console.log('==> Copying web/dist to root dist/...');
fs.rmSync(rootDist, { recursive: true, force: true });
fs.cpSync(webDist, rootDist, { recursive: true });

const androidMain = path.join(rootDir, 'app', 'src', 'main');
if (fs.existsSync(androidMain)) {
  const androidAssetsWeb = path.join(androidMain, 'assets', 'web');
  console.log('==> Syncing web/dist to Android assets (app/src/main/assets/web)...');
  fs.rmSync(androidAssetsWeb, { recursive: true, force: true });
  fs.cpSync(webDist, androidAssetsWeb, { recursive: true });
}

console.log('==> Build completed successfully.');
