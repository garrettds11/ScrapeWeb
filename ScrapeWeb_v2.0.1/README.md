# ScrapeWeb

![ScrapeWeb Logo](scrapeweb.png)

**ScrapeWeb** is a GUI-powered web scraper built with Electron and Puppeteer. It allows you to extract blog post titles and URLs using custom CSS selectors, then save the results in `.json`, `.md`, or both formats.

---

## 🚀 Features

- 🖥️ Modern cross-platform desktop interface
- 🔍 Scrapes blog titles and links with custom CSS selectors
- 📁 File browser to choose output location
- 🧾 Export to JSON, Markdown, or both
- 🧠 Auto-extracts metadata:
  - Page title
  - Meta author
  - Meta description
  - `og:updated_time` if available
- 📊 Taskbar-integrated progress bar
- 🔃 Supports dynamic JavaScript-rendered pages
- 📌 Timestamped filenames for each scrape session

---

## 📦 Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/yourusername/ScrapeWeb.git
cd ScrapeWeb
npm install
```

---

## 🧪 Usage

### Run in Development Mode

```bash
npm start
```

### Build a Portable Executable (Windows)

```bash
npm run dist
```

The resulting `.exe` will be created in the `dist/` folder.

---

## 🧑‍💻 How to Use

1. Launch ScrapeWeb
2. Enter the blog page URL
3. Input:
   - **Title Selector** — the CSS selector for the blog post title (e.g., `.post-title`, `a.headline`)
   - **Link Selector** — the CSS selector for the anchor or link (e.g., `a`)
4. Select output format: JSON, Markdown, or both
5. Choose an output folder
6. Click **Scrape Now**
7. The app will generate a timestamped file in the selected location

---

## 💡 Example Selectors

For [Hacker News Site](https://thehackernews.com/):

- **Title Selector**: `h2.home-title`
- **Link Selector**: `a.story-link`

---

## 📁 Output Example

Markdown Output:

```markdown
# The Hacker News | #1 Trusted Source for Cybersecurity News
**URL:** https://thehackernews.com/
**Author:** 
**Updated:** 
**Desc:** The Hacker News is the top cybersecurity news platform, delivering real-time updates, threat intelligence, data breach reports, expert analysis, and actionable insights for infosec professionals and decision-makers.

## Posts

1. [Chinese Smishing Kit Powers Widespread Toll Fraud Campaign Targeting U.S. Users in 8 States](https://thehackernews.com/2025/04/chinese-smishing-kit-behind-widespread.html)
2. [SANS Institute Complimentary Cyber Bundle ($3240 Value) at SANSFIRE 2025](https://thehackernews.uk/sansfire-2025-ev)
...
```

JSON Output:

```json
{
  "url": "https://...",
  "title": "The Hacker News...",
  "author": "",
  "description": "",
  "updated": "",
  "posts": [
    { "title": "Post 1", "url": "https://..." },
    { "title": "Post 2", "url": "https://..." }
  ]
}
```

---

## 📜 License

This project is licensed under the [GNU General Public License v3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl-3.0.html).

© 2025 Garrett Spear. Free to use, modify, and distribute under the terms of GPLv3.

---
