# Gemini Dispatcher Architecture

## Overview
Transform the "Gemini Auto Exporter" into a "Gemini Dispatcher" that can:
1.  Take a user prompt.
2.  Distribute it to multiple Gemini Gems (personas) in parallel.
3.  Wait for completion.
4.  Auto-export the results.

## Data Flow

1.  **User Interface (Popup/Dashboard)**
    *   User enters `Prompt`.
    *   User selects `Target Gems` (List of URLs).
    *   User clicks "Dispatch".
    *   **Action:** Saves a "Job Batch" to `chrome.storage.local`.
    *   **Action:** Sends "START_BATCH" message to Background Script.

2.  **Background Script (The Orchestrator)**
    *   Listens for "START_BATCH".
    *   Reads the Job Batch.
    *   **Loop:** For each Gem URL:
        *   Creates a new tab: `chrome.tabs.create({ url: gemUrl, active: false })`.
        *   (Optional) Tracks `tabId` mapped to the specific Job ID.

3.  **Content Script (The Worker)**
    *   **On Load:** Checks `chrome.storage.local` for pending jobs matching `window.location.href`.
    *   **If Job Found:**
        1.  **Inject:** Inserts `Prompt` into the chat input area.
        2.  **Submit:** Simulates a click on the "Send" button.
        3.  **Wait:** Uses `MutationObserver` to watch for the "Stop generating" indicator to appear and then disappear.
        4.  **Extract:** Calls `getChatContent()` (existing function).
        5.  **Send:** Sends `export_chat` message to Background.
        6.  **Cleanup:** Sends "JOB_COMPLETE" message to Background (to remove job from storage and optionally close tab).

## Key Technical Challenges & Solutions

### 1. Input Injection
React/Angular apps often ignore direct value setting (`element.value = 'foo'`).
*   **Solution:** Use `document.execCommand('insertText')` or dispatch `input`/`change` events.
*   **Selector:** Need to robustly find the `contenteditable` div.

### 2. Completion Detection
How do we know when Gemini is done?
*   **Indicators:**
    *   The "Send" button turns into a "Stop" square during generation.
    *   The "Stop" square turns back into a "Send" arrow (or microphone) when done.
*   **Logic:** Wait for "Stop" button to appear (generation started), then wait for it to disappear (generation finished).

### 3. Background Throttling
Chrome throttles CPU for background tabs.
*   **Impact:** DOM observers might fire slower.
*   **Mitigation:** Usually acceptable for text generation. If it times out, we might need to keep tabs `active: true` but in a separate window.

## Proposed Manifest Changes
*   Add `tabs` permission.
*   Add `popup` (or `options_page`) for the Dispatcher UI.

## File Naming Strategy
*   Format: `[Gem_Name] - [Prompt_Snippet] - [Date].md`
*   Example: `Coding_Architect - Build_a_dispatcher - 2025-12-21.md`
