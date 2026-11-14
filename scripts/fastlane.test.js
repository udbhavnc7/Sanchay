const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

// Evaluate the real Ruby configuration, replacing only network/build actions.
// This harness cannot invoke Fastlane, Gradle, or Google Play.
const harness = `
require 'json'
$actions = []
$lanes = {}
module UI
  def self.user_error!(message); raise message; end
end
def default_platform(*); end
def desc(*); end
def platform(*); yield; end
def lane(name, &block); $lanes[name.to_s] = block; end
def gradle(**options); $actions << ['gradle', options]; end
def sh(*args); $actions << ['sh', args]; end
def supply(**options); $actions << ['supply', options]; end
def json_key_file(value); $actions << ['json_key_file', value]; end
def package_name(value); $actions << ['package_name', value]; end
begin
  load File.join(ARGV[0], 'fastlane', ARGV[1] == 'appfile' ? 'Appfile' : 'Fastfile')
  $lanes.fetch(ARGV[1]).call unless ARGV[1] == 'appfile'
  puts JSON.generate(actions: $actions)
rescue => error
  puts JSON.generate(actions: $actions, error: error.message)
end
`;

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanchay fastlane test '));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'fastlane'));
  for (const file of ['Fastfile', 'Appfile']) {
    fs.copyFileSync(path.join(__dirname, '..', 'fastlane', file), path.join(root, 'fastlane', file));
  }
  const write = (relative) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'test fixture, never a real credential or release artifact');
  };
  const run = (lane, variables = {}) => {
    const result = spawnSync('ruby', ['-e', harness, root, lane], {
      cwd: os.tmpdir(), encoding: 'utf8', timeout: 10000,
      env: {
        ...process.env,
        SIGNING_KEY_ALIAS: '', SIGNING_KEY_PASSWORD: '', SIGNING_STORE_PASSWORD: '',
        SANCHAY_PUBLISH_INTERNAL: '', SANCHAY_CONFIRM_PACKAGE: '',
        ...variables,
      },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  return { root, write, run };
}

const signing = { SIGNING_KEY_ALIAS: 'test', SIGNING_KEY_PASSWORD: 'test', SIGNING_STORE_PASSWORD: 'test' };
const confirmation = { SANCHAY_PUBLISH_INTERNAL: 'true', SANCHAY_CONFIRM_PACKAGE: 'app.sanchay' };

test('production lane rejects absent signing inputs before running build actions', (t) => {
  const f = fixture(t);
  const result = f.run('production_build');
  assert.match(result.error || '', /signing/i);
  assert.deepEqual(result.actions, []);
});

test('production lane requires an actual keystore, not only passwords', (t) => {
  const f = fixture(t);
  const result = f.run('production_build', signing);
  assert.match(result.error || '', /sign.jks/);
  assert.deepEqual(result.actions, []);
});

test('production lane builds current web assets before the root release bundle', (t) => {
  const f = fixture(t);
  f.write('sign.jks');
  const result = f.run('production_build', signing);
  assert.equal(result.error, undefined);
  assert.deepEqual(result.actions, [
    ['sh', ['node', path.join(f.root, 'scripts/build-web.js').replaceAll('\\', '/')]],
    ['gradle', { tasks: ['clean', ':app:bundleRelease'], project_dir: f.root.replaceAll('\\', '/') }],
  ]);
});

test('internal lane never uploads without explicit Sanchay confirmation', (t) => {
  const f = fixture(t);
  f.write('app/build/outputs/bundle/release/app-release.aab');
  f.write('google-play-console-user.json');
  for (const env of [{}, { ...confirmation, SANCHAY_CONFIRM_PACKAGE: 'com.ivy.wallet' }]) {
    const result = f.run('internal_release', env);
    assert.match(result.error || '', /confirm/i);
    assert.deepEqual(result.actions, []);
  }
});

test('confirmed upload rejects missing Play credentials or a missing bundle', (t) => {
  const f = fixture(t);
  let result = f.run('internal_release', confirmation);
  assert.ok(result.error);
  assert.deepEqual(result.actions, []);
  f.write('google-play-console-user.json');
  result = f.run('internal_release', confirmation);
  assert.ok(result.error);
  assert.deepEqual(result.actions, []);
});

test('confirmed upload targets only app.sanchay internal draft with root paths and no inherited metadata', (t) => {
  const f = fixture(t);
  f.write('app/build/outputs/bundle/release/app-release.aab');
  f.write('google-play-console-user.json');
  const result = f.run('internal_release', confirmation);
  assert.equal(result.error, undefined);
  assert.equal(result.actions.length, 1);
  const [action, options] = result.actions[0];
  assert.equal(action, 'supply');
  assert.equal(options.package_name, 'app.sanchay');
  assert.equal(options.track, 'internal');
  assert.equal(options.release_status, 'draft');
  assert.equal(options.aab, path.join(f.root, 'app/build/outputs/bundle/release/app-release.aab').replaceAll('\\', '/'));
  assert.equal(options.json_key, path.join(f.root, 'google-play-console-user.json').replaceAll('\\', '/'));
  assert.equal(options.skip_upload_changelogs, true);
  assert.equal(options.skip_upload_metadata, true);
});

test('Appfile resolves Sanchay credentials independently of the working directory', (t) => {
  const f = fixture(t);
  const result = f.run('appfile');
  assert.deepEqual(result.actions, [
    ['json_key_file', path.join(f.root, 'google-play-console-user.json').replaceAll('\\', '/')],
    ['package_name', 'app.sanchay'],
  ]);
});
