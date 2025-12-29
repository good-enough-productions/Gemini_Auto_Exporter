# Gemini Auto Exporter

[![GitHub repo](https://img.shields.io/badge/repo-GitHub-blue?logo=github)](https://github.com/good-enough-productions/Gemini_Auto_Exporter)
[![CI](https://github.com/good-enough-productions/Gemini_Auto_Exporter/actions/workflows/ci.yml/badge.svg)](https://github.com/good-enough-productions/Gemini_Auto_Exporter/actions)

## Goal
Reduce friction turning Gemini conversations into action by exporting chats to Markdown with:
1) a reliable autosave cache, and
2) a one-click export button (and eventually multiple “bucket” export buttons).

## References
- User currently uses: [Simple Exporter for Gemini](https://chromewebstore.google.com/detail/simple-exporter-for-gemin/khgjgbneefjbbocjhakfamgmcjpkmoej)

## Technical Approach
1. **Manifest V3** Chrome Extension.
2. **Content Script**: Injected into `gemini.google.com`.
   - Monitors chat content.
   - Periodically extracts chat content and sends it to the Background Script to keep an up-to-date cache.
   - Attempts an export on `pagehide`, but does not rely on it.
   - Renders a small autosave-style status pill so you can see when the conversation is “Saved”.
3. **Background Script**:
   - Receives chat data.
   - Triggers `chrome.downloads.download` to save the file.
   - Also listens for tab close (`chrome.tabs.onRemoved`) and exports the last cached version as a fallback.

## Challenges
- **Reliability on Close**: Browsers often terminate page scripts quickly on tab close, so scraping + messaging during `pagehide` can be flaky.
   - **Current mitigation**: autosave caching (every few seconds) + background export on `chrome.tabs.onRemoved`.
   - **Result**: even if `pagehide` export fails, the last cached version can still be downloaded.

## Installation
1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select this folder (`Gemini_Auto_Exporter`).

## Usage
- Open [Gemini](https://gemini.google.com).
- Have a chat.

### Export buttons (buckets)
- A small panel appears in the bottom-right with:
   - **Export** (general)
   - **Notes**
   - **Ideas**
   - **Code**
   - **Tasks**
- Clicking a button downloads a Markdown export to `Downloads/Gemini_Exports/<bucket>/` (general exports go to `Downloads/Gemini_Exports/`).

### Autosave indicator
- A small status pill appears above the button showing:
   - **Saving…** while the extension updates its cache
   - **Saved — HH:MM** when the latest conversation state is stored
   - **Error — …** if Chrome messaging fails (usually means the extension needs a reload)

### Export on tab close (fallback)
- Closing the tab should also trigger an export using the most recently cached version.

## Status
- [x] Initialize project structure
- [x] Implement Content Script
- [x] Implement Background Script

## Troubleshooting
- **UI not showing**: Refresh the Gemini tab. Then open DevTools Console and confirm you see `Gemini Auto Exporter: content script loaded`.
- **Buttons work but exports empty**: Gemini DOM selectors may have changed; check the console for `Found X potential message elements.`
- **Console Logs**: Open the Developer Tools (F12) -> Console to see logs starting with "Gemini Auto Exporter".
- **Reload**: After installing or updating, make sure to refresh the Gemini tab.
- If downloads don't start, check the extension errors in `chrome://extensions`.
- **"Extension context invalidated"**: This usually happens when you reloaded/updated the extension while the Gemini tab stayed open. Refresh the Gemini tab to re-inject the content script.

## Interpretation of the attachment (roadmap)
The sketch reads like an intent to evolve from “one export button” to **4+ export buttons** that:
- Send the same chat export to **different folders** (different buckets), and/or
- Add **different metadata** depending on which button is used.

Example buckets (in the spirit of the notes):
- Interesting / Notes
- Idea exploration
- Code
- Tasks / To‑do
- (Optional) General bucket for implicit exports (e.g., tab close with no selection)

### How I’d approach building the multi-button version
1. **Introduce a small UI panel** (bottom-right) that contains 4+ buttons.
2. Each button triggers the same export pipeline but passes a `bucketId` like `notes`, `ideas`, `code`, `tasks`.
3. The background script routes the download to a bucket folder:
   - `Gemini_Exports/notes/...`
   - `Gemini_Exports/ideas/...`
   - `Gemini_Exports/code/...`
   - `Gemini_Exports/tasks/...`
4. Add a **stable filename strategy** per conversation (derived from the URL) + overwrite behavior so you get “latest state” rather than duplicates.
5. Optionally add structured frontmatter metadata to the Markdown (useful for later ingestion):
   - `bucket`, `lastUpdated`, `messageCount`, `sourceUrl`, `conversationId`, `contentHash`

If you want “export when Gemini finishes a response”, the best pattern is:
- detect completion,
- update cache immediately,
- export only on idle/manual/close so you don’t spam downloads.

## Export metadata and filename

The exported Markdown now includes a small YAML frontmatter block and a top-level heading. This metadata is intended to make imports and automated indexing easier.

- **Fields included**:
   - `title`: extracted from the conversation UI (preferred) or falls back to `document.title` or the first user message.
   - `dateLocal`: a human-friendly local date/time string for the export.
   - `lastUpdated`: ISO timestamp (when the export was generated).
   - `messageCount`: number of messages captured in the export.
   - `sourceUrl`: the Gemini conversation URL.
   - `conversationId`: stable ID inferred from the URL when available.
   - `contentHash`: a lightweight hash of the exported content.
   - `bucket`: the export bucket (e.g., `general`, `notes`, `ideas`, `code`, `tasks`).

- **Filename strategy**:
   - The content script attempts to extract a human-friendly conversation title from the page (selector examples: `span.conversation-title.gds-title-m`).
   - That title is sent to the background script which sanitizes it and uses it as the base filename.
   - If a `conversationId` is present it is appended to the filename; otherwise a timestamp is used as a fallback.
   - Sanitization rules replace unsafe characters with underscores and limit the filename length to avoid filesystem issues.

- **Where to look in the code**:
   - Title extraction and frontmatter generation: `content.js`.
   - Filename sanitization and the download call: `background.js`.

Example frontmatter (truncated):

```
---
title: "AI Agent Ecosystem & Adaptive UI"
dateLocal: "12/28/2025, 13:28:27"
lastUpdated: "2025-12-28T13:28:27.556Z"
messageCount: 42
sourceUrl: "https://gemini.google.com/...."
conversationId: "abc123def"
bucket: "general"
contentHash: "1a2b3c4d"
---

# AI Agent Ecosystem & Adaptive UI

Date: 12/28/2025, 13:28:27
---

```


