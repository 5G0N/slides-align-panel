'use strict';
// Reopen the panel on the active Slides edit tab, including after the close button removed it.
chrome.action.onClicked.addListener(async (tab) => {
  if (!Number.isInteger(tab.id) || typeof tab.url !== 'string') return;
  let url;
  try { url = new URL(tab.url); } catch { return; }
  if (url.origin !== 'https://docs.google.com' || !/^\/presentation\//.test(url.pathname) || !/\/edit(?:\/|$)/.test(url.pathname)) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['panel.js'] });
  } catch (error) {
    console.warn('Slides Align Panel: could not reopen panel', error);
  }
});
