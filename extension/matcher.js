// Deterministic matcher — a faithful port of src/lib/workflows/match.ts.
// No AI, no network: pure keyword scoring. Kept in sync with the web app.

export function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Synonym expansion (mirrors src/lib/workflows/synonyms.ts). Loaded from
// data/synonyms.json at runtime via setSynonyms(); maps paraphrases to the
// canonical terms used in trigger phrases ("has a hole" -> "damaged").
let SYNONYMS = {};
export function setSynonyms(map) { SYNONYMS = map || {}; }

export function expandForMatch(text) {
  const base = ' ' + normalize(text) + ' ';
  const extras = [];
  for (const canonical in SYNONYMS) {
    const aliases = SYNONYMS[canonical] || [];
    for (const alias of aliases) {
      const a = normalize(alias);
      if (a && base.includes(a)) { extras.push(canonical); break; }
    }
  }
  return (normalize(text) + (extras.length ? ' ' + extras.join(' ') : '')).trim();
}

export function matchWorkflows(complaint, workflows, limit = 4) {
  const text = ' ' + expandForMatch(complaint) + ' ';
  return workflows
    .map((workflow) => {
      const matchedPhrases = [];
      let score = 0;
      for (const phrase of workflow.triggerPhrases || []) {
        const p = normalize(phrase);
        if (!p) continue;
        if (text.includes(' ' + p + ' ') || text.includes(p)) {
          matchedPhrases.push(phrase);
          score += Math.min(4, p.split(' ').length + 1);
        }
      }
      return { workflow, score, matchedPhrases };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.workflow.sortOrder - b.workflow.sortOrder)
    .slice(0, limit);
}

export function matchTemplates(complaint, workflow, templates, limit = 6) {
  const hay = expandForMatch(
    [complaint, workflow?.name, ...((workflow?.triggerPhrases) || [])].filter(Boolean).join(' ')
  );

  return templates
    .map((t) => {
      let score = 0;
      for (const kw of t.keywords || []) {
        const k = normalize(kw);
        if (k && hay.includes(k)) score += Math.min(3, k.split(' ').length + 1);
      }
      for (const word of normalize(t.name).split(' ')) {
        if (word.length > 3 && hay.includes(word)) score += 1;
      }
      return { t, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.t);
}

// Fill [placeholders] with the agent's values; leave un-filled ones intact.
export function renderBody(body, values) {
  return (body || '').replace(/\[([^\]]+)\]/g, (match, name) => {
    const v = values[name];
    return v && v.trim() ? v : match;
  });
}

// Derive placeholders from a body if the template didn't carry them.
export function derivePlaceholders(body) {
  const set = new Set();
  const re = /\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(body || ''))) set.add(m[1]);
  return Array.from(set);
}
