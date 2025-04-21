# ScrapeWeb v2.1.1 Release Notes

## Versioning & Release Management
- **Bumped to v2.1.1** (patch bump for the updater bug fix)
- **Flattened repo structure** so all source files (`package.json`, `package-lock.json`, `src/`, `scripts/`, `.github/`) live at the root—no more nested version folders
- **Build targets updated** in `package.json`:
  - `portable` EXE for Windows  
  - `zip` archives for both x64 and ia32
- **Publish block** in `package.json` points at your GitHub repo (`owner: garrettds11`, `repo: ScrapeWeb`) so `electron-builder --publish always` uploads artifacts and `latest.yml` to Releases

## CI/CD Workflow
- **`.github/workflows/release.yml`** added:
  - Triggers on any tag `v*.*.*` (now including `v2.1.1`)
  - Runs on `windows-latest`
  - Steps: checkout → setup-node (with lockfile caching) → `npm ci` → `npm run dist -- --publish always`
- **`GH_TOKEN`** injected as a repo secret for authenticated release publishing
- **Release notes** file (`release_notes_v2.1.1.md`) now lives at root and is integrated into the Release body

## Build & Shortcut
- **`dist` script** in `package.json` runs `electron-builder` then `scripts/createShortcut.js` to place desktop/start-menu shortcuts
- **Output directory** changed from `dist/` to `app/` for clarity

## Auto‑Update Support
- **electron-updater** upgraded to `^6.6.2`
- All standard events wired with dialogs and logs:
  - `checking-for-update` (with “Checking…” info box)
  - `update-available` / `update-not-available` (status + dialogs)
  - `download-progress` (console/log only)
  - `update-downloaded` (restart now vs later prompt)
  - `error` (error box + log)
- **“Check for Updates”** menu item under **Help**
- **Portable** builds still ship `latest.yml` and can auto‑update via a generic or GitHub feed

## Error Handling & Logging
- **App‑wide** `uncaughtException` and `unhandledRejection` handlers log to `debug.log` and show an error dialog
- All `autoUpdater` handlers wrapped in `try/catch` with fallback dialog on failure
- Consistent use of `log('…' + msg)` concatenation

## Security & Context Isolation
- `nodeIntegration: false` / `contextIsolation: true` in `BrowserWindow`
- **`preload.js`** in `src/` bundles only a minimal `window.api` surface via `contextBridge`

## IPC & Preload API
- **Exposed** methods in `window.api`:
  - `selectFolder()`, `openScrapesFolder(path)`, `scrape(params)`
  - `getSelectorHistory()`, `saveSelectorHistory(data)`
  - `onClearUrlHistory(callback)`, `onUpdateStatus(callback)`
- Renderer uses **only** `window.api.*` calls

## Renderer (index.html) Refactor
- Wrapped all element lookups & event bindings in a `DOMContentLoaded` guard
- Removed the old “Both” output option; added **HTML** and **CSV** formats
- Renamed selectors to: **Title**, **Link**, **Description** (`descSelector`) with a new input
- **URL history** cap increased from 10 → 1000 entries
- On load, merged localStorage URLs with file‑based selector history
- On scrape, saved selectors to disk and updated localStorage

## Scrape Handler Overhaul
- Unified `try / catch / finally` in `ipcMain.handle('scrape',…)` for guaranteed cleanup
- Optional `content` driven by `descSelector` (or next `<p>`) when not provided
- Outputs exactly one format at a time:
  - **JSON**: `{ metadata, posts }`
  - **Markdown** (`.md`)
  - **HTML**: `<table>` with `#`, `Title`, `URL`, `Content`
  - **CSV**: rows with `Site Title,Post #,Post Title,URL,Content`

## Menu & UX Polish
- **“README”** and **“Wiki”** links updated to `https://garrettds11.github.io/ScrapeWeb/` (and `/wiki`)
- **Clear Selector History** & **Clear URL History** under **Options**, both with `try/catch` + dialog + log
- **Debug** menu includes **Toggle DevTools** (Ctrl/Cmd+I) alongside **Open Log File**
