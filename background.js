// background.js

const TAB_CACHE_KEY = 'tab_chat_cache_v1';
const RECENT_EXPORTS_KEY = 'recent_exports_v1';

// In-memory caches (service worker may be suspended; we also mirror to storage.session)
let tabChatCache = {}; // tabId -> { markdown, title, url, updatedAt }
let recentExports = {}; // tabId -> timestamp

function promisifyChromeStorageGet(area, keys) {
  return new Promise((resolve) => {
    try {
      area.get(keys, (result) => resolve(result || {}));
    } catch {
      resolve({});
    }
  });
}

function promisifyChromeStorageSet(area, items) {
  return new Promise((resolve, reject) => {
    try {
      area.set(items, () => {
        if (chrome.runtime.lastError) {
          console.error('storage.set failed', chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }
        resolve();
      });
    } catch (e) {
      console.error('storage.set threw', e);
      reject(e);
    }
  });
}

function getCacheArea() {
  // Prefer session storage to avoid polluting persistent local storage.
  // Fallback to local if session isn't available.
  return chrome.storage.session || chrome.storage.local;
}

async function hydrateCaches() {
  const area = getCacheArea();
  const result = await promisifyChromeStorageGet(area, [TAB_CACHE_KEY, RECENT_EXPORTS_KEY]);
  tabChatCache = result[TAB_CACHE_KEY] || {};
  recentExports = result[RECENT_EXPORTS_KEY] || {};
}

async function persistCaches() {
  const area = getCacheArea();
  try {
    await promisifyChromeStorageSet(area, {
      [TAB_CACHE_KEY]: tabChatCache,
      [RECENT_EXPORTS_KEY]: recentExports
    });
  } catch (e) {
    console.error('Failed to persist caches:', e);
    throw e;
  }
}

function sanitizeFilename(title) {
  return (title || 'gemini_chat')
    .replace(/[^a-z0-9\-\s_]/gi, '_')
    .replace(/\s+/g, '_')
    .substring(0, 80)
    .replace(/^_+|_+$/g, '') || 'gemini_chat';
}

function sanitizeBucket(bucketId) {
  const b = String(bucketId || '').trim().toLowerCase();
  if (!b) return '';
  return b.replace(/[^a-z0-9\-_]/g, '_').substring(0, 32);
}

function extractConversationIdFromUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    // Avoid generic paths like /app or / (no stable id)
    if (!last || last.length < 6) return '';
    if (last.toLowerCase() === 'app') return '';
    return last;
  } catch {
    return '';
  }
}

function downloadMarkdown(markdown, title, folder = 'Gemini_Exports', url = '') {
  const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
  const conversationId = extractConversationIdFromUrl(url);
  const base = sanitizeFilename(title);
  const filename = conversationId
    ? `${base}_${sanitizeFilename(conversationId)}.md`
    : `${base}_${Date.now()}.md`;

  chrome.downloads.download(
    {
      url: dataUrl,
      filename: `${folder}/${filename}`,
      conflictAction: 'overwrite',
      saveAs: false
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError);
      } else {
        console.log('Export started, ID:', downloadId);
      }
    }
  );
}

function wasRecentlyExported(tabId, windowMs = 30_000) {
  const ts = recentExports[String(tabId)];
  if (!ts) return false;
  return Date.now() - ts < windowMs;
}

async function markExported(tabId) {
  recentExports[String(tabId)] = Date.now();
  // Clear cache after export to avoid duplicates and reduce size.
  delete tabChatCache[String(tabId)];
  await persistCaches();
}

async function cacheChatForTab(tabId, payload) {
  if (!tabId) return;
  tabChatCache[String(tabId)] = {
    markdown: payload.payload,
    title: payload.title || 'gemini_chat',
    url: payload.url || '',
    updatedAt: Date.now()
  };
  await persistCaches();
}

async function exportFromCache(tabId, reason = 'tab_close') {
  const cached = tabChatCache[String(tabId)];
  if (!cached || !cached.markdown) return false;
  if (wasRecentlyExported(tabId)) return false;

  console.log(`Gemini Auto Exporter: Exporting cached chat for tab ${tabId} (reason=${reason})`);
  downloadMarkdown(cached.markdown, cached.title, 'Gemini_Exports', cached.url);
  await markExported(tabId);
  return true;
}

// Hydrate once per worker start.
hydrateCaches();

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  const tabId = sender?.tab?.id;
  const areaLabel = (getCacheArea() === chrome.storage.session) ? 'session' : 'local';

  if (message?.action === 'cache_chat') {
    cacheChatForTab(tabId, {
      payload: message.payload,
      title: message.title,
      url: sender?.tab?.url || message.url
    }).then(() => {
      sendResponse && sendResponse({ ok: true });
    }).catch((err) => {
      console.error('cache_chat failed:', err);
      sendResponse && sendResponse({ ok: false, error: String(err) });
    });
    return true; // Will respond asynchronously
  }

  if (message?.action === 'export_chat') {
    (async () => {
      try {
        if (!message.payload) {
          sendResponse && sendResponse({ ok: false, error: 'no payload' });
          return;
        }
        if (tabId && wasRecentlyExported(tabId)) {
          console.log('Gemini Auto Exporter: Skipping duplicate export (recently exported).');
          sendResponse && sendResponse({ ok: true, skipped: true });
          return;
        }

        const bucket = sanitizeBucket(message.bucketId);
        const folder = bucket ? `Gemini_Exports/${bucket}` : 'Gemini_Exports';
        downloadMarkdown(
          message.payload,
          message.title,
          folder,
          sender?.tab?.url || message.url || ''
        );
        if (tabId) {
          await markExported(tabId);
        }
        sendResponse && sendResponse({ ok: true });
      } catch (err) {
        console.error('Export failed in background:', err);
        sendResponse && sendResponse({ ok: false, error: String(err) });
      }
    })();
    return true; // Will respond asynchronously
  }
});

// Reliable fallback: export on tab removal using cached draft.
chrome.tabs.onRemoved.addListener((tabId) => {
  (async () => {
    // If worker restarted and memory cache is empty, reload from storage.
    if (!tabChatCache || Object.keys(tabChatCache).length === 0) {
      await hydrateCaches();
    }
    await exportFromCache(tabId, 'tabs.onRemoved');
  })();
});
