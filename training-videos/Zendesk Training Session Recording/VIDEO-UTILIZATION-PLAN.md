# Capelli Training Video → App Compatibility Plan

**Goal:** extract *everything* useful from the Zendesk Training Session Recording (~110 min, 14 worked tickets) and use it to make the CS Workflow Coach handle **every realistic scenario** an agent will face.

This document is the master map: **what the video gives us → how each piece becomes an app capability → priority.** Nothing here is committed; it's the plan we execute against.

---

## 0. Status — what's already built (2026-06)

- ✅ **Pipeline set up** — `ffmpeg` + `whisper-ctranslate2` installed; `scripts/video-to-text.ps1` turns any video into a transcript + frames.
- ✅ **Full transcript** of the 110-min session (`audio.srt`).
- ✅ **Illustrated walkthrough** doc for the order-status ticket (`Ticket-Walkthrough-Order-Status.md`).
- ✅ **In-app Visual Guides (video-first)** — per-step **short video clips** (with the screenshot as poster) play inside a step viewer. Surfaced **contextually inside the Ticket Coach** (the workflow runner) *and* in a new **/guides** hub. Clips/posters served behind login via `/api/guides/asset` (auth-gated, range-streamed). First guide: **order-status (11 steps)**.

**Next up:** more guides + "train the app on the video" (§7) + KB SOP/glossary + matching/decision-logic upgrades.

---

## 1. What the video uniquely contains (that our app doesn't yet)

Our current app knows the **email templates** and a set of complaint→workflow matches. The video adds the **operational layer** that the templates never captured:

- **The end-to-end process** (the 11-step backbone in the walkthrough) — duplicate check, "Take it", fulfillment lookup, multi-system status check, tagging, status setting, daily recap.
- **The systems map** — Zendesk, BigCommerce, the Outlook shipment inbox, SAP (VA05), UPS, and the FBB Orders Excel — *and which one to check for which question*.
- **The decision logic** — customer-error vs Capelli-error, which **status** to set, **who to escalate to** (Operations / supervisor "Dan" / ROLO), and *when*.
- **The tag taxonomy** — inquiry type, action, club, fulfillment (FBB/FBPA), priority.
- **Real phrasing** of 14 actual customer complaints (gold for matching).
- **Visual ground truth** — screenshots of every screen, for training and QA.

---

## 2. The 14 tickets (mined from the transcript) → matching + scenario coverage

| # | Customer says (real phrasing) | Type | Fault | Action | Status | Key rule |
|---|---|---|---|---|---|---|
| 1 | "status of my order" | Order status | — | ETA | Solved | Check BC→Inbox→UPS; give tracking + ETA |
| 2 | "received a red jersey instead of pink" | Wrong item | Capelli | Replacement | Pending | Request **evidence picture** first |
| 3 | "can you expedite my order? registered late" | Order status | — | Processing time | Solved | **No expedite**; 5-week processing |
| 4 | "change my player number to 16" | Order adjustment | — | On hold | Pending | Needs **coach confirmation**; put order on hold (email Ops) |
| 5 | "placed a duplicate order, cancel one" | Cancellation | Customer | Cancel/refund | Open | Check FBB list + SAP not delivered → email **ROLO** (CC mgr, ticket #) |
| 6 | "plain white shirt, no logo/design" | Wrong item | Capelli | — | Pending | Shopify=FBPA; request **evidence picture** |
| 7 | "backpack has no number, paid for it" | Missing number | **Customer** | None | Solved | Customer chose "No" for number = customer error; reorder+return |
| 8 | "ordered youth instead of adult, want exchange" | Return | Customer | — | Solved | **No exchanges**; send return policy, refund on return |
| 9 | "add items to my existing order" | Add items | — | — | Solved | **Cannot add** to an order; send template |
| 10 | "your size chart isn't accurate" | Size chart | — | — | — | Provide size chart; check team store (password/app) |
| 11 | "white short is a different size than black, both women's S" | Wrong size | Capelli | Replacement | **Open** | Create replacement order on BC, same address, internal note, open until shipped |
| 12 | "can't access cart / complete checkout" | Website | — | Processing time | Solved | Mandatory-kit items must stay; removing required item breaks checkout |
| 13 | "charged for the complimentary hoodie" (Socca Club) | General inquiry | — | Internal dept | **Open** | Known club issue → escalate to **Dan**; internal note |
| 14 | "number falling off jersey after 3 wears" | Decoration/defective | Capelli | — | Pending | Request **evidence picture** (defective item) |

**Use:** every row becomes (a) a refined matcher scenario with the real trigger phrasing, (b) a training/quiz case with a known-correct handling, and (c) a QA checklist reference. Several (7, 11, 12, 13) are **edge cases our matcher likely handles weakly today** — high-value additions.

---

## 3. The eleven ways to use this video

### A. Visual SOP / illustrated walkthroughs *(started)*
Per-scenario screenshot-by-screenshot guides like `Ticket-Walkthrough-Order-Status.md`. Best for onboarding new agents.
→ **App:** a "Training / How-to" section rendering these guides; embed in Knowledge Base.

### B. Process knowledge-base articles (the operational SOP)
Convert the backbone + status rules + systems map into KB docs the RAG/chat can answer from ("How do I set a ticket to Open vs Pending?", "Where do I check if an order shipped?").
→ **App:** new KB category **"Ticket Handling SOP"** (internal-only).

### C. Matching upgrades (trigger phrases + synonyms)
Feed the 14 real complaints + their correct workflow into the keyword/synonym/semantic layers and the intelligent brain's few-shot context. Add Zendesk-flavored synonyms (e.g. "evidence picture", "complimentary hoodie", "mandatory kit", "label created").
→ **App:** `synonyms.ts`, `default-workflows.ts`, `intelligent-match.ts` examples.

### D. Decision-logic / routing engine
Encode the rules: **fault attribution** (customer vs Capelli), **status to set**, **escalation target** (Ops / Dan / ROLO), **evidence-picture-required** flags.
→ **App:** extend the matcher result with `suggestedStatus`, `escalateTo`, `requiresEvidencePicture`, `faultLikely`.

### E. Tag taxonomy alignment
Make the Ticket Coach output mirror Zendesk's real fields: **Inquiry Type, Action, Club, Fulfillment (FBB/FBPA), Priority** — so an agent can copy them straight across.
→ **App:** structured "Zendesk tags" block in the Ticket Coach result.

### F. Systems checklist per inquiry
A dynamic "where to look" checklist (BC / Inbox / SAP VA05 / UPS / FBB Excel) tailored to the detected inquiry type.
→ **App:** checklist component in the coach output.

### G. Interactive training scenarios + quiz
Turn each ticket into a practice case: show the complaint, let the agent pick inquiry type/action/status, then reveal the trainer's answer.
→ **App:** the existing `training` + quiz features, seeded from the 14 cases.

### H. QA review rubric
Build a scored checklist from the SOP (checked duplicates? correct fulfillment? right status? internal note if Open? evidence picture requested when needed? ticket # in ROLO email?).
→ **App:** the existing `qa-review` feature gets a structured rubric.

### I. Glossary / acronym reference
FBB, FBPA, ROLO, ACP report, VA05, OBD/wave, FBB master list, "Take it", daily recap, mandatory kit, complimentary gift, evidence picture, Dan.
→ **App:** a glossary KB doc + inline tooltips in the coach.

### J. Macro/template gap analysis
Cross-check templates *used in the video* (FB tracking, evidence picture, return policy, cancellation/refund, processing time, replacement, can't-add-items) against the templates in the app — ensure each exists **verbatim** and is linked to the right workflow.
→ **App:** audit `default-workflows.ts` + email templates.

### K. Onboarding video index (timestamped)
A clickable index: "Order status → 10:38", "Player number change → 31:15", etc., so agents jump to the relevant teaching moment.
→ **App:** a reference doc / KB entry with timestamps.

### L. Video-clip step guides *(done — the chosen medium)*
Each guide step plays a **short clip** cut from the source video (screenshot = poster), not just a still — the agent sees the actual clicks and hears the trainer. This is now the default for new guides.
→ **App:** `<video>` step viewer in `VisualGuide`, clips served range-streamed behind login.

---

## 4. "Train the app on the video" — how the video makes the AI smarter

The video isn't just for humans to watch — its content feeds the app's matching brain and knowledge so the Ticket Coach gets measurably better. Concrete mechanics:

1. **Scenario dataset.** Turn each worked ticket into a labelled record: `{ complaint (real phrasing), inquiryType, action, fault, fulfillment, status, escalateTo, requiresEvidencePicture, workflowId }`. The 14 tickets here are the seed; every future training video appends more.
2. **Feed the keyword/synonym layer.** Real phrasings → new trigger phrases + synonyms (`synonyms.ts`), so "label created", "complimentary hoodie", "mandatory kit", "number falling off", "registered late" route correctly.
3. **Feed the intelligent brain.** Use the scenarios as **few-shot exemplars** in `intelligent-match.ts` (decomposition + correct routing), and add the operational context (FBB/FBPA, no-expedite, no-exchange, coach-confirmation) to its system prompt so it reasons like a trained agent.
4. **Decision metadata on workflows.** Add `suggestedStatus`, `escalateTo`, `requiresEvidencePicture`, `defaultFault` to each workflow (from §3-D) so the coach tells the agent not just *which* workflow but *how to close it*.
5. **KB / RAG.** SOP + glossary articles (§3-B, §3-I) become embeddings the chat answers from.
6. **Training Mode + QA.** Same dataset powers practice scenarios (§3-G) and the QA rubric (§3-H).
7. **Repeatable pipeline.** New video → `video-to-text.ps1` (transcript+frames) → clips → scenario records → the above. Each video compounds the app's competence.

> Quality gate: validate matching against the scenario set after each change (the brain already decomposes multi-issue tickets; we measure top-1 / top-3 accuracy on these labelled cases).

---

## 5. Data-quality & safety notes

- **Re-transcribe the back third before lifting verbatim email wording.** The first ~55 min transcribed cleanly; the back third is garbled (connection/echo). Procedures are clear; only exact template text needs a higher-fidelity pass (`small`/`medium` Whisper model).
- **PII is real.** Clips/screenshots show real customer names, addresses, order #s, and internal systems (SAP, possibly team-store passwords). They are served **only behind login** (never `/public`, never the public template endpoint). **Before committing to git, redact PII** (blur names/addresses/order#s; exclude password screens). This is the one open item before these assets are version-controlled.

---

## 6. Recommended execution order (phased)

**Phase 1 — Onboarding value (now)**
1. ✅ Video-clip order-status guide (in app).
2. More clip guides: player-number-change, wrong-size replacement, cancellation/refund, evidence-picture flow.
3. PII redaction pass on guide media → safe to commit.

**Phase 2 — Make the coach Zendesk-ready**
4. SOP KB articles (B) + glossary (I).
5. Matching + decision logic + tag taxonomy + systems checklist (C, D, E, F).
6. Template gap audit (J) — every macro exists verbatim.

**Phase 3 — Practice & quality**
7. Training scenarios + quiz (G), QA rubric (H).
8. Re-transcribe back third; mine remaining verbatim wording.
9. Timestamped video index (K).

---

## 7. Confirmed facts (from the team)

- **FBB = Fulfilled By Bangladesh.** **FBPA = Fulfilled By USA.** Order in the FBB Orders Excel → FBB; not found → FBPA; all Shopify/cappellisport.com → FBPA.
- Standard processing **5 weeks**; **no expedite**, **no exchanges**, **cannot add items** to an order; player number/name change needs **coach confirmation** (order put on hold via Operations).

**Still to confirm:** exact **ROLO** CC list; **"Dan"** role/owner; where the **daily recap** lives and its fields.
