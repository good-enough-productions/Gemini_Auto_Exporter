# Gemini Auto Exporter

## Goal
Automatically export Gemini chats when the tab is closed.

## References
- User currently uses: [Simple Exporter for Gemini](https://chromewebstore.google.com/detail/simple-exporter-for-gemin/khgjgbneefjbbocjhakfamgmcjpkmoej)

## Technical Approach
1. **Manifest V3** Chrome Extension.
2. **Content Script**: Injected into `gemini.google.com`.
   - Monitors chat content.
   - Listens for `beforeunload` or `pagehide` events to detect tab closing/navigation.
   - Extracts chat data (Markdown format).
   - Sends data to Background Script.
3. **Background Script**:
   - Receives chat data.
   - Triggers `chrome.downloads.download` to save the file.

## Challenges
- **Reliability on Close**: Browsers often terminate scripts quickly on tab close.
  - *Mitigation*: We might need to save state to `chrome.storage.local` continuously (debounced) and have the background script monitor tab closure via `chrome.tabs.onRemoved`?
  - *Problem*: `onRemoved` gives us a `tabId`, but the tab is already gone, so we can't get the URL or title easily unless we tracked it.
  - *Better Path*: Content script sends "I'm closing, here is the data" on `pagehide`. `keepalive` might be needed for the message port.

## Installation
1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select this folder (`Gemini_Auto_Exporter`).

## Usage
- Open [Gemini](https://gemini.google.com).
- Have a chat.
- Close the tab.
- A Markdown file should automatically download to your default Downloads folder (inside a `Gemini_Exports` subfolder).

## Status
- [x] Initialize project structure
- [x] Implement Content Script
- [x] Implement Background Script

## Troubleshooting
- **Manual Export**: A blue "Export Chat" button should appear in the bottom right. Click it to test if the extension can read the chat.
- **Console Logs**: Open the Developer Tools (F12) -> Console to see logs starting with "Gemini Auto Exporter".
- **Reload**: After installing or updating, make sure to refresh the Gemini tab.
- If downloads don't start, check the extension errors in `chrome://extensions`.


