// Service worker: wires the context menu, opens the side panel, and stashes the
// selected complaint for the panel to pick up.

const MENU_ID = 'cs-coach-selection';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Coach this complaint',
    contexts: ['selection'],
  });
  // Clicking the toolbar icon opens the side panel.
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  // Stash for the panel's initial load…
  await chrome.storage.session.set({ pendingComplaint: info.selectionText });

  // …open the panel (this click is a valid user gesture)…
  if (tab && tab.id != null) {
    try { await chrome.sidePanel.open({ tabId: tab.id }); } catch (e) { /* already open */ }
  }

  // …and nudge it live in case it was already open.
  chrome.runtime.sendMessage({ type: 'NEW_COMPLAINT', text: info.selectionText }).catch(() => {});
});
