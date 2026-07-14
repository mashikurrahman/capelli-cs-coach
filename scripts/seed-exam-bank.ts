/**
 * Seeds the Certification Exam question bank from the authored exams/ Markdown.
 *
 *  - Section A (Q1–Q10) of each set  -> WRITTEN questions (slot = 1..10), the
 *    matching answer-key block becomes the grader's modelAnswer.
 *  - Section B (Q11–Q30) of each set -> MCQ questions with options + correctIndex
 *    (from the key's answer table).
 *
 * Dry-run by default (parses + prints counts, no DB write).
 * Pass --commit to upsert into the database (stable ids, so it's idempotent).
 *
 *   npx tsx scripts/seed-exam-bank.ts            # verify parsing
 *   npx tsx scripts/seed-exam-bank.ts --commit   # write to DB
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const EXAMS = join(process.cwd(), 'exams');
const SETS = [1, 2, 3, 4, 5, 6, 7];

const SLOT_LABEL: Record<number, string> = {
  1: 'Shipping & tracking',
  2: 'Processing time / ETA / no-expedite',
  3: 'Defective / wrong item (evidence + replacement)',
  4: 'Returns & exchanges policy',
  5: 'Cancellation & refunds',
  6: 'Ordering help',
  7: 'Club-controlled (links / roster / passwords)',
  8: 'Out of stock',
  9: 'Escalation & leak-trap',
  10: 'Wildcard (multi-issue / spot-the-mistake)',
};

function cleanInline(s: string): string {
  return s.replace(/^\s*[-*]\s+/, '• ').replace(/\*/g, '').replace(/`/g, '').replace(/^\s*>\s?/, '').trim();
}

interface Written { id: string; slot: number; sourceSet: number; prompt: string; modelAnswer: string; }
interface Mcq { id: string; sourceSet: number; prompt: string; options: string[]; correctIndex: number; }

function parseSet(set: number): { written: Written[]; mcq: Mcq[] } {
  const qLines = readFileSync(join(EXAMS, 'questions', `set-${set}.md`), 'utf8').replace(/\r\n/g, '\n').split('\n');
  const kText = readFileSync(join(EXAMS, 'answer-keys', `set-${set}-key.md`), 'utf8').replace(/\r\n/g, '\n');
  const kLines = kText.split('\n');

  // --- written prompts (Q1..Q10) ---
  const writtenPrompts = new Map<number, string>();
  let cur: number | null = null;
  let buf: string[] = [];
  const flush = () => { if (cur !== null && cur <= 10) writtenPrompts.set(cur, buf.map(cleanInline).filter(Boolean).join('\n')); buf = []; };
  for (const line of qLines) {
    const m = line.match(/^\*\*Q(\d+)\b/);
    if (m) { flush(); cur = Number(m[1]); buf = [line.replace(/^\*\*Q\d+\.?\s*/, '').replace(/\*\*/g, '')]; continue; }
    if (/^##\s|^---\s*$/.test(line)) { flush(); cur = null; continue; }
    if (cur !== null) buf.push(line);
  }
  flush();

  // --- MCQ stems + options (Q11..Q30) ---
  const mcqStem = new Map<number, string>();
  const mcqOpts = new Map<number, string[]>();
  cur = null; let opts: string[] = [];
  const flushMcq = () => { if (cur !== null && opts.length) mcqOpts.set(cur, opts); opts = []; };
  for (const line of qLines) {
    const m = line.match(/^\*\*(\d+)\.\*\*\s*(.*)/);
    if (m && Number(m[1]) >= 11) { flushMcq(); cur = Number(m[1]); mcqStem.set(cur, cleanInline(m[2])); continue; }
    const o = line.match(/^\s*-\s*[A-D]\)\s*(.*)/);
    if (o && cur !== null) { opts.push(cleanInline(o[1])); continue; }
    if (/^\*\*\d+\.\*\*/.test(line) || /^##\s/.test(line)) { flushMcq(); }
  }
  flushMcq();

  // --- written model answers from the key (Q1 — ... blocks) ---
  const writtenKey = new Map<number, string>();
  cur = null; buf = [];
  const flushKey = () => { if (cur !== null && cur <= 10) writtenKey.set(cur, buf.map(cleanInline).filter(Boolean).join('\n')); buf = []; };
  for (const line of kLines) {
    const m = line.match(/^\*\*Q(\d+)\s*[—-]\s*(.*)/);
    if (m) { flushKey(); cur = Number(m[1]); buf = [cleanInline(m[2])]; continue; }
    if (/^##\s|^---\s*$/.test(line)) { flushKey(); cur = null; continue; }
    if (cur !== null) buf.push(line);
  }
  flushKey();

  // --- MCQ answers from the key table (| 11 | A | ...) ---
  const mcqAnswer = new Map<number, number>();
  for (const line of kLines) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    for (let i = 0; i + 1 < cells.length; i += 2) {
      const n = Number(cells[i]); const letter = cells[i + 1];
      if (Number.isFinite(n) && /^[A-D]$/.test(letter)) mcqAnswer.set(n, letter.charCodeAt(0) - 65);
    }
  }

  const written: Written[] = [];
  for (let n = 1; n <= 10; n++) {
    written.push({
      id: `w-s${set}-q${n}`,
      slot: n,
      sourceSet: set,
      prompt: writtenPrompts.get(n) ?? '',
      modelAnswer: writtenKey.get(n) ?? '',
    });
  }
  const mcq: Mcq[] = [];
  for (let n = 11; n <= 30; n++) {
    const options = mcqOpts.get(n) ?? [];
    const correctIndex = mcqAnswer.get(n);
    mcq.push({
      id: `m-s${set}-q${n}`,
      sourceSet: set,
      prompt: mcqStem.get(n) ?? '',
      options,
      correctIndex: correctIndex ?? -1,
    });
  }
  return { written, mcq };
}

async function main() {
  const commit = process.argv.includes('--commit');
  const allWritten: Written[] = [];
  const allMcq: Mcq[] = [];
  const problems: string[] = [];

  for (const set of SETS) {
    const { written, mcq } = parseSet(set);
    for (const w of written) {
      if (!w.prompt) problems.push(`${w.id}: empty prompt`);
      if (!w.modelAnswer) problems.push(`${w.id}: empty model answer`);
    }
    for (const m of mcq) {
      if (!m.prompt) problems.push(`${m.id}: empty stem`);
      if (m.options.length !== 4) problems.push(`${m.id}: ${m.options.length} options (expected 4)`);
      if (m.correctIndex < 0 || m.correctIndex > 3) problems.push(`${m.id}: bad correctIndex`);
    }
    allWritten.push(...written);
    allMcq.push(...mcq);
  }

  console.log(`Parsed: ${allWritten.length} written + ${allMcq.length} MCQ = ${allWritten.length + allMcq.length} questions`);
  if (problems.length) {
    console.log(`\n⚠ ${problems.length} issue(s):`);
    for (const p of problems.slice(0, 40)) console.log('  - ' + p);
  } else {
    console.log('✓ No parsing issues — every question is complete.');
  }

  // Spot-check sample
  console.log('\nSample written:', JSON.stringify(allWritten[0], null, 2).slice(0, 400));
  console.log('\nSample MCQ:', JSON.stringify(allMcq[0], null, 2).slice(0, 400));

  if (!commit) {
    console.log('\n(dry run — pass --commit to write to the database)');
    return;
  }
  if (problems.length) {
    console.log('\n✗ Refusing to seed while there are parsing issues. Fix them first.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  let n = 0;
  for (const w of allWritten) {
    const data = {
      type: 'WRITTEN' as const, slot: w.slot, competency: SLOT_LABEL[w.slot], sourceSet: w.sourceSet,
      difficulty: 'INTERMEDIATE' as const, prompt: w.prompt, options: [], correctIndex: null,
      modelAnswer: w.modelAnswer, points: 6, isActive: true,
    };
    await prisma.examQuestion.upsert({ where: { id: w.id }, update: data, create: { id: w.id, ...data } });
    n++;
  }
  for (const m of allMcq) {
    const data = {
      type: 'MCQ' as const, slot: null, competency: 'MCQ', sourceSet: m.sourceSet,
      difficulty: 'INTERMEDIATE' as const, prompt: m.prompt, options: m.options, correctIndex: m.correctIndex,
      modelAnswer: null, points: 2, isActive: true,
    };
    await prisma.examQuestion.upsert({ where: { id: m.id }, update: data, create: { id: m.id, ...data } });
    n++;
  }
  await prisma.$disconnect();
  console.log(`\n✓ Seeded ${n} questions into the bank.`);
}

main().catch(e => { console.error(e); process.exit(1); });
