# ScrapeWeb Release Notes

## Version 2.0.1 (2025-04-18)

### New Features
- **Persistent URL & Selector History**  
  - Stores up to 10 past blog URLs and associated CSS selectors in `selectors.json`.  
  - Auto-populates selectors when a known URL is selected.
- **Dark Mode Toggle**  
  - User-interface theme toggle with persisted preference.
- **Options Menu Enhancements**  
  - **Clear History**: Menu item to clear stored URLs and selectors.  
  - **Open Debug Log**: Menu item to open the `debug.log` debug file directly.
- **“See Scrapes” Button Improvement**  
  - Opens the configured output folder, appending `ScrapeWeb/scrapes` automatically.

### Improvements
- **Menu Restoration**  
  - Added Options to the application menu.
- **Shortcut Creation**  
  - Configured electron builder to place `ScrapeWeb.lnk` in the top-level `dist/win-unpacked` folder.
- **Error Handling & Logging**  
  - Enhanced logging to `error.log` in user data directory.
  - Wrapped critical IPC and file operations with try/catch for resilience.

### Bug Fixes
- Fixed issue where URL and selector inputs read as `undefined`.
- Corrected the path opened by “See Scrapes” button to use the selected output directory.
- Resolved menu missing from `main.js` imports (`shell` and other modules).

### Developer Notes
- **File Structure**  
  - `main.js`: Updated to include selector history handlers, menu items, and shell operations.  
  - `index.html`: Revised UI elements, datalist for URL history, and persistence logic.  
- **Build Configuration**  
  - `package.json`: Adjusted `build.files` and `win` target for shortcuts.

---
*Thank you for using ScrapeWeb!*
"""
