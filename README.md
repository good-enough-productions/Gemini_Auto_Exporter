# Gemini Auto Exporter

[![GitHub repo](https://img.shields.io/badge/repo-GitHub-blue?logo=github)](https://github.com/good-enough-productions/Gemini_Auto_Exporter)
[![CI](https://github.com/good-enough-productions/Gemini_Auto_Exporter/actions/workflows/ci.yml/badge.svg)](https://github.com/good-enough-productions/Gemini_Auto_Exporter/actions)

## Goal
Reduce friction turning Gemini conversations into action by exporting chats to Markdown with:
1) a reliable autosave cache, and
2) a tag-based export system allowing flexible categorization via YAML frontmatter.

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

### Export with Tags
- A small panel appears in the bottom-right with:
   - **Tag buttons**: Notes, Ideas, Code, Tasks (clickable to toggle selection)
   - **Export button**: Downloads the conversation with selected tags
- Clicking tag buttons toggles them (selected tags are highlighted)
- Multiple tags can be selected before exporting
- Clicking Export downloads a Markdown export to `Downloads/Gemini_Exports/` with tags included in the YAML frontmatter
- All exports go to the same folder regardless of tags selected

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

## Tag-based Export System

The extension has evolved to use a **tag-based system** instead of separate folder buckets:

- **Tag Selection**: Select one or more tags (Notes, Ideas, Code, Tasks) before exporting
- **Single Location**: All exports go to `Gemini_Exports/` regardless of tags
- **YAML Metadata**: Tags are stored in the frontmatter for easy filtering and organization
- **Flexible Organization**: Use external tools to filter/organize files by tags in the YAML metadata

### How the tag system works
1. **UI panel** (bottom-right) contains clickable tag buttons and a single Export button.
2. Users can toggle tags on/off (selected tags are highlighted).
3. Clicking Export triggers the export with all selected tags.
4. The background script saves the file to `Gemini_Exports/` with tags in the YAML frontmatter.
5. A **stable filename strategy** per conversation (derived from the URL) + overwrite behavior ensures you get "latest state" rather than duplicates.
6. Structured frontmatter metadata includes:
   - `tags`, `lastUpdated`, `messageCount`, `sourceUrl`, `conversationId`, `title`

If you want "export when Gemini finishes a response", the best pattern is:
- detect completion,
- update cache immediately,
- export only on idle/manual/close so you don't spam downloads.


## Export metadata and filename

The exported Markdown now includes a small YAML frontmatter block and a top-level heading. This metadata is intended to make imports and automated indexing easier.

- **Fields included**:
   - `title`: extracted from the conversation UI (preferred) or falls back to `document.title` or the first user message.
   - `dateLocal`: a human-friendly local date/time string for the export.
   - `lastUpdated`: ISO timestamp (when the export was generated).
   - `messageCount`: number of messages captured in the export.
   - `sourceUrl`: the Gemini conversation URL.
   - `conversationId`: stable ID inferred from the URL when available.
   - `tags`: array of tags selected during export (e.g., `notes`, `ideas`, `code`, `tasks`). Empty if no tags selected.

- **Filename strategy**:
   - The content script attempts to extract a human-friendly conversation title from the page (selector examples: `span.conversation-title.gds-title-m`).
   - That title is sent to the background script which sanitizes it and uses it as the base filename.
   - If a `conversationId` is present it is appended to the filename; otherwise a timestamp is used as a fallback.
   - Sanitization rules replace unsafe characters with underscores and limit the filename length to avoid filesystem issues.
   - All files are saved to the same location: `Downloads/Gemini_Exports/`

- **Where to look in the code**:
   - Title extraction and frontmatter generation: `content.js`.
   - Filename sanitization and the download call: `background.js`.

Example frontmatter (with tags):

```
---
title: "AI Agent Ecosystem & Adaptive UI"
dateLocal: "12/28/2025, 13:28:27"
lastUpdated: "2025-12-28T13:28:27.556Z"
messageCount: 42
sourceUrl: "https://gemini.google.com/...."
conversationId: "abc123def"
tags:
  - notes
  - ideas
---

# AI Agent Ecosystem & Adaptive UI

Date: 12/28/2025, 13:28:27
---

```


