#!/usr/bin/env node
/**
 * Release compliance gate — enforces the static invariants from
 * docs/release-checklist.md and SANCHAY_UPI_COMPLIANCE_FIRST_SPEC.md §Gate 2
 * so release approval does not depend on anyone remembering them.
 *
 * Run: node scripts/check-release-compliance.mjs   (exit 0 = pass)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const passes = [];

function check(name, ok, detail = '') {
  if (ok) passes.push(name);
  else failures.push(detail ? `${name} — ${detail}` : name);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// --- 1. Android manifest invariants -----------------------------------------
const manifest = read('app/src/main/AndroidManifest.xml');
check('manifest: usesCleartextTraffic="false"', manifest.includes('usesCleartextTraffic="false"'));
check('manifest: allowBackup="false"', manifest.includes('allowBackup="false"'));
for (const perm of [
  'ACCESS_FINE_LOCATION',
  'ACCESS_COARSE_LOCATION',
  'READ_SMS',
  'RECEIVE_SMS',
  'SEND_SMS',
  'CALL_LOG',
  'GET_ACCOUNTS',
  'QUERY_ALL_PACKAGES',
  'READ_CONTACTS',
]) {
  check(`manifest: no ${perm}`, !manifest.includes(perm));
}

// --- 2. Gradle / SDK invariants ---------------------------------------------
const appGradle = read('app/build.gradle.kts');
check('gradle: no crashlytics plugin in app', !/crashlytics/i.test(appGradle));
check('gradle: no libs.bundles.google (Play review/app-update)', !appGradle.includes('libs.bundles.google'));
check('gradle: no libs.bundles.firebase', !appGradle.includes('libs.bundles.firebase'));
if (exists('gradle/libs.versions.toml')) {
  const catalog = read('gradle/libs.versions.toml');
  check('version catalog: no crashlytics entry', !/crashlytics/i.test(catalog));
  check('version catalog: no direct kotlinx-coroutines-play-services (arrives only via firebase-common)',
    !catalog.includes('kotlinx-coroutines-play-services'));
}

// --- 3. Path A invariants: no UPI URI / QR / scraping in shipped sources ----
function scanFiles(dirRel, { exts, exclude = () => false }) {
  const dir = path.join(root, dirRel);
  if (!fs.existsSync(dir)) return [];
  return walk(dir).filter((f) => exts.some((e) => f.endsWith(e)) && !exclude(f));
}

const upiPattern = /upi:\/\//i;
const qrPattern = /qrcode|qr-code|zxing/i;
const scrapingPattern = /SmsManager|NotificationListener|AccessibilityService|MediaProjection/;

for (const file of scanFiles('web/src', { exts: ['.ts', '.tsx'], exclude: (f) => f.includes('.test.') })) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  check(`web: no upi:// in ${rel}`, !upiPattern.test(text));
  check(`web: no intent:// in ${rel}`, !text.includes('intent://'));
  check(`web: no QR generation in ${rel}`, !qrPattern.test(text));
}

const kotlinDirs = ['app/src', 'feature', 'shared'];
for (const dirRel of kotlinDirs) {
  for (const file of scanFiles(dirRel, { exts: ['.kt', '.java'] })) {
    const text = fs.readFileSync(file, 'utf8');
    const rel = path.relative(root, file);
    check(`kotlin: no upi://pay in ${rel}`, !/upi:\/\//i.test(text));
    check(`kotlin: no zxing/QR in ${rel}`, !qrPattern.test(text));
    check(`kotlin: no scraping APIs in ${rel}`, !scrapingPattern.test(text));
  }
}

// --- 4. WebView asset hygiene: exactly the referenced bundles ---------------
const assetsDir = path.join(root, 'app/src/main/assets/web/assets');
const indexHtmlPath = path.join(root, 'app/src/main/assets/web/index.html');
if (fs.existsSync(indexHtmlPath) && fs.existsSync(assetsDir)) {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const referenced = new Set(
    [...html.matchAll(/assets\/(index-[\w-]+\.(?:js|css))/g)].map((m) => m[1])
  );
  const onDisk = fs
    .readdirSync(assetsDir)
    .filter((f) => /^index-[\w-]+\.(js|css)$/.test(f));
  check('assets: index.html references at least one JS and one CSS',
    [...referenced].some((f) => f.endsWith('.js')) && [...referenced].some((f) => f.endsWith('.css')),
    `found: ${[...referenced].join(', ') || 'none'}`);
  check('assets: every referenced bundle exists on disk',
    [...referenced].every((f) => onDisk.includes(f)),
    `missing: ${[...referenced].filter((f) => !onDisk.includes(f)).join(', ')}`);
  check('assets: no stale/extra bundles on disk (build-web.js must wipe targets)',
    onDisk.every((f) => referenced.has(f)),
    `unreferenced: ${onDisk.filter((f) => !referenced.has(f)).join(', ')}`);
} else {
  check('assets: index.html and assets/ present', false, 'missing index.html or assets dir');
}

// --- 5. Licensing -----------------------------------------------------------
check('LICENSE: full GPL-3.0 text present',
  exists('LICENSE') && read('LICENSE').includes('GNU GENERAL PUBLIC LICENSE'));
check('README: upstream attribution present',
  exists('README.md') && read('README.md').toLowerCase().includes('ivy-wallet'));

// --- Report -----------------------------------------------------------------
if (failures.length === 0) {
  console.log(`Release compliance gate: PASS (${passes.length} checks)`);
  process.exit(0);
}
console.error(`Release compliance gate: FAIL (${failures.length}/${passes.length + failures.length} checks)`);
for (const f of failures) console.error(`  ✗ ${f}`);
process.exit(1);
