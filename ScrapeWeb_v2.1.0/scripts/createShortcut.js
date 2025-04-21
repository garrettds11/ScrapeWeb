// scripts/createShortcut.js
const path = require('path');
const ws = require('windows-shortcuts');

// adjust these to match your exe name:
const exeName = 'ScrapeWeb.exe';
const unpackedDir = path.join(__dirname, '..', 'app', 'win-unpacked');

const target = path.join(unpackedDir, exeName);
const link   = path.join(unpackedDir, '../../ScrapeWeb.lnk');

ws.create(link, {
  target,                      // points at your executable
  workingDir: unpackedDir,
  desc: 'Launch ScrapeWeb'
}, (err) => {
  if (err) {
    console.error('❌ Failed to create shortcut:', err);
    process.exit(1);
  } else {
    console.log('✅ Shortcut created at', link);
  }
});
