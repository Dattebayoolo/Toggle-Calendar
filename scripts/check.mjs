#!/usr/bin/env node
/**
 * scripts/check.mjs — Zero-dependency static sanity checks for Toggle Calendar.
 * Run: node scripts/check.mjs   (also wired to `npm test`)
 *
 * Checks:
 *  1. Every JS file parses (syntax-valid).
 *  2. manifest.json / manifest-like JSON files parse.
 *  3. Every <script src> and local stylesheet/link in index.html exists on disk.
 *  4. Service worker CORE_ASSETS all exist on disk.
 *  5. Guard assertions for past regressions (e.g. dead RTL mirror rules).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const fail = msg => { console.error('  ✗ ' + msg); failures++; };
const pass = msg => console.log('  ✓ ' + msg);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

/* 1. JS syntax check */
console.log('\n[1] JavaScript syntax');
const jsFiles = walk(root).filter(f => f.endsWith('.js'));
for (const f of jsFiles) {
  const rel = f.slice(root.length + 1);
  try {
    new vm.Script(readFileSync(f, 'utf8'), { filename: rel });
    pass(rel);
  } catch (e) {
    fail(`${rel}: ${e.message}`);
  }
}

/* 2. JSON files parse */
console.log('\n[2] JSON validity');
for (const f of ['manifest.json', 'package.json']) {
  const p = join(root, f);
  if (!existsSync(p)) { fail(`${f} missing`); continue; }
  try { JSON.parse(readFileSync(p, 'utf8')); pass(f); }
  catch (e) { fail(`${f}: ${e.message}`); }
}

/* 3. index.html references resolve */
console.log('\n[3] index.html asset references');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1])
  .filter(src => !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('mailto:'));
for (const ref of refs) {
  const clean = ref.split('?')[0];
  if (existsSync(join(root, clean))) pass(clean);
  else fail(`referenced but missing: ${clean}`);
}

/* 4. Service worker CORE_ASSETS exist */
console.log('\n[4] sw.js CORE_ASSETS');
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const assets = [...sw.matchAll(/'\.\/([^']+)'/g)].map(m => m[1]).filter(a => a.length > 0);
for (const a of assets) {
  if (a === '' || existsSync(join(root, a))) pass('./' + a);
  else fail(`CORE_ASSETS entry missing: ./${a}`);
}

/* 5. Regression guards */
console.log('\n[5] Regression guards');
const css = readFileSync(join(root, 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
if (/\[dir="rtl"\]/.test(css)) fail('style.css still contains [dir="rtl"] mirror rules (removed in V0.3)');
else pass('no dead RTL mirror rules');
if (!/sidebarToggle/.test(html)) fail('index.html missing #sidebarToggle (hamburger fix)');
else pass('topbar hamburger present');
if (!existsSync(join(root, 'app.js'))) pass('legacy app.js deleted');
else fail('legacy app.js resurrected — delete it');
if (!/serviceWorker\.register/.test(readFileSync(join(root, 'js/main.js'), 'utf8')))
  fail('main.js never registers the service worker');
else pass('service worker registered in main.js');

console.log('\n' + (failures === 0 ? '✅ ALL CHECKS PASSED' : `❌ ${failures} CHECK(S) FAILED`));
process.exit(failures === 0 ? 0 : 1);
