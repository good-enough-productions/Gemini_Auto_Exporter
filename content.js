// content.js

let autosaveIntervalId = null;
let extensionInvalidated = false;

console.log('Gemini Auto Exporter: content script loaded', window.location.href);

function fnv1aHash(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // unsigned 32-bit
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function isContextInvalidatedError(err) {
  const msg = (err && typeof err.message === 'string') ? err.message : '';
  return msg.toLowerCase().includes('extension context invalidated');
}

function handleInvalidatedContext(source) {
  if (extensionInvalidated) return;
  extensionInvalidated = true;
  try {
    if (autosaveIntervalId) {
      clearInterval(autosaveIntervalId);
      autosaveIntervalId = null;
    }
  } catch {}

  // This commonly happens after you reload/update the extension.
  // The fix is to refresh the Gemini tab so the new content script runs.
  setStatus('error', `extension reloaded — refresh page (${source})`);
}

function safeSendMessage(message, onOk, onErr) {
  if (extensionInvalidated) return;
  try {
    chrome.runtime.sendMessage(message, (response) => {
      const lastErr = chrome.runtime?.lastError;
      if (lastErr) {
        const lastErrMsg = String(lastErr.message || '');
        console.error('Gemini Auto Exporter: sendMessage lastError', lastErrMsg, lastErr);
        if (lastErrMsg.toLowerCase().includes('context invalidated')) {
          handleInvalidatedContext('sendMessage');
          return;
        }
        onErr?.(lastErr);
        return;
      }

      // Background can provide structured responses like { ok: false, error: '...' }
      if (response && response.ok === false) {
        const err = new Error(response.error || 'background error');
        console.error('Gemini Auto Exporter: background responded with error', response);
        onErr?.(err);
        return;
      }

      onOk?.(response);
    });
  } catch (e) {
    if (isContextInvalidatedError(e)) {
      handleInvalidatedContext('exception');
      return;
    }
    onErr?.(e);
  }
}

function ensureStatusPill() {
  if (!document.body) return null;
  let pill = document.getElementById('gemini-auto-export-status');
  if (pill) return pill;

  pill = document.createElement('div');
  pill.id = 'gemini-auto-export-status';
  pill.style.position = 'fixed';
  pill.style.bottom = '72px';
  pill.style.right = '20px';
  pill.style.zIndex = '9999';
  pill.style.padding = '6px 10px';
  pill.style.borderRadius = '999px';
  pill.style.fontSize = '12px';
  pill.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  pill.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  pill.style.border = '1px solid rgba(0,0,0,0.08)';
  pill.style.background = 'rgba(255,255,255,0.95)';
  pill.style.color = '#1f1f1f';
  pill.style.backdropFilter = 'blur(6px)';
  pill.innerText = 'Autosave: initializing…';
  document.body.appendChild(pill);
  return pill;
}

function ensureExportPanel() {
  if (!document.body) return null;
  let panel = document.getElementById('gemini-auto-export-panel');
  if (panel) return panel;

  panel = document.createElement('div');
  panel.id = 'gemini-auto-export-panel';
  panel.style.position = 'fixed';
  panel.style.bottom = '20px';
  panel.style.right = '20px';
  panel.style.zIndex = '9999';
  panel.style.display = 'flex';
  panel.style.gap = '8px';
  panel.style.padding = '8px';
  panel.style.borderRadius = '16px';
  panel.style.background = 'rgba(255,255,255,0.92)';
  panel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.25)';
  panel.style.border = '1px solid rgba(0,0,0,0.08)';
  panel.style.backdropFilter = 'blur(6px)';

  const buttons = [
    { id: 'general', label: 'Export', color: '#1a73e8' },
    { id: 'notes', label: 'Notes', color: '#0f9d58' },
    { id: 'ideas', label: 'Ideas', color: '#f29900' },
    { id: 'code', label: 'Code', color: '#7e57c2' },
    { id: 'tasks', label: 'Tasks', color: '#d93025' }
  ];

  buttons.forEach(({ id, label, color }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.bucketId = id;
    btn.innerText = label;
    btn.style.padding = '10px 14px';
    btn.style.borderRadius = '999px';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = '700';
    btn.style.fontSize = '13px';
    btn.style.color = 'white';
    btn.style.background = color;
    btn.style.boxShadow = '0 1px 4px rgba(0,0,0,0.25)';
    btn.onmouseenter = () => (btn.style.filter = 'brightness(0.96)');
    btn.onmouseleave = () => (btn.style.filter = 'none');
    btn.onclick = () => exportNow(id);
    panel.appendChild(btn);
  });

  document.body.appendChild(panel);
  return panel;
}

function ensureUI() {
  ensureExportPanel();
  ensureStatusPill();
}

function setStatus(state, detail) {
  const pill = ensureStatusPill();
  if (!pill) return;
  const base = 'Autosave:';
  const text = detail ? `${base} ${state} — ${detail}` : `${base} ${state}`;
  pill.innerText = text;

  if (state.toLowerCase().includes('error')) {
    pill.style.background = 'rgba(255,235,238,0.95)';
    pill.style.color = '#b00020';
    pill.style.borderColor = 'rgba(176,0,32,0.2)';
  } else if (state.toLowerCase().includes('saving') || state.toLowerCase().includes('exporting')) {
    pill.style.background = 'rgba(255,248,225,0.95)';
    pill.style.color = '#8a5a00';
    pill.style.borderColor = 'rgba(138,90,0,0.18)';
  } else {
    pill.style.background = 'rgba(232,245,233,0.95)';
    pill.style.color = '#1b5e20';
    pill.style.borderColor = 'rgba(27,94,32,0.18)';
  }
}

function formatTime(ts = Date.now()) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function getConversationIdFromUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    if (!last || last.length < 6) return '';
    if (last.toLowerCase() === 'app') return '';
    return last;
  } catch {
    return '';
  }
}

function getConversationTitle() {
  // Try several selectors that may contain the visible conversation title
  const selectors = [
    'span.conversation-title.gds-title-m',
    '.conversation-title',
    '.gds-title-m',
    'h1',
    'header h1',
    'div[role="heading"]'
  ];

  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 0) {
        return el.innerText.trim();
      }
    } catch {}
  }

  // Fallback: try to infer from conversation first user message
  try {
    const firstUser = document.querySelector('.user-query, user-query');
    if (firstUser && firstUser.innerText) return firstUser.innerText.trim().slice(0, 120);
  } catch {}

  return '';
}

function getChatContent() {
  const messages = [];
  
  // Strategy 1: Standard Custom Elements (2024-2025)
  let elements = Array.from(document.querySelectorAll('user-query, model-response'));
  
  // Strategy 2: Class-based fallback
  if (elements.length === 0) {
    console.log('Gemini Auto Exporter: Custom elements not found, trying classes...');
    elements = Array.from(document.querySelectorAll('.user-query, .model-response, [data-test-id="user-query"], [data-test-id="model-response"]'));
  }

  // Strategy 3: Look for the infinite scroller and its children
  if (elements.length === 0) {
     console.log('Gemini Auto Exporter: Classes not found, trying scroller container...');
     const scroller = document.querySelector('infinite-scroller, .infinite-scroller, main');
     if (scroller) {
         // Get direct children that look like messages
         elements = Array.from(scroller.children).filter(child => {
             return child.innerText.length > 0; // Very loose filter
         });
     }
  }

  console.log(`Gemini Auto Exporter: Found ${elements.length} potential message elements.`);

  elements.forEach((el, index) => {
    let role = 'Unknown';
    let content = '';

    // Determine Role
    const tagName = el.tagName.toLowerCase();
    if (tagName.includes('user') || el.classList.contains('user-query')) {
      role = 'User';
    } else if (tagName.includes('model') || el.classList.contains('model-response')) {
      role = 'Gemini';
    } else {
        // Heuristic for Strategy 3
        const text = el.innerText;
        if (text.length < 50) { role = 'User'; } // Short messages likely user? Flaky.
        else { role = 'Gemini'; }
    }

    // Extract Content
    // Try specific text containers first
    const userTextEl = el.querySelector('.query-text, .query-text-line, p');
    const modelTextEl = el.querySelector('.markdown, .message-content');

    if (role === 'User' && userTextEl) {
        content = userTextEl.innerText.trim();
    } else if (role === 'Gemini' && modelTextEl) {
        content = modelTextEl.innerText.trim();
    } else {
        // Fallback: just get all text
        content = el.innerText.trim();
    }

    if (content) {
      messages.push({ role, content });
    }
  });

  if (messages.length === 0) {
    console.warn('Gemini Auto Exporter: No messages found.');
    // DEBUG DUMP
    console.log('--- DEBUG DUMP ---');
    console.log('Body classes:', document.body.className);
    const main = document.querySelector('main');
    if (main) {
        console.log('Main HTML snippet:', main.innerHTML.substring(0, 500));
    } else {
        console.log('No <main> tag found.');
    }
    console.log('------------------');
  }

  return messages;
}

function formatMarkdown(messages) {
  if (messages.length === 0) return null;

  const convTitle = getConversationTitle() || document.title || 'Gemini Chat';
  const date = new Date().toLocaleString();

  const meta = {
    lastUpdated: new Date().toISOString(),
    messageCount: messages.length,
    sourceUrl: window.location.href,
    conversationId: getConversationIdFromUrl(window.location.href)
  };
  
  // YAML-ish frontmatter (helpful for later ingestion)
  let md = `---\n`;
  md += `title: "${String(convTitle).replace(/"/g, '\\"')}"\n`;
  md += `dateLocal: "${String(date).replace(/"/g, '\\"')}"\n`;
  md += `lastUpdated: "${meta.lastUpdated}"\n`;
  md += `messageCount: ${meta.messageCount}\n`;
  md += `sourceUrl: "${String(meta.sourceUrl).replace(/"/g, '\\"')}"\n`;
  if (meta.conversationId) md += `conversationId: "${String(meta.conversationId).replace(/"/g, '\\"')}"\n`;
  md += `---\n\n`;
  md += `# ${convTitle}\n\nDate: ${date}\n\n---\n\n`;

  messages.forEach(msg => {
    md += `## ${msg.role}\n\n${msg.content}\n\n`;
  });

  return md;
}

function exportNow(bucketId = 'general') {
  const messages = getChatContent();
  console.log(`Gemini Auto Exporter: Export clicked (bucket=${bucketId}). Messages:`, messages.length);
  const markdown = formatMarkdown(messages);
  const convTitle = getConversationTitle() || document.title || 'gemini_chat';

  if (!markdown) {
    setStatus('error', 'no chat found');
    return;
  }
  const contentHash = fnv1aHash(markdown);
  setStatus('exporting', bucketId);
  safeSendMessage(
    {
      action: 'export_chat',
      payload: markdown,
      title: convTitle,
      url: window.location.href,
      conversationId: getConversationIdFromUrl(window.location.href),
      bucketId,
      contentHash
    },
    () => setStatus('saved', `exported ${bucketId} ${formatTime()}`),
    () => setStatus('error', `export failed (${bucketId})`)
  );
}

// Listen for page unload
window.addEventListener('pagehide', () => {
  console.log('Gemini Auto Exporter: Page hiding...');
  const messages = getChatContent();
  const markdown = formatMarkdown(messages);

  if (markdown) {
    setStatus('exporting', 'closing tab');
    // Note: pagehide is a fragile time to message; the background cache + tabs.onRemoved is the real reliability layer.
    console.log('Gemini Auto Exporter: Attempting to send message...');
    safeSendMessage(
      {
        action: 'export_chat',
        payload: markdown,
        title: getConversationTitle() || document.title || 'gemini_chat',
        url: window.location.href,
        conversationId: getConversationIdFromUrl(window.location.href),
        bucketId: 'general'
      },
      () => {
        console.log('Gemini Auto Exporter: Send successful');
        setStatus('saved', `exported ${formatTime()}`);
      },
      (err) => {
        console.error('Gemini Auto Exporter: Send failed', err);
        setStatus('error', 'close export failed');
      }
    );
  }
});

function startUiAndObservers() {
  try {
    ensureUI();
    setStatus('saved', 'ready');
  } catch (e) {
    console.error('Gemini Auto Exporter: UI init failed', e);
  }

  // Gemini is a SPA; DOM can re-render and remove injected UI. Keep it present.
  let scheduled = false;
  const scheduleEnsure = () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      ensureUI();
    }, 500);
  };

  const startObserver = () => {
    if (!document.body) return false;
    const observer = new MutationObserver(() => scheduleEnsure());
    observer.observe(document.body, { childList: true, subtree: true });
    return true;
  };

  // Patch history to detect in-app navigations.
  try {
    const originalPushState = history.pushState;
    history.pushState = function () {
      const ret = originalPushState.apply(this, arguments);
      scheduleEnsure();
      return ret;
    };
    window.addEventListener('popstate', scheduleEnsure);
  } catch {}

  if (!startObserver()) {
    const t = setInterval(() => {
      if (startObserver()) clearInterval(t);
    }, 250);
  }
}

// Run on load (delay a bit for Gemini to render)
setTimeout(startUiAndObservers, 1500);

// Optional: Auto-save to storage periodically in case pagehide fails
let lastContent = '';
autosaveIntervalId = setInterval(() => {
  const messages = getChatContent();
  const markdown = formatMarkdown(messages);
  if (markdown && markdown !== lastContent) {
    lastContent = markdown;
    setStatus('saving', 'updating cache');
    safeSendMessage(
      {
        action: 'cache_chat',
        payload: markdown,
        title: document.title || 'gemini_chat',
        url: window.location.href,
        conversationId: getConversationIdFromUrl(window.location.href)
      },
      () => setStatus('saved', `saved ${formatTime()}`),
      (err) => {
        console.error('Gemini Auto Exporter: cache failed callback', err);
        const msg = err && err.message ? err.message : 'cache failed';
        setStatus('error', msg);
      }
    );
  }
}, 5000);
