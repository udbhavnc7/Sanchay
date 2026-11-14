const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

// Run the real CLI and package manager only in disposable, dependency-free projects.
function fixture(t, { android = true, cached = false, build = 'success' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanchay build test '));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (relative, contents) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  };
  write('scripts/build-web.js', fs.readFileSync(path.join(__dirname, 'build-web.js')));
  write('package.json', JSON.stringify({ private: true, packageManager: 'pnpm@10.34.3' }));
  const manifest = { private: true, packageManager: 'pnpm@10.34.3', scripts: { build: 'node build.cjs' } };
  write('web/package.json', JSON.stringify(manifest));
  const lock = "lockfileVersion: '9.0'\n\nsettings:\n  autoInstallPeers: true\n  excludeLinksFromLockfile: false\n\nimporters:\n\n  .: {}\n";
  write('web/pnpm-lock.yaml', lock);
  const buildScript = build === 'fail' ? 'process.exit(7);' : build === 'empty' ? '' : `
    const fs = require('node:fs');
    fs.mkdirSync('dist/assets', { recursive: true });
    fs.writeFileSync('dist/index.html', '<script src="./assets/fresh.js"></script>');
    fs.writeFileSync('dist/assets/fresh.js', 'current bundle');
  `;
  write('web/build.cjs', buildScript);
  write('dist/old.txt', 'previous publication');
  write('web/dist/index.html', 'stale web build');
  write('web/dist/assets/stale.js', 'stale bundle');
  if (android) {
    write('app/src/main/assets/web/old.txt', 'previous publication');
    write('app/src/main/assets/native.txt', 'native asset');
  }
  if (cached) write('web/node_modules/cached.txt', 'not a valid install');
  const run = () => spawnSync(process.execPath, [path.join(root, 'scripts/build-web.js')], {
    cwd: os.tmpdir(),
    encoding: 'utf8',
    timeout: 30000,
    env: {
      ...process.env,
      CI: 'true',
      NODE_ENV: 'production',
      npm_config_offline: 'true',
      npm_config_audit: 'false',
      npm_config_update_notifier: 'false',
    },
  });
  const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
  const exists = (relative) => fs.existsSync(path.join(root, relative));
  return { root, write, run, read, exists, manifest, lock };
}

function succeeds(result) {
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stdout + result.stderr);
}

function failsWithoutPublishing(f, result) {
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.equal(f.read('dist/old.txt'), 'previous publication');
  assert.equal(f.read('app/src/main/assets/web/old.txt'), 'previous publication');
}

test('clean install uses the frozen pnpm lock, never creates an npm lock', (t) => {
  const f = fixture(t);
  succeeds(f.run());
  assert.equal(f.exists('web/package-lock.json'), false, 'npm must not resolve a second dependency graph');
  assert.equal(f.read('web/pnpm-lock.yaml'), f.lock);
  assert.equal(f.read('dist/assets/fresh.js'), 'current bundle');
  assert.equal(f.read('app/src/main/assets/web/assets/fresh.js'), 'current bundle');
  assert.equal(f.read('app/src/main/assets/native.txt'), 'native asset');
});

test('cached node_modules cannot bypass a frozen-lockfile mismatch', (t) => {
  const f = fixture(t, { cached: true });
  f.write('web/package.json', JSON.stringify({ ...f.manifest, devDependencies: { 'missing-build-tool': '1.0.0' } }));
  failsWithoutPublishing(f, f.run());
  assert.equal(f.read('web/pnpm-lock.yaml'), f.lock);
});

test('missing lockfile fails before replacing publication targets', (t) => {
  const f = fixture(t, { cached: true });
  fs.rmSync(path.join(f.root, 'web/pnpm-lock.yaml'));
  failsWithoutPublishing(f, f.run());
});

test('build failure leaves the previously published web and Android outputs intact', (t) => {
  const f = fixture(t, { build: 'fail', cached: true });
  failsWithoutPublishing(f, f.run());
});

test('successful build replaces stale files in every generated destination', (t) => {
  const f = fixture(t, { cached: true });
  succeeds(f.run());
  for (const output of ['web/dist', 'dist', 'app/src/main/assets/web']) {
    assert.equal(f.exists(`${output}/assets/stale.js`), false, output);
    assert.equal(f.exists(`${output}/old.txt`), false, output);
    assert.equal(f.read(`${output}/assets/fresh.js`), 'current bundle');
  }
});

test('a command that produces no index cannot publish the previous web build', (t) => {
  const f = fixture(t, { build: 'empty', cached: true });
  failsWithoutPublishing(f, f.run());
});

test('Android assets are created when the app exists but assets are absent', (t) => {
  const f = fixture(t, { cached: true });
  fs.rmSync(path.join(f.root, 'app/src/main/assets'), { recursive: true });
  succeeds(f.run());
  assert.equal(f.exists('app/src/main/assets/web/index.html'), true);
});

test('web-only checkout builds without creating a phantom Android app', (t) => {
  const f = fixture(t, { android: false, cached: true });
  succeeds(f.run());
  assert.equal(f.exists('dist/index.html'), true);
  assert.equal(f.exists('app'), false);
});
