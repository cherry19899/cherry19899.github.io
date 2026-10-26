// Post-build step: re-copy public/ into dist/ after `vite build`, belt-and-braces
// for assets Vite might miss.
//
// This used to copy from a separate static/ directory, which was an exact
// duplicate of public/ left over from before the Vite migration. Because it ran
// AFTER vite build, a stale file in static/ silently overwrote the fresh one
// from public/ — that is how the published Terms stayed on the old text while
// the source said otherwise. One source of truth now: public/.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'public');
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

// Pi verifies a domain by fetching /validation-key.txt, and the key belongs to
// one app registration. The Mainnet and Testnet apps are built from this same
// repo, so each build has to publish its own app's key — a single shared file
// once made the Testnet site serve the Mainnet key, and Pi could never verify
// the Testnet domain. The Testnet site is the build with VITE_PI_MODE=sandbox.
const TESTNET_KEY = path.join(DST, 'validation-key.testnet.txt');
if (process.env.VITE_PI_MODE === 'sandbox') {
  fs.renameSync(TESTNET_KEY, path.join(DST, 'validation-key.txt'));
  console.log('✓ validation-key.txt ← Testnet app key');
} else {
  fs.rmSync(TESTNET_KEY, { force: true });
}
console.log('\n✅ static assets copied to dist/');
