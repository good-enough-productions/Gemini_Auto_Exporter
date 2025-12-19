// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'export_chat') {
    const blob = new Blob([message.payload], { type: 'text/markdown' });
    const reader = new FileReader();
    
    // We need to convert Blob to data URL to download in background script
    // Actually, chrome.downloads.download accepts a URL. 
    // We can create a data URL from the string directly.
    
    const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(message.payload);
    
    // Sanitize filename
    const filename = (message.title || 'gemini_chat').replace(/[^a-z0-9]/gi, '_').substring(0, 50) + 
                     `_${Date.now()}.md`;

    chrome.downloads.download({
      url: dataUrl,
      filename: `Gemini_Exports/${filename}`,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError);
      } else {
        console.log('Export started, ID:', downloadId);
      }
    });
  }
});
