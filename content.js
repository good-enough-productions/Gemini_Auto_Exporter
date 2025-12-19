// content.js

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

  const title = document.title || 'Gemini Chat';
  const date = new Date().toLocaleString();
  
  let md = `# ${title}\n\nDate: ${date}\n\n---\n\n`;

  messages.forEach(msg => {
    md += `## ${msg.role}\n\n${msg.content}\n\n`;
  });

  return md;
}

// Listen for page unload
window.addEventListener('pagehide', () => {
  console.log('Gemini Auto Exporter: Page hiding...');
  const messages = getChatContent();
  const markdown = formatMarkdown(messages);

  if (markdown) {
    // Send to background script
    // We use a try-catch because sending messages during unload can be flaky
    try {
      console.log('Gemini Auto Exporter: Attempting to send message...');
      chrome.runtime.sendMessage({
        action: 'export_chat',
        payload: markdown,
        title: document.title || 'gemini_chat'
      }, (response) => {
         // Optional callback to check if received
         if (chrome.runtime.lastError) {
             console.error('Gemini Auto Exporter: Send failed', chrome.runtime.lastError);
         } else {
             console.log('Gemini Auto Exporter: Send successful');
         }
      });
    } catch (e) {
      console.error('Failed to send export message', e);
    }
  }
});

// Add a manual export button for testing/fallback
function addManualExportButton() {
  const btn = document.createElement('button');
  btn.innerText = 'Export Chat';
  btn.id = 'gemini-auto-export-btn';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '9999';
  btn.style.padding = '10px 20px';
  btn.style.backgroundColor = '#1a73e8';
  btn.style.color = 'white';
  btn.style.border = 'none';
  btn.style.borderRadius = '24px';
  btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  btn.style.cursor = 'pointer';
  btn.style.fontWeight = 'bold';
  
  btn.onclick = () => {
    const messages = getChatContent();
    console.log('Manual export clicked. Messages found:', messages.length);
    const markdown = formatMarkdown(messages);
    if (markdown) {
      chrome.runtime.sendMessage({
        action: 'export_chat',
        payload: markdown,
        title: document.title || 'gemini_chat'
      });
    } else {
      alert('No chat content found to export. Please check console for details.');
    }
  };
  
  document.body.appendChild(btn);
}

// Run on load
// Use a slight delay to ensure DOM is ready or MutationObserver if needed
setTimeout(addManualExportButton, 2000);

// Optional: Auto-save to storage periodically in case pagehide fails
let lastContent = '';
setInterval(() => {
  const messages = getChatContent();
  const markdown = formatMarkdown(messages);
  if (markdown && markdown !== lastContent) {
    lastContent = markdown;
    chrome.storage.local.set({ 'latest_chat_draft': markdown });
  }
}, 5000);
