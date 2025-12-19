# Gemini Chat DOM Selectors (Updated 2025)

Based on analysis of recent open-source tools (e.g., `Louisjo/gemini-chat-exporter` v1.1.0, Copyright 2025), here are the current DOM selectors.

## Main Chat Container
The chat history is likely contained within one of these:
1. `.conversation-container`
2. `#chat-history`
3. `.chat-history`
4. `infinite-scroller` (Common in Google's new infinite scroll implementations)
5. `main`
6. `document.body` (Fallback)

## User Messages (User Queries)
*   **Element Tag:** `user-query` or `USER-QUERY`
*   **Text Content Selectors:**
    *   `.query-text-line` (Most specific)
    *   `.query-text`
    *   `p`
*   **Fallback:** If `user-query` tag is not found, look for `.query-text-line` directly in the document.

## Gemini Messages (Model Responses)
*   **Element Tag:** `model-response` or `MODEL-RESPONSE`
*   **Content Wrapper:** `message-content` or `MESSAGE-CONTENT`
*   **Markdown Container:** `.markdown`
*   **Text Content Selectors:**
    *   `p` (Paragraphs)
    *   `li` (List items)
*   **Fallback:** `message-content .markdown`

## Sidebar (Chat History List)
*   **Primary:** `[data-test-id="chat-history"]`
*   **Alternatives:**
    *   `nav[role="navigation"]`
    *   `.chat-history`
    *   `aside`
    *   `[role="navigation"]`
    *   `nav`

## Shadow DOM Status
*   Current analysis suggests `user-query` and `model-response` are **Light DOM** custom elements, accessible via standard `querySelector`.
*   No deep Shadow DOM traversal appears necessary for the main chat content as of early 2025.

## Data Test IDs
*   `data-test-id="chat-history"` is confirmed for the sidebar.
*   Other elements may not have stable `data-test-id` attributes, relying instead on custom tag names (`user-query`, `model-response`).
