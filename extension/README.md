# Capelli CS Coach — Chrome Extension

A side-panel companion for your helpdesk (Zendesk, etc.). Match a customer
complaint to the right **workflow** and the right **verbatim email template**,
fill the placeholders, and copy — without leaving the ticket.

It's **self-contained**: workflow matching runs locally (no AI, no login).
Email templates **live-sync** from the web app's read-only feed and are cached
for offline use.

## Install (Load unpacked)

1. Open **chrome://extensions** in Chrome (or Edge: `edge://extensions`).
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this `extension/` folder.
4. Pin the **Capelli CS Coach** icon to your toolbar.

That's it. Click the icon to open the side panel, or right-click selected text
on any page → **Coach this complaint**.

## How to use

- **Right-click flow:** highlight the customer's message → right-click →
  *Coach this complaint*. The panel opens with suggested workflows + templates.
- **Paste flow:** click the toolbar icon → paste the complaint → *Find the right
  workflow*.
- Pick a workflow to see its **steps checklist**, do/don't, and the matching
  **email templates**. Open a template, fill the boxes, edit if needed, and
  **Copy email**. Templates are used verbatim — only the `[placeholders]` change.

## Updating

- **Templates** refresh automatically from the app each time the panel opens.
- **Workflows** are bundled. To refresh them after editing the source, run
  `npm run ext:data` at the repo root (regenerates `data/workflows.json`), then
  click **Reload** on the extension in `chrome://extensions`.

## Notes

- The template feed comes from `…/api/public/templates` (read-only, approved
  templates only). If you move the deployment, update `APP_URL` in
  `sidepanel.js` and the host in `manifest.json`.
- To publish to the team without "Load unpacked", zip this folder and upload it
  to the Chrome Web Store as a private/unlisted item.
