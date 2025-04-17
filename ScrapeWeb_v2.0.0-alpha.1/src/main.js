
// gui_blog_scraper/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

// Logging setup to a writable external location
const logPath = path.join(app.getPath('userData'), 'error.log');
const logStream = fs.createWriteStream(logPath, { flags: 'a' });
function log(msg) {
  const timestamp = new Date().toISOString();
  logStream.write(`[${timestamp}] ${msg}\n`);
}

let mainWindow;

function createWindow() {
  try {
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

    log('Loading index.html...');
    mainWindow.loadFile(path.resolve(__dirname, 'index.html'))
  .catch(err => {
    console.error("Failed to load index.html:", err);
    const fs = require('fs');
    fs.writeFileSync('load_error.log', err.stack);
  });
    log('Window created and file loaded.');
  } catch (err) {
    log(`ERROR during window creation: ${err.message}`);
  }
}

app.whenReady().then(() => {
  const { Menu, shell } = require('electron');
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: "Help",
      submenu: [
        {
          label: "README",
          click: async () => {
            await shell.openExternal("http://github.garrettspear.info/ScrapeWeb/");
          }
        },
        {
          label: "Wiki",
          click: async () => {
            await shell.openExternal("https://github.com/garrettds11/ScrapeWeb/wiki");
          }
        },
        {
          label: "About",
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
              type: "info",
              title: "About ScrapeWeb",
              message: `ScrapeWeb v${app.getVersion()}`,
              detail: "A GUI-based blog scraper built with Electron and Puppeteer.\n© 2025 Garrett Spear\n\nhttps://github.garrettspear.info/ScrapeWeb/",
              buttons: ["Close"]
            });
          }
        },
        {
          label: "Donate",
          click: async () => {
            await shell.openExternal("https://paypal.me/spear2018/");
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  log('App is ready.');
  createWindow();
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
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

    const metadata = await page.evaluate(() => {
      return {
        title: document.title || '',
        author: document.querySelector('meta[name="author"]')?.content || '',
        description: document.querySelector('meta[name="description"]')?.content || '',
        updated: document.querySelector('meta[property="og:updated_time"]')?.content || ''
      };
    });

    const postHandles = await page.$$(titleSelector);
    const total = postHandles.length;
    let current = 0;
    const posts = [];

    for (const el of postHandles) {
      const result = await page.evaluate((element, linkSel) => {
        const anchorHref = element.href ||
                           element.querySelector(linkSel)?.href ||
                           element.closest('a')?.href || '';

        return {
          title: element.innerText.trim(),
          url: anchorHref,
          content: element.innerText.trim()
        };
      }, el, linkSelector);

      posts.push(result);
      current++;
      if (mainWindow && mainWindow.setProgressBar) {
        mainWindow.setProgressBar(current / total);
      }
    }

    if (outputFormat === 'json' || outputFormat === 'both') {
      const jsonOut = path.join(scrapeDir, `scrape_${timestamp}.json`);
      const jsonFull = { url, ...metadata, posts };
      fs.writeFileSync(jsonOut, JSON.stringify(jsonFull, null, 2));
    }

    if (outputFormat === 'markdown' || outputFormat === 'both') {
      const mdOut = path.join(scrapeDir, `scrape_${timestamp}.md`);
      const lines = [
        `# ${metadata.title}`,
        `**URL:** ${url}`,
        `**Author:** ${metadata.author}`,
        `**Last Updated:** ${metadata.updated}`,
        `**Description:** ${metadata.description}`,
        `\n## Posts\n`
      ];
      posts.forEach((p, i) => {
        lines.push(`${i + 1}. [${p.title}](${p.url})`);
      });
      fs.writeFileSync(mdOut, lines.join('\n'));
    }

    await browser.close();
    if (mainWindow && mainWindow.setProgressBar) {
      mainWindow.setProgressBar(-1);
    }

    return scrapeDir;
  } catch (error) {
    if (browser) await browser.close();
    log(`Scraping failed: ${error.message}`);
    if (mainWindow && mainWindow.setProgressBar) {
      mainWindow.setProgressBar(-1);
    }
    throw new Error(`Scraping failed: ${error.message}`);
  }
});
