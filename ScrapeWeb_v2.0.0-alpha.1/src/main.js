const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

// Paths
const userDataPath = app.getPath('userData');
const logPath = path.join(userDataPath, 'error.log');
const historyPath = path.join(userDataPath, 'selectors.json');

// Logging setup
const logStream = fs.createWriteStream(logPath, { flags: 'a' });
function log(msg) {
  const timestamp = new Date().toISOString();
  logStream.write(`[${timestamp}] ${msg}\n`);
}

let mainWindow;

function createWindow() {
  log('Creating browser window...');
  mainWindow = new BrowserWindow({
    width: 650,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'scraper.ico')
  });

  mainWindow.loadFile(path.resolve(__dirname, 'index.html'))
    .catch(err => {
      log(`Failed to load index.html: ${err.stack}`);
    });

  log('Window created and index.html loaded.');
}

app.whenReady().then(() => {
  // Build menu with File, Options, Debug, Help
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
          label: 'Clear Selector History',
          click: () => {
            try {
              if (fs.existsSync(historyPath)) fs.unlinkSync(historyPath);
              dialog.showMessageBox({ message: 'Selector history cleared.' });
              log('Selector history cleared via menu.');
            } catch (e) {
              log(`Failed to clear history: ${e}`);
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
          click: () => {
            shell.openPath(logPath);
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'README',
          click: async () => { await shell.openExternal('http://github.garrettspear.info/ScrapeWeb/'); }
        },
        {
          label: 'Wiki',
          click: async () => { await shell.openExternal('https://github.com/garrettds11/ScrapeWeb/wiki'); }
        },
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
        {
          label: 'Donate',
          click: async () => { await shell.openExternal('https://paypal.me/spear2018/'); }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  log('App ready, menu set.');
  createWindow();
});

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-scrapes-folder', async (event, basePath) => {
  const root = basePath || app.getPath('documents');
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

ipcMain.handle('save-selector-history', async (event, { url, titleSelector, linkSelector }) => {
  let history = {};
  try {
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
  } catch (e) {
    log(`Failed to parse existing selector history: ${e}`);
  }
  history[url] = { titleSelector, linkSelector };
  try {
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    log(`Selector history saved for ${url}`);
  } catch (e) {
    log(`Failed to save selector history: ${e}`);
  }
});

ipcMain.handle('scrape', async (event, { url, titleSelector, linkSelector, outputFormat, outputDir }) => {
  const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
  const scrapeDir = path.join(outputDir || app.getPath('documents'), 'BlogScraper', 'scrapes', timestamp);
  fs.mkdirSync(scrapeDir, { recursive: true });
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector(titleSelector, { timeout: 10000 });

    const metadata = await page.evaluate(() => ({
      title: document.title || '',
      author: document.querySelector('meta[name="author"]')?.content || '',
      description: document.querySelector('meta[name="description"]')?.content || '',
      updated: document.querySelector('meta[property="og:updated_time"]')?.content || ''
    }));

    const postHandles = await page.$$(titleSelector);
    const total = postHandles.length;
    let current = 0;
    const posts = [];

    for (const el of postHandles) {
      const result = await page.evaluate((element, linkSel) => {
        const href = element.href || element.querySelector(linkSel)?.href || element.closest('a')?.href || '';
        return { title: element.innerText.trim(), url: href, content: element.innerText.trim() };
      }, el, linkSelector);
      posts.push(result);
      current++;
      mainWindow.setProgressBar(current / total);
    }

    if (outputFormat !== 'markdown') {
      fs.writeFileSync(path.join(scrapeDir, `scrape_${timestamp}.json`), JSON.stringify({ url, ...metadata, posts }, null, 2));
    }
    if (outputFormat !== 'json') {
      const md = [`# ${metadata.title}`, `**URL:** ${url}`, `**Author:** ${metadata.author}`, `**Updated:** ${metadata.updated}`, `**Desc:** ${metadata.description}`, '\n## Posts\n'];
      posts.forEach((p,i) => md.push(`${i+1}. [${p.title}](${p.url})`));
      fs.writeFileSync(path.join(scrapeDir, `scrape_${timestamp}.md`), md.join('\n'));
    }

    await browser.close();
    mainWindow.setProgressBar(-1);
    return scrapeDir;
  } catch (error) {
    if (browser) await browser.close();
    log(`Scraping failed: ${error.message}`);
    mainWindow.setProgressBar(-1);
    throw new Error(`Scraping failed: ${error.message}`);
  }
});
