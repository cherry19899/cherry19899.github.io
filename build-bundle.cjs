#!/usr/bin/env node
// Build script: compiles JSX src files and concatenates into a single bundle
// that works with CDN React (global React, no imports needed)

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const SRC = path.join(__dirname, 'src');
const ASSETS = path.join(__dirname, 'assets');

// Order matters: utils first, then components, then App
const FILES = [
  'utils.js',
  'api.js',
  'components/Auth.js',
  'components/Navbar.js',
  'components/Home.js',
  'components/JobList.js',
  'components/JobDetail.js',
  'components/CreateJob.js',
  'components/MyJobs.js',
  'components/Chat.js',
  'components/ChatRoom.js',
  'components/Escrow.js',
  'components/Profile.js',
  'components/Portfolio.js',
  'components/Connects.js',
  'components/Applications.js',
  'components/Reviews.js',
  'App.js',
];

const babelOpts = {
  presets: [
    ['@babel/preset-react', {
      runtime: 'classic', // use React.createElement (global React)
    }],
  ],
  plugins: [],
};

let combined = '/* WorkPro App Bundle — built by build-bundle.js */\n';
combined += '(function(React, ReactDOM) {\n';
combined += '"use strict";\n';
combined += 'var useState=React.useState,useEffect=React.useEffect,useCallback=React.useCallback,useRef=React.useRef,useMemo=React.useMemo;\n\n';

for (const file of FILES) {
  const filePath = path.join(SRC, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skipping missing: ${file}`);
    continue;
  }

  const code = fs.readFileSync(filePath, 'utf8');

  // Remove the const { useState } = React; lines since we declare them globally above
  let processed = code;
  processed = processed.replace(/const\s*\{[^}]+\}\s*=\s*React\s*;?\n?/g, '');
  processed = processed.replace(/const\s+\w+\s*=\s*React\.useState\b[^;]*;?\n?/g, '');

  try {
    const result = babel.transformSync(processed, {
      ...babelOpts,
      filename: file,
    });
    combined += `\n/* === ${file} === */\n`;
    combined += result.code;
    combined += '\n';
    console.log(`✓ ${file}`);
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
    // Include original as comment so we can debug
    combined += `\n/* ERROR in ${file}: ${err.message} */\n`;
  }
}

// Mount the app
combined += `
/* === Mount === */
try {
  var rootEl = document.getElementById('root');
  if (rootEl && typeof App !== 'undefined') {
    if (ReactDOM.createRoot) {
      ReactDOM.createRoot(rootEl).render(React.createElement(App));
    } else {
      ReactDOM.render(React.createElement(App), rootEl);
    }
    console.log('[WorkPro] App mounted (CDN React build)');
  }
} catch(e) {
  console.error('[WorkPro] Mount failed:', e);
}
`;

combined += '\n})(window.React, window.ReactDOM);\n';

const outFile = path.join(ASSETS, 'app-v183.js');
fs.writeFileSync(outFile, combined);
console.log(`\n✅ Bundle written: ${outFile} (${(combined.length / 1024).toFixed(1)} KB)`);
