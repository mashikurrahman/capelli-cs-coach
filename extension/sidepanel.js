import { matchWorkflows, matchTemplates, renderBody, derivePlaceholders, setSynonyms } from './matcher.js';

const APP_URL = 'https://bdcsteamassistant.vercel.app';
const TEMPLATES_ENDPOINT = `${APP_URL}/api/public/templates`;

const view = document.getElementById('view');
const syncStatus = document.getElementById('sync-status');
const homeBtn = document.getElementById('home-btn');

let WORKFLOWS = [];
let TEMPLATES = [];

const esc = (s) =>
  (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ─── Data loading ────────────────────────────────────────────────────────────
async function loadWorkflows() {
  try {
    const res = await fetch(chrome.runtime.getURL('data/workflows.json'));
    WORKFLOWS = await res.json();
  } catch { WORKFLOWS = []; }
  try {
    const res = await fetch(chrome.runtime.getURL('data/synonyms.json'));
    setSynonyms(await res.json());
  } catch { /* synonyms optional */ }
}

async function loadTemplates() {
  // Show cached immediately, then refresh from the app.
  const cached = await chrome.storage.local.get(['templates', 'syncedAt']);
  if (Array.isArray(cached.templates)) {
    TEMPLATES = cached.templates;
    syncStatus.textContent = `${TEMPLATES.length} templates · cached`;
  }
  try {
    const res = await fetch(TEMPLATES_ENDPOINT, { cache: 'no-store' });
    if (!res.ok) throw new Error('http ' + res.status);
    const data = await res.json();
    TEMPLATES = data.templates || [];
    await chrome.storage.local.set({ templates: TEMPLATES, syncedAt: data.syncedAt });
    syncStatus.textContent = `${TEMPLATES.length} templates · synced`;
  } catch {
    if (!TEMPLATES.length) syncStatus.textContent = 'Offline — templates unavailable';
    else syncStatus.textContent = `${TEMPLATES.length} templates · offline`;
  }
}

// Normalize a DB/workflow template into the shape the filler expects.
function asTemplate(t) {
  const placeholders = (t.placeholders && t.placeholders.length) ? t.placeholders : derivePlaceholders(t.body);
  return { ...t, placeholders };
}

// ─── Views ───────────────────────────────────────────────────────────────────
function setView(html) { view.innerHTML = html; }
function showHome(show) { homeBtn.hidden = !show; }

function renderInput(prefill = '') {
  showHome(false);
  setView(`
    <p class="muted mb6">Paste or right-click → <b>Coach this complaint</b> on the customer's message.</p>
    <textarea id="complaint" placeholder="Paste the customer's complaint here…">${esc(prefill)}</textarea>
    <div class="mt10"><button id="go" class="btn btn-primary">Find the right workflow</button></div>
    <button id="browse" class="back mt10">Browse all templates →</button>
  `);
  const ta = document.getElementById('complaint');
  ta.focus();
  document.getElementById('go').onclick = () => {
    const text = ta.value.trim();
    if (text) renderResults(text);
  };
  document.getElementById('browse').onclick = () => renderBrowse();
}

function renderResults(complaint) {
  showHome(true);
  const wfMatches = matchWorkflows(complaint, WORKFLOWS, 4);
  const tplMatches = matchTemplates(complaint, null, TEMPLATES.map(asTemplate), 5);

  const wfHtml = wfMatches.length
    ? wfMatches.map((m, i) => `
        <div class="card" data-wf="${i}">
          <div class="row"><span class="card-title">${esc(m.workflow.name)}</span>
            <span class="chip chip-cat">${esc((m.workflow.category || '').replace(/_/g, ' '))}</span></div>
          <div class="mb6">${m.matchedPhrases.slice(0, 5).map((p) => `<span class="chip">${esc(p)}</span>`).join('')}</div>
        </div>`).join('')
    : `<div class="empty">No workflow matched those words.<br/>Pick a template below or browse all.</div>`;

  const tplHtml = tplMatches.length
    ? tplMatches.map((t) => `<div class="card" data-tpl="${esc(t.id)}">
         <div class="row"><span class="card-title">${esc(t.name)}</span>
           <span class="chip chip-cat">${esc(t.category || 'Template')}</span></div></div>`).join('')
    : '';

  setView(`
    <button id="back" class="back">← New complaint</button>
    <div class="section-label">Suggested workflows</div>
    ${wfHtml}
    ${tplHtml ? `<div class="section-label">Matching email templates</div>${tplHtml}` : ''}
    <button id="browse" class="back mt10">Browse all templates →</button>
  `);

  document.getElementById('back').onclick = () => renderInput(complaint);
  document.getElementById('browse').onclick = () => renderBrowse(() => renderResults(complaint));
  view.querySelectorAll('[data-wf]').forEach((el) =>
    (el.onclick = () => renderWorkflow(wfMatches[+el.dataset.wf].workflow, complaint)));
  view.querySelectorAll('[data-tpl]').forEach((el) =>
    (el.onclick = () => {
      const t = TEMPLATES.find((x) => x.id === el.dataset.tpl);
      if (t) renderTemplate(asTemplate(t), () => renderResults(complaint));
    }));
}

function renderWorkflow(wf, complaint) {
  showHome(true);
  const tplMatches = matchTemplates(complaint, wf, TEMPLATES.map(asTemplate), 6);

  const steps = (wf.steps || []).map((s) => `
    <label class="check" data-step>
      <input type="checkbox" ${s.isRequired ? 'data-req' : ''}/>
      <div><div class="ct">${s.stepNumber}. ${esc(s.title)}${s.isRequired ? ' *' : ''}</div>
        ${s.description ? `<div class="cd">${esc(s.description)}</div>` : ''}
        ${s.agentAction ? `<div class="cd"><b>Do:</b> ${esc(s.agentAction)}</div>` : ''}
        ${s.warning ? `<div class="warn-line">⚠ ${esc(s.warning)}</div>` : ''}
      </div>
    </label>`).join('');

  const list = (arr) => (arr && arr.length) ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="small muted">—</p>';

  // The workflow's own suggested email + any matching library templates.
  const wfEmail = wf.customerEmailTemplate
    ? asTemplate({ id: 'wf:' + wf.workflowId, name: 'Suggested email (from workflow)', category: 'Workflow', subject: null, body: wf.customerEmailTemplate, keywords: [], placeholders: [] })
    : null;

  const tplCards = [
    ...(wfEmail ? [wfEmail] : []),
    ...tplMatches,
  ].map((t) => `<div class="card" data-tpl="${esc(t.id)}">
      <div class="row"><span class="card-title">${esc(t.name)}</span>
        <span class="chip chip-cat">${esc(t.category || 'Template')}</span></div></div>`).join('');

  setView(`
    <button id="back" class="back">← Back to matches</button>
    <div class="row"><h3 style="margin:0">${esc(wf.name)}</h3></div>
    <span class="chip chip-cat">${esc((wf.category || '').replace(/_/g, ' '))}</span>

    <div class="section-label">Steps to follow</div>
    ${steps || '<p class="small muted">No steps.</p>'}

    <div class="section-label">Do / Don't</div>
    <div class="do-dont">
      <div class="box box-do"><b class="small">Do</b>${list(wf.doRules)}</div>
      <div class="box box-dont"><b class="small">Don't</b>${list(wf.dontRules)}</div>
    </div>

    ${wf.requiredInfo && wf.requiredInfo.length ? `<div class="section-label">Info to collect</div><div class="box">${list(wf.requiredInfo)}</div>` : ''}
    ${wf.zendeskTags && wf.zendeskTags.length ? `<div class="section-label">Zendesk tags</div><div>${wf.zendeskTags.map((t) => `<span class="chip ${t.isRequired ? '' : 'chip-cat'}">${esc(t.tagName)}</span>`).join('')}</div>` : ''}

    <div class="section-label">Email template</div>
    ${tplCards || '<p class="small muted">No matching template — browse all below.</p>'}
    <button id="browse" class="back mt10">Browse all templates →</button>
  `);

  document.getElementById('back').onclick = () => renderResults(complaint);
  document.getElementById('browse').onclick = () => renderBrowse(() => renderWorkflow(wf, complaint));
  view.querySelectorAll('.check input').forEach((cb) =>
    (cb.onchange = () => cb.closest('.check').classList.toggle('done', cb.checked)));
  view.querySelectorAll('[data-tpl]').forEach((el) =>
    (el.onclick = () => {
      const id = el.dataset.tpl;
      const t = id.startsWith('wf:') ? wfEmail : TEMPLATES.find((x) => x.id === id);
      if (t) renderTemplate(asTemplate(t), () => renderWorkflow(wf, complaint));
    }));
}

function renderTemplate(tpl, backFn) {
  showHome(true);
  const placeholders = tpl.placeholders || [];
  const values = {};
  let manual = null; // hand-edited override

  setView(`
    <button id="back" class="back">← Back</button>
    <h3 style="margin:0 0 2px">${esc(tpl.name)}</h3>
    <p class="small muted mb10">${esc(tpl.category || 'Email template')}</p>

    ${placeholders.length ? `<div class="section-label">Fill in the details</div><div id="fields"></div>` : '<p class="small muted">No fields to fill — copy as-is.</p>'}

    <div class="section-label">Email preview <span class="small muted">(editable)</span></div>
    ${tpl.subject ? `<div class="subject" id="subj"></div>` : ''}
    <textarea id="preview" class="preview"></textarea>

    <div class="sticky-actions">
      <button id="copy" class="btn btn-primary">Copy email</button>
    </div>
  `);

  const preview = document.getElementById('preview');
  const subjEl = document.getElementById('subj');

  function refresh() {
    const body = manual != null ? manual : renderBody(tpl.body, values);
    if (manual == null) preview.value = body;
    if (subjEl) subjEl.innerHTML = `<b>Subject:</b> ${esc(renderBody(tpl.subject, values))}`;
  }

  if (placeholders.length) {
    const wrap = document.getElementById('fields');
    wrap.innerHTML = placeholders.map((p, i) =>
      `<label class="fld" for="f${i}">${esc(p)}</label><input type="text" id="f${i}" data-ph="${esc(p)}" placeholder="${esc(p)}" class="mb6"/>`).join('');
    wrap.querySelectorAll('input').forEach((inp) =>
      (inp.oninput = () => { values[inp.dataset.ph] = inp.value; if (manual == null) refresh(); }));
  }

  preview.oninput = () => { manual = preview.value; };
  refresh();

  document.getElementById('back').onclick = backFn;
  document.getElementById('copy').onclick = async () => {
    const body = manual != null ? manual : renderBody(tpl.body, values);
    const text = tpl.subject ? `Subject: ${renderBody(tpl.subject, values)}\n\n${body}` : body;
    try {
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById('copy');
      btn.textContent = '✓ Copied!';
      btn.classList.add('btn-ok');
      setTimeout(() => { btn.textContent = 'Copy email'; btn.classList.remove('btn-ok'); }, 1600);
    } catch { /* clipboard blocked */ }
  };
}

function renderBrowse(backFn) {
  showHome(true);
  const all = TEMPLATES.map(asTemplate);
  setView(`
    <button id="back" class="back">← Back</button>
    <input type="text" id="q" placeholder="Search templates by name, scenario, keyword…" class="mb10"/>
    <div id="list"></div>
  `);
  const listEl = document.getElementById('list');
  const draw = (items) => {
    listEl.innerHTML = items.length
      ? items.map((t) => `<div class="card" data-tpl="${esc(t.id)}">
          <div class="row"><span class="card-title">${esc(t.name)}</span>
            <span class="chip chip-cat">${esc(t.category || 'Template')}</span></div></div>`).join('')
      : '<div class="empty">No templates match.</div>';
    listEl.querySelectorAll('[data-tpl]').forEach((el) =>
      (el.onclick = () => {
        const t = all.find((x) => x.id === el.dataset.tpl);
        if (t) renderTemplate(t, () => renderBrowse(backFn));
      }));
  };
  draw(all);
  document.getElementById('q').oninput = (e) => {
    const n = e.target.value.toLowerCase().trim();
    draw(!n ? all : all.filter((t) =>
      t.name.toLowerCase().includes(n) ||
      (t.category || '').toLowerCase().includes(n) ||
      (t.keywords || []).some((k) => k.toLowerCase().includes(n))));
  };
  document.getElementById('back').onclick = backFn || (() => renderInput());
}

// ─── Wiring ──────────────────────────────────────────────────────────────────
homeBtn.onclick = () => renderInput();

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'NEW_COMPLAINT' && msg.text) renderResults(msg.text);
});

(async function init() {
  setView('<div class="empty">Loading…</div>');
  await Promise.all([loadWorkflows(), loadTemplates()]);
  const pending = await chrome.storage.session.get('pendingComplaint');
  if (pending && pending.pendingComplaint) {
    await chrome.storage.session.remove('pendingComplaint');
    renderResults(pending.pendingComplaint);
  } else {
    renderInput();
  }
})();
