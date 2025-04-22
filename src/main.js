const { app, BrowserWindow, ipcMain, dialog, shell, Menu, net } = require('electron');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const semver = require('semver');

// Paths for user data
const userDataPath = app.getPath('userData');
const logPath = path.join(userDataPath, 'debug.log');
const historyPath = path.join(userDataPath, 'selectors.json');

// Logging setup
const logStream = fs.createWriteStream(logPath, { flags: 'a' });
function log(msg) {
  const timestamp = new Date().toISOString();
  logStream.write('[' + timestamp + '] ' + msg + '\n');
}

// App-wide exception handling
process.on('uncaughtException', err => {
  const errorMsg = err.stack || err.toString();
  try {
    log('UNCAUGHT EXCEPTION: ' + errorMsg);
  } catch {
    console.error('Failed to log uncaught exception:', errorMsg);
  }
  dialog.showMessageBox({ type: 'error', title: 'Fatal Error', message: errorMsg });
});
process.on('unhandledRejection', reason => {
  try {
    log('UNHANDLED REJECTION: ' + reason);
  } catch {
    console.error('Failed to log unhandled rejection:', reason);
  }
});

let mainWindow;
function createWindow() {
  log('Creating browser window...');
  mainWindow = new BrowserWindow({
    width: 650,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../scripts/preload.js')
    },
    icon: path.join(__dirname, 'scraper.ico')
  });

  mainWindow.loadFile(path.resolve(__dirname, 'index.html'))
    .catch(err => log('Failed to load index.html: ' + err.stack));

  log('Window created and index.html loaded.');
}

// ─── Query GitHub Releases API; compare tag to app version; prompt to download. ─────────────────────────────────────────
async function checkGitHubUpdates() {
  log('Checking GitHub release tags @ https://api.github.com/repos/garrettds11/ScrapeWeb/releases/latest');
  const request = net.request({
    method: 'GET',
    protocol: 'https:',
    hostname: 'api.github.com',
    path: '/repos/garrettds11/ScrapeWeb/releases/latest',
    headers: { 'User-Agent': 'ScrapeWeb-Updater' }
  });

  let body = '';
  request.on('response', res => {
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      try {
        const release = JSON.parse(body);
        const latest = release.tag_name.replace(/^v/, '');
        const current = app.getVersion();

          log(`Latest version release tag: v${latest}`);
          log(`Running app version: ${current}`);

          // if nothing newer, bail out silently
          if (!semver.gt(latest, current)) {
            return;
          }
        
          // only runs when an update *is* available
          const downloadUrl =
            (release.assets.find(a => a.name.endsWith('.zip')) || {}).browser_download_url
            || release.html_url;
        
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `A new version (${latest}) is available!`,
            detail: `You are running ${current}.\nDownload it now?`,
            buttons: ['Download', 'Later']
          })
          .then(({ response }) => {
            if (response === 0 && downloadUrl) {
              log(`User chose to download update; downloading ${release.html_url} from ${downloadUrl}`);
              shell.openExternal(downloadUrl);
            }
          });
      } catch (e) {
        log('Failed to check GitHub release tags @ https://api.github.com/repos/garrettds11/ScrapeWeb/releases/latest ' + e);
        console.error('Latest release check failed:', e);
      }
    });
  });
  request.on('error', err => {
    log('Network error checking updates: ' + err);
    console.error('Network error checking updates:', err);
  });
  request.end();
}

// ─── SINGLE READY BLOCK ───────────────────────────────────────────────────────
app.whenReady().then(() => {
  // 1) Build full menu (File, Options, Debug, Help)
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Options',
      submenu: [
        {
          label: 'Clear URL History',
          click: () => {
            try {
              mainWindow.webContents.send('clear-url-history');
              dialog.showMessageBox({ message: 'URL history cleared.' });
              log('URL history cleared via menu.');
            } catch (e) {
              log('Failed to clear URL history: ' + e);
            }
          }
        },
        {
          label: 'Clear Selector History',
          click: () => {
            try {
              if (fs.existsSync(historyPath)) fs.unlinkSync(historyPath);
              dialog.showMessageBox({ message: 'Selector history cleared.' });
              log('Selector history cleared via menu.');
            } catch (e) {
              log('Failed to clear selector history: ' + e);
            }
          }
        }
      ]
    },
    {
      label: 'Debug',
      submenu: [
        {
          label: 'Open Log File',
          click: () => shell.openPath(logPath)
        },
        {
          label: 'Open DevTools',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
          if (mainWindow) mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => {
            try {
              log('User invoked manual update check');
              checkGitHubUpdates();
            } catch (e) {
              log('Manual checkForUpdates() failed: ' + e);
            }
          }
        },
        { label: 'README', click: async () => await shell.openExternal('https://garrettds11.github.io/ScrapeWeb/') },
        { label: 'Wiki', click: async () => await shell.openExternal('https://garrettds11.github.io/ScrapeWeb/wiki') },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About ScrapeWeb',
              message: `ScrapeWeb v${app.getVersion()}`,
              detail: 'A GUI-based blog scraper built with Electron and Puppeteer.\n© 2025 Garrett Spear',
              buttons: ['Close']
            });
          }
        },
        { label: 'Donate', click: async () => await shell.openExternal('https://paypal.me/spear2018/') }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  log('App ready, menu set.');

  // 2) Create the main window
  try {
    createWindow();
    log('Main window created.');
  } catch (e) {
    log('createWindow() threw: ' + e);
  }

  // 3) Kick off auto-updates
  try {
    checkGitHubUpdates();
    log('Called checkGitHubUpdates()');
  } catch (e) {
    log('checkGitHubUpdates() failed: ' + e);
  }
});

app.on('window-all-closed', () => app.quit());

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-scrapes-folder', async (event, basePath) => {
  const root   = basePath || app.getPath('documents');
  const target = path.join(root, 'ScrapeWeb', 'scrapes');
  await shell.openPath(target);
});

ipcMain.handle('get-selector-history', async () => {
  try {
    if (fs.existsSync(historyPath)) {
      return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
  } catch (e) {
    log(`Failed to load selector history: ${e}`);
  }
  return {};
});

ipcMain.handle('save-selector-history', async (event, { url, titleSelector, linkSelector, descSelector }) => {
  let history = {};
  try {
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
  } catch (e) {
    log(`Failed to parse existing selector history: ${e}`);
  }
  history[url] = { titleSelector, linkSelector, descSelector };
  try {
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    log(`Selector history saved for ${url}`);
  } catch (e) {
    log(`Failed to save selector history: ${e}`);
  }
});

ipcMain.handle('scrape', async (event, { url, titleSelector, linkSelector, descSelector, outputFormat, outputDir }) => {
  const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
  const scrapeDir = path.join(
    outputDir || app.getPath('documents'),
    'ScrapeWeb',
    'scrapes',
    timestamp
  );
  fs.mkdirSync(scrapeDir, { recursive: true });

  let browser;
  try {
    // Launch & navigate
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector(titleSelector, { timeout: 10000 });
    // Grab page metadata
    const metadata = await page.evaluate(() => ({
      title:       document.title || '',
      author:      document.querySelector('meta[name="author"]')?.content || '',
      description: document.querySelector('meta[name="description"]')?.content || '',
      updated:     document.querySelector('meta[property="og:updated_time"]')?.content || ''
    }));
    // Scrape posts
    const postHandles = await page.$$(titleSelector);
    const total       = postHandles.length;
    let current       = 0;
    const posts       = [];

    for (const el of postHandles) {
      const result = await page.evaluate((element, linkSel, descSel) => {
      // URL & title as before
      const href = element.href
        || element.querySelector(linkSel)?.href
        || element.closest('a')?.href
        || '';
      const titleText   = element.innerText.trim();

      // CONTENT: if user provided a selector, use that *within* the current post element;
      // otherwise fallback to nextElementSibling <p> or empty.
      let contentText = '';
      if (descSel) {
        // look for a matching child or descendant of this post item
        const node = element.closest('article')?.querySelector(descSel)
                  || element.querySelector(descSel)
                  || document.querySelector(descSel);
        contentText = node ? node.innerText.trim() : '';
      } else {
        // fallback: check immediate <p> sibling
        const sib = element.nextElementSibling;
        if (sib && sib.tagName.toLowerCase() === 'p') {
          contentText = sib.innerText.trim();
        }
      }

      return { title: titleText, url: href, content: contentText };
    }, el, linkSelector, descSelector);

    posts.push(result);
      current++;
      mainWindow.setProgressBar(current / total);
    }

    // Helper to escape CSV fields
    const escapeCsv = value => {
      const str = value != null ? String(value) : '';
      if (/["\n,]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // ─── JSON ───────────────────────────────────────────────────────────────
    if (outputFormat === 'json') {
      fs.writeFileSync(
        path.join(scrapeDir, `scrape_${timestamp}.json`),
        JSON.stringify({ metadata, posts }, null, 2)
      );

    // ─── MARKDOWN ──────────────────────────────────────────────────────────
    } else if (outputFormat === 'md') {
      const md = [
        `# ${metadata.title}`,
        `**URL:** ${url}`,
        `**Author:** ${metadata.author}`,
        `**Updated:** ${metadata.updated}`,
        `**Description:** ${metadata.description}`,
        '',
        `## Posts`,
        ''
      ];
      posts.forEach((p,i) =>
        md.push(`${i+1}. [${p.title}](${p.url})`)
      );
      fs.writeFileSync(
        path.join(scrapeDir, `scrape_${timestamp}.md`),
        md.join('\n')
      );

    // ─── HTML ───────────────────────────────────────────────────────────────
    } else if (outputFormat === 'html') {
      const htmlLines = [
        `<!DOCTYPE html>`,
        `<html><head><meta charset="utf-8"><title>${metadata.title}</title></head><body>`,
        `<h1>${metadata.title}</h1>`,
        `<p><strong>URL:</strong> <a href="${url}">${url}</a></p>`,
        `<p><strong>Author:</strong> ${metadata.author}</p>`,
        `<p><strong>Updated:</strong> ${metadata.updated}</p>`,
        `<p><strong>Description:</strong> ${metadata.description}</p>`,
        `<h2>Posts</h2>`,
        `<table border="1" cellpadding="8" cellspacing="0">`,
        `  <thead><tr><th>#</th><th>Title</th><th>URL</th><th>Content</th></tr></thead>`,
        `  <tbody>`
      ];
      posts.forEach((p,i) => {
        htmlLines.push(
          `    <tr>`,
          `      <td>${i+1}</td>`,
          `      <td>${p.title}</td>`,
          `      <td><a href="${p.url}">${p.url}</a></td>`,
          `      <td>${p.content}</td>`,
          `    </tr>`
        );
      });
      htmlLines.push(`  </tbody>`, `</table>`, `</body></html>`);
      fs.writeFileSync(
        path.join(scrapeDir, `scrape_${timestamp}.html`),
        htmlLines.join('\n')
      );

    // ─── CSV ────────────────────────────────────────────────────────────────
    } else if (outputFormat === 'csv') {
      const rows = [];
      // header
      rows.push(['Site Title','Post #','Post Title','URL','Content'].join(','));
      // data rows
      posts.forEach((p,i) => {
        rows.push([
          escapeCsv(metadata.title),
          i+1,
          escapeCsv(p.title),
          escapeCsv(p.url),
          escapeCsv(p.content)
        ].join(','));
      });
      fs.writeFileSync(
        path.join(scrapeDir, `scrape_${timestamp}.csv`),
        rows.join('\n')
      );
    }

    return scrapeDir;

  } catch (error) {
    // Log the failure, then re‑throw so the renderer sees it
    log(`Scraping failed: ${error.message}`);
    throw error;
  } finally {
    // Always close the browser and clear the progress bar
    if (browser) {
      try { 
        await browser.close(); 
      } catch (_) { /* swallow close errors */ }
    }
    mainWindow.setProgressBar(-1);
  }
});
