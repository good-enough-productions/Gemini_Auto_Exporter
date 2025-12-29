# Android Compatibility Guide

## Overview

The Gemini Auto Exporter is a browser extension designed for desktop Chrome. However, you can use it on Android devices with some workarounds. This guide explains your options for auto-exporting Gemini conversations on Android.

## Option 1: Use Kiwi Browser (Recommended)

**Kiwi Browser** is a Chromium-based Android browser that supports Chrome extensions.

### Installation Steps:

1. **Install Kiwi Browser**
   - Download from [Google Play Store](https://play.google.com/store/apps/details?id=com.kiwibrowser.browser)

2. **Enable Desktop Mode** (recommended for best Gemini compatibility)
   - Open Kiwi Browser
   - Tap the three-dot menu → Settings → Accessibility
   - Enable "Desktop site" by default (optional but recommended)

3. **Install the Extension**
   - Open Kiwi Browser
   - Navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in top-right)
   - Download or clone this repository to your device
   - Tap "Load unpacked" (or "+ (from .zip/.crx/.user.js)")
   - Navigate to the folder containing the extension files
   - Select the folder and load it

4. **Use Gemini**
   - Navigate to https://gemini.google.com
   - Start chatting - the extension will work exactly like on desktop
   - Export buttons will appear in the bottom-right corner
   - Conversations auto-save every 5 seconds
   - Files download to your Android Downloads folder

### Notes:
- Kiwi Browser has full support for Manifest V3 extensions
- Download locations may vary based on your Android device
- You may need a file manager app to organize exported files
- Consider using Google Drive or a similar app to sync exports to the cloud

## Option 2: Use Firefox for Android

**Firefox for Android** supports a limited set of extensions, but you may be able to install this extension with some extra steps.

### Installation Steps:

1. **Install Firefox Nightly** (supports custom extension collections)
   - Download from [Google Play Store](https://play.google.com/store/apps/details?id=org.mozilla.fenix)

2. **Create a Custom Add-on Collection** (requires desktop)
   - Visit https://addons.mozilla.org
   - Sign in with your Firefox account
   - Create a new collection
   - The extension would need to be packaged and uploaded to AMO (Mozilla Add-ons)

### Current Limitation:
- This extension is not yet available on the Firefox Add-ons store
- Consider this option for future compatibility

## Option 3: Use Chrome on Android with Desktop Mode

Modern versions of Chrome for Android have limited extension support, but you can use the mobile browser with Desktop Mode.

### Steps:

1. **Open Chrome on Android**
2. **Navigate to Gemini**
   - Go to https://gemini.google.com
3. **Enable Desktop Site**
   - Tap the three-dot menu → ☑️ Desktop site
4. **Manual Export Workaround**
   - Since extensions don't work in standard Chrome for Android, you'll need to manually copy/paste conversations
   - Use the bookmarklet option below for a better experience

## Option 4: Bookmarklet (Works in Most Browsers)

For browsers that don't support extensions, you can use a bookmarklet - a piece of JavaScript that runs when you click a bookmark.

### Installation:

1. **Create a bookmark** in your mobile browser with this URL:

```javascript
javascript:(function(){var messages=[];document.querySelectorAll('user-query, model-response').forEach(el=>{var role=el.tagName.toLowerCase().includes('user')?'User':'Gemini';var content=el.innerText.trim();if(content)messages.push({role,content});});if(messages.length===0){alert('No messages found!');return;}var md='# Gemini Chat\n\n';messages.forEach(msg=>{md+='## '+msg.role+'\n\n'+msg.content+'\n\n';});var blob=new Blob([md],{type:'text/markdown'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='gemini_chat_'+Date.now()+'.md';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);})();
```

2. **Name the bookmark** something like "Export Gemini Chat"

3. **Usage:**
   - Navigate to a Gemini conversation
   - Tap the bookmark to export the current conversation
   - The file will download to your device

### Bookmarklet Limitations:
- No auto-save functionality
- Manual trigger required
- No bucket organization
- No automatic export on tab close
- May not work in all mobile browsers

## Option 5: Use Desktop Mode on Tablet

If you have an Android tablet, the desktop browsing experience is closer to a laptop:

1. Use Chrome, Kiwi, or Firefox on your tablet
2. Enable Desktop Site mode
3. Install the extension (if supported)
4. Enjoy a near-desktop experience

## Comparison Table

| Feature | Kiwi Browser | Firefox Android | Chrome Android | Bookmarklet |
|---------|--------------|-----------------|----------------|-------------|
| Full Extension Support | ✅ Yes | ⚠️ Limited | ❌ No | N/A |
| Auto-save | ✅ Yes | ⚠️ Maybe | ❌ No | ❌ No |
| Export Buckets | ✅ Yes | ⚠️ Maybe | ❌ No | ❌ No |
| Export on Close | ✅ Yes | ⚠️ Maybe | ❌ No | ❌ No |
| Manual Export | ✅ Yes | ⚠️ Maybe | ✅ Bookmarklet | ✅ Yes |
| Easy Setup | ✅ Easy | ⚠️ Complex | ✅ Easy | ✅ Easy |
| Recommended | ✅ **Best** | ⚠️ Experimental | ❌ Limited | ⚠️ Fallback |

## Future Possibilities

### Native Android App
Creating a native Android app that:
- Monitors Gemini web sessions
- Provides export functionality
- Syncs to cloud storage
- **Status**: Not currently planned (requires significant development)

### Tampermonkey/Userscript
Similar to bookmarklet but more powerful:
- Install Tampermonkey in Kiwi Browser
- Add a userscript version of the extension
- **Status**: Possible future enhancement

### API-based Solution
If Google provides an official Gemini API for conversation export:
- Could build a dedicated Android app
- Would be more reliable than web scraping
- **Status**: Waiting for official API

## Troubleshooting

### Downloads Not Working
- Check browser download permissions
- Check storage permissions on Android
- Try a different download folder
- Check available storage space

### Extension Not Loading
- Ensure Developer Mode is enabled
- Verify all extension files are present
- Try reloading the extension
- Check browser console for errors

### UI Elements Not Showing
- Refresh the Gemini page
- Clear browser cache
- Try Desktop Mode
- Check if Gemini's DOM structure changed

### Files Not Accessible
- Use a file manager app (like Google Files)
- Check the Downloads folder
- Look in `Downloads/Gemini_Exports/`
- Some browsers use custom download locations

## Recommended Setup for Android

**Best Overall Experience:**
1. Install **Kiwi Browser**
2. Load the extension using Developer Mode
3. Use Desktop Site mode for Gemini
4. Export conversations with full functionality
5. Use a file sync app (Google Drive, Dropbox) to backup exports

**Quick & Simple:**
1. Install Kiwi Browser
2. Save the bookmarklet
3. Manually export when needed

## Contributing

If you find better ways to use this on Android, please contribute to this guide!

## Support

For issues specific to Android:
- Check browser compatibility first
- Test in Desktop Mode
- Try the bookmarklet fallback
- Report Kiwi Browser-specific issues separately

---

**Last Updated**: December 2024
