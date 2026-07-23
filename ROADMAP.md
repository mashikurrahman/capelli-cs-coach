# Capelli CS Coach — Improvement Roadmap

Built one at a time. ✅ done · 🔨 in this batch · ⬜ queued.

## Exam / Certification system
- 🔨 **E1 — AI-assisted written grading.** The AI brain pre-scores each written answer against its model-answer key (suggested points + rationale); the grader reviews and overrides before finalizing.
- 🔨 **E2 — Per-competency breakdown & weak-area report.** Score per competency slot per person and across the team, so retraining is targeted ("weak on tracking & escalation"). Surfaced in the grade panel and the downloadable report.
- 🔨 **E3 — Admin-created exams on demand (Exam Sessions).** An admin opens a named exam window (twice weekly); members can only take an exam while a session is open; results group by session for over-time tracking.
- ✅ **E4 — Item analysis.** Flags questions almost everyone fails (≤40% — training gap or mis-keyed) and questions almost nobody misses (≥95% — too easy), across all submitted/graded attempts. In the admin "Item analysis" panel.
- ✅ **E5 — Timer + auto-submit.** Live countdown per session's time limit; auto-submits at zero; clock anchored to server start time so reopening can't reset it.
- ✅ **E6 — Attempt controls.** Locks a window once a member passes it; caps sittings per window (MAX_ATTEMPTS_PER_SESSION). (Per-attempt option shuffling deferred — the paper is already randomized per attempt.)
- ✅ **E7 — Pass certificate.** Print-ready certificate page (name / exam / score / date / cert ID) on a passed, graded exam; linked from the taker's review and the admin table.
- ✅ **E8 — "Review your mistakes" for takers.** After submitting, the taker reviews each MCQ (their pick vs correct answer), written answers with grader feedback + the model answer (once graded), a per-topic competency breakdown, and a certificate link if they passed.
- ⬜ **E9 — Question-bank admin UI.** Add / edit / retire questions in-app instead of re-seeding from files.
- ✅ **Per-exam reports.** Each exam window has its own report (scoped by `sessionId`) instead of one combined dump; the "All-exams report" remains for a full sweep.

## Broader app (from the ticket-data ideas)
- ⬜ **A1 — Automated QA rubric.** Score logged ticket sessions against the real failure modes; pre-flag risky ones.
- ⬜ **A2 — kNN "nearest real ticket" matcher signal.** Embed labelled tickets; route novel phrasings by nearest resolved example.
- ⬜ **A3 — Ticket-mix baseline analytics.** Surface the real ticket distribution and benchmark live volume against it.
- ⬜ **A4 — Embed agent scenarios into the knowledge base.** Make the resolved-ticket patterns retrievable + citable in the AI analyzer.
