// Post-build step: copy static assets (PWA icons, sw.js, legal pages, Pi
// validation) from static/ into dist/ after `vite build` wipes it.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'static');
const DST = path.join(__dirname, 'dist');

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else { fs.copyFileSync(s, d); console.log('✓ ' + path.relative(SRC, s)); }
  }
}

if (!fs.existsSync(SRC)) { console.error('static/ dir missing'); process.exit(1); }
copyDir(SRC, DST);
console.log('\n✅ static assets copied to dist/');
