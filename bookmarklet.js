// Gemini Auto Exporter - Bookmarklet Version
// This is a simplified, single-file version that works as a bookmarklet in mobile browsers
// 
// To use:
// 1. Create a new bookmark in your browser
// 2. Copy the minified version below and paste it as the URL
// 3. When viewing a Gemini conversation, tap the bookmark to export
//
// MINIFIED VERSION (use this as bookmark URL):
// javascript:(function(){var messages=[];var elements=Array.from(document.querySelectorAll('user-query, model-response'));if(elements.length===0){elements=Array.from(document.querySelectorAll('.user-query, .model-response'));}if(elements.length===0){alert('No messages found. Make sure you are on a Gemini conversation page.');return;}elements.forEach(function(el){var role='Unknown';var tagName=el.tagName.toLowerCase();if(tagName.includes('user')||el.classList.contains('user-query')){role='User';}else if(tagName.includes('model')||el.classList.contains('model-response')){role='Gemini';}var content=el.innerText.trim();if(content){messages.push({role:role,content:content});}});if(messages.length===0){alert('No messages found in conversation.');return;}var title='Gemini Chat';try{var titleEl=document.querySelector('span.conversation-title.gds-title-m, .conversation-title, h1');if(titleEl&&titleEl.innerText){title=titleEl.innerText.trim();}}catch(e){}var date=new Date().toLocaleString();var url=window.location.href;var md='---\n';md+='title: "'+title.replace(/"/g,'\\"')+'"\n';md+='date: "'+date+'"\n';md+='source: "'+url+'"\n';md+='exported_via: "bookmarklet"\n';md+='---\n\n';md+='# '+title+'\n\n';md+='Date: '+date+'\n\n---\n\n';messages.forEach(function(msg){md+='## '+msg.role+'\n\n'+msg.content+'\n\n';});var blob=new Blob([md],{type:'text/markdown'});var downloadUrl=URL.createObjectURL(blob);var a=document.createElement('a');a.href=downloadUrl;var filename=title.replace(/[^a-z0-9\-\s]/gi,'_').replace(/\s+/g,'_').substring(0,80).replace(/^_+|_+$/g,'')||'gemini_chat';a.download=filename+'_'+Date.now()+'.md';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(downloadUrl);alert('Exported '+messages.length+' messages to '+a.download);})();

// READABLE VERSION (for understanding the code):
(function() {
    var messages = [];
    
    // Try to find message elements
    var elements = Array.from(document.querySelectorAll('user-query, model-response'));
    
    // Fallback to class-based selectors
    if (elements.length === 0) {
        elements = Array.from(document.querySelectorAll('.user-query, .model-response'));
    }
    
    if (elements.length === 0) {
        alert('No messages found. Make sure you are on a Gemini conversation page.');
        return;
    }
    
    // Extract messages
    elements.forEach(function(el) {
        var role = 'Unknown';
        var tagName = el.tagName.toLowerCase();
        
        if (tagName.includes('user') || el.classList.contains('user-query')) {
            role = 'User';
        } else if (tagName.includes('model') || el.classList.contains('model-response')) {
            role = 'Gemini';
        }
        
        var content = el.innerText.trim();
        if (content) {
            messages.push({
                role: role,
                content: content
            });
        }
    });
    
    if (messages.length === 0) {
        alert('No messages found in conversation.');
        return;
    }
    
    // Get conversation title
    var title = 'Gemini Chat';
    try {
        var titleEl = document.querySelector('span.conversation-title.gds-title-m, .conversation-title, h1');
        if (titleEl && titleEl.innerText) {
            title = titleEl.innerText.trim();
        }
    } catch(e) {}
    
    // Build markdown
    var date = new Date().toLocaleString();
    var url = window.location.href;
    
    var md = '---\n';
    md += 'title: "' + title.replace(/"/g, '\\"') + '"\n';
    md += 'date: "' + date + '"\n';
    md += 'source: "' + url + '"\n';
    md += 'exported_via: "bookmarklet"\n';
    md += '---\n\n';
    md += '# ' + title + '\n\n';
    md += 'Date: ' + date + '\n\n---\n\n';
    
    messages.forEach(function(msg) {
        md += '## ' + msg.role + '\n\n' + msg.content + '\n\n';
    });
    
    // Create download
    var blob = new Blob([md], {type: 'text/markdown'});
    var downloadUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = downloadUrl;
    
    // Sanitize filename
    var filename = title
        .replace(/[^a-z0-9\-\s]/gi, '_')
        .replace(/\s+/g, '_')
        .substring(0, 80)
        .replace(/^_+|_+$/g, '') || 'gemini_chat';
    
    a.download = filename + '_' + Date.now() + '.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    
    alert('Exported ' + messages.length + ' messages to ' + a.download);
})();
