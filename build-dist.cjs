#!/usr/bin/env node
// Assembles the dist/ folder for GitHub Pages deployment.
// Run after `vite build` (which puts the bundle in dist-build/app-v200.js).
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

function cp(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function cpDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) cpDir(s, d);
    else cp(s, d);
  }
}

// Clean dist/
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

// Static files at root
const staticFiles = [
  'index.html',
  '404.html',
  'sw.js',
  'manifest.json',
  '.nojekyll',
  'robots.txt',
  'sitemap.xml',
  'favicon-32.png',
  'icon-192.png',
  'icon-512.png',
  'workpro-icon.svg',
  'privacy-policy.html',
  'terms-of-service.html',
];
for (const f of staticFiles) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) {
    cp(src, path.join(DIST, f));
    console.log(`✓ ${f}`);
  }
}

// Copy existing assets/ (CSS, old JS, images)
cpDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
console.log('✓ assets/');

// Overwrite with fresh bundle from vite build
cp(
  path.join(ROOT, 'dist-build', 'app-v200.js'),
  path.join(DIST, 'assets', 'app-v200.js'),
);
console.log('✓ assets/app-v200.js (fresh build)');

// .well-known/
cpDir(path.join(ROOT, '.well-known'), path.join(DIST, '.well-known'));
console.log('✓ .well-known/');

console.log(`\n✅ dist/ assembled (${fs.readdirSync(DIST).length} entries at root)`);
