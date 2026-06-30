#!/usr/bin/env node
// Copies static assets into dist/ AFTER vite build (which handles JS/HTML).
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

function cp(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`✓ ${path.relative(ROOT, src)}`);
}
function cpDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) cpDir(s, d); else cp(s, d);
  }
}

const staticFiles = [
  '404.html', 'manifest.json', '.nojekyll', 'robots.txt', 'sitemap.xml',
  'favicon-32.png', 'icon-192.png', 'icon-512.png', 'workpro-icon.svg',
  'sw.js', 'privacy-policy.html', 'terms-of-service.html',
];
for (const f of staticFiles) cp(path.join(ROOT, f), path.join(DIST, f));
cpDir(path.join(ROOT, '.well-known'), path.join(DIST, '.well-known'));

console.log(`\n✅ static assets copied to dist/`);
