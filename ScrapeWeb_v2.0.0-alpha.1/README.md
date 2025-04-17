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

For [Splunk Threat Research Blog](https://www.splunk.com/en_us/blog/author/secmrkt-research.html):

- **Title Selector**: `a.headline h3.splunk2-h4`
- **Link Selector**: `a.headline`

---

## 📁 Output Example

Markdown Output:

```markdown
# Splunk Threat Research Team’s Blog
**URL:** https://www.splunk.com/en_us/blog/author/secmrkt-research.html
**Author:** 
**Last Updated:** 
**Description:** 

## Posts

1. [Sinister SQL Queries and How to Catch Them](https://...)
2. [Infostealer Campaign against ISPs](https://...)
```

JSON Output:

```json
{
  "url": "https://...",
  "title": "Splunk Threat Research...",
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
