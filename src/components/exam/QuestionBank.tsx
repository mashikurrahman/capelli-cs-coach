'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Pencil, Archive, RotateCcw, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/components/ui/use-toast';

type QType = 'MCQ' | 'WRITTEN';
type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface Question {
  id: string; type: QType; slot: number | null; competency: string; difficulty: Difficulty;
  prompt: string; options: string[]; correctIndex: number | null; modelAnswer: string | null;
  points: number; isActive: boolean; usedCount: number;
}

interface Draft {
  id?: string; type: QType; slot: number | null; competency: string; difficulty: Difficulty;
  prompt: string; options: string[]; correctIndex: number | null; modelAnswer: string; points: string;
}

const DIFFICULTIES: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const LETTER = (i: number) => String.fromCharCode(65 + i);

function emptyDraft(type: QType, slots: Record<string, string>): Draft {
  const firstSlot = Number(Object.keys(slots)[0] ?? 1);
  return {
    type, difficulty: 'INTERMEDIATE',
    slot: type === 'WRITTEN' ? firstSlot : null,
    competency: type === 'WRITTEN' ? (slots[String(firstSlot)] ?? '') : 'Multiple choice',
    prompt: '', options: ['', '', '', ''], correctIndex: null, modelAnswer: '', points: type === 'MCQ' ? '2' : '6',
  };
}

function toDraft(q: Question): Draft {
  return {
    id: q.id, type: q.type, slot: q.slot, competency: q.competency, difficulty: q.difficulty,
    prompt: q.prompt, options: q.type === 'MCQ' ? [...q.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
    correctIndex: q.correctIndex, modelAnswer: q.modelAnswer ?? '', points: String(q.points),
  };
}

export default function QuestionBank() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | QType>('all');
  const [showRetired, setShowRetired] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/exam/admin/questions');
    const data = await res.json();
    if (res.ok) { setQuestions(data.questions); setSlots(data.slots ?? {}); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const visible = useMemo(
    () => questions.filter((q) => (filter === 'all' || q.type === filter) && (showRetired || q.isActive)),
    [questions, filter, showRetired]
  );
  const activeMcq = questions.filter((q) => q.type === 'MCQ' && q.isActive).length;
  const activeWritten = questions.filter((q) => q.type === 'WRITTEN' && q.isActive).length;

  async function retire(q: Question) {
    const res = await fetch(`/api/exam/admin/questions/${q.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (res.ok) { toast({ title: d.deleted ? 'Question deleted' : 'Question retired', variant: 'success' }); load(); }
    else toast({ title: d.error || 'Could not remove it', variant: 'destructive' });
  }
  async function restore(q: Question) {
    const res = await fetch(`/api/exam/admin/questions/${q.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: true }),
    });
    if (res.ok) { toast({ title: 'Question restored', variant: 'success' }); load(); }
  }

  if (draft) {
    return <QuestionEditor draft={draft} slots={slots} onCancel={() => setDraft(null)} onSaved={() => { setDraft(null); load(); }} />;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-gray-800">Question bank</h3>
          <p className="text-xs text-gray-500">
            {activeWritten} active written · {activeMcq} active MCQ. Exams draw 1 written per slot (1–10) + 20 random MCQ,
            so keep every written slot stocked.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setDraft(emptyDraft('WRITTEN', slots))} className="gap-1.5">
            <Plus className="w-4 h-4" /> Written
          </Button>
          <Button size="sm" onClick={() => setDraft(emptyDraft('MCQ', slots))} className="gap-1.5 bg-capelli-navy hover:bg-blue-900">
            <Plus className="w-4 h-4" /> MCQ
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs flex-wrap">
        {(['all', 'WRITTEN', 'MCQ'] as const).map((f) => (
          <button
            key={f} onClick={() => setFilter(f)}
            className={cn('px-2.5 py-1 rounded-full font-medium', filter === f ? 'bg-capelli-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          >
            {f === 'all' ? 'All' : f === 'WRITTEN' ? 'Written' : 'MCQ'}
          </button>
        ))}
        <label className="ml-2 inline-flex items-center gap-1.5 text-gray-500 cursor-pointer">
          <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} className="rounded border-gray-300" />
          Show retired
        </label>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">No questions match.</p>
      ) : (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {visible.map((q) => (
            <div key={q.id} className={cn('flex items-start gap-3 py-3', !q.isActive && 'opacity-55')}>
              <span className={cn('mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0',
                q.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>
                {q.type === 'MCQ' ? 'MCQ' : `S${q.slot}`}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 line-clamp-2">{q.prompt}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {q.competency} · {q.points} pts · {q.difficulty.toLowerCase()}
                  {q.usedCount > 0 && ` · used in ${q.usedCount} answer${q.usedCount === 1 ? '' : 's'}`}
                  {!q.isActive && ' · retired'}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setDraft(toDraft(q))} title="Edit" className="p-1.5 text-gray-400 hover:text-capelli-navy hover:bg-gray-50 rounded">
                  <Pencil className="w-4 h-4" />
                </button>
                {q.isActive ? (
                  <button onClick={() => retire(q)} title={q.usedCount > 0 ? 'Retire' : 'Delete'} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                    {q.usedCount > 0 ? <Archive className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                ) : (
                  <button onClick={() => restore(q)} title="Restore" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionEditor({ draft, slots, onCancel, onSaved }: { draft: Draft; slots: Record<string, string>; onCancel: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [d, setD] = useState<Draft>(draft);
  const [saving, setSaving] = useState(false);
  const isMcq = d.type === 'MCQ';
  const editing = !!d.id;

  function set<K extends keyof Draft>(key: K, val: Draft[K]) { setD((p) => ({ ...p, [key]: val })); }
  function setOption(i: number, val: string) { setD((p) => ({ ...p, options: p.options.map((o, oi) => (oi === i ? val : o)) })); }

  function pickSlot(slot: number) {
    setD((p) => ({ ...p, slot, competency: slots[String(slot)] ?? p.competency }));
  }

  async function save() {
    const payload = {
      type: d.type,
      competency: d.competency.trim(),
      slot: isMcq ? null : d.slot,
      difficulty: d.difficulty,
      prompt: d.prompt.trim(),
      options: isMcq ? d.options.map((o) => o.trim()).filter(Boolean) : undefined,
      correctIndex: isMcq ? d.correctIndex : null,
      modelAnswer: isMcq ? null : d.modelAnswer.trim(),
      points: Number(d.points) || (isMcq ? 2 : 6),
    };
    setSaving(true);
    const res = await fetch(editing ? `/api/exam/admin/questions/${d.id}` : '/api/exam/admin/questions', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { toast({ title: editing ? 'Question updated' : 'Question added', variant: 'success' }); onSaved(); }
    else toast({ title: data.error || 'Could not save', variant: 'destructive' });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{editing ? 'Edit' : 'New'} {isMcq ? 'multiple-choice' : 'written'} question</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
      </div>

      {!isMcq && (
        <div>
          <label className="text-xs font-semibold text-gray-500">Competency slot</label>
          <select
            value={d.slot ?? ''} onChange={(e) => pickSlot(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {Object.entries(slots).map(([n, label]) => <option key={n} value={n}>{n}. {label}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-gray-500">{isMcq ? 'Question' : 'Scenario / prompt'}</label>
        <textarea
          value={d.prompt} onChange={(e) => set('prompt', e.target.value)}
          placeholder={isMcq ? 'The question stem…' : 'The customer complaint + what the agent must do…'}
          className="mt-1 w-full min-h-[90px] rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      {isMcq ? (
        <div>
          <label className="text-xs font-semibold text-gray-500">Answer options — pick the correct one</label>
          <div className="mt-1 space-y-2">
            {d.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button" onClick={() => set('correctIndex', i)}
                  title="Mark correct"
                  className={cn('w-7 h-7 flex-shrink-0 rounded-full border text-xs font-bold flex items-center justify-center',
                    d.correctIndex === i ? 'bg-capelli-success border-capelli-success text-white' : 'border-gray-300 text-gray-500 hover:border-capelli-success')}
                >
                  {d.correctIndex === i ? <Check className="w-4 h-4" /> : LETTER(i)}
                </button>
                <input
                  value={opt} onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${LETTER(i)}${i >= 2 ? ' (optional)' : ''}`}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">2–4 options. The green circle is the correct answer.</p>
        </div>
      ) : (
        <div>
          <label className="text-xs font-semibold text-gray-500">Model answer / grading key</label>
          <textarea
            value={d.modelAnswer} onChange={(e) => set('modelAnswer', e.target.value)}
            placeholder="What a strong answer covers — route, action, and the trap to avoid…"
            className="mt-1 w-full min-h-[90px] rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <p className="text-xs text-gray-400 mt-1.5">Shown to graders, to the AI grader, and to takers after their exam is graded.</p>
        </div>
      )}

      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="text-xs font-semibold text-gray-500">Points</label>
          <input
            type="number" min={1} max={20} value={d.points}
            onChange={(e) => set('points', e.target.value.replace(/\D/g, ''))}
            className="mt-1 w-20 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-gray-500">Difficulty</label>
          <select
            value={d.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {DIFFICULTIES.map((x) => <option key={x} value={x}>{x.charAt(0) + x.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        {isMcq && (
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-500">Tag (competency)</label>
            <input
              value={d.competency} onChange={(e) => set('competency', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={save} disabled={saving || !d.prompt.trim()} className="gap-2 bg-capelli-navy hover:bg-blue-900">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {editing ? 'Save changes' : 'Add question'}
        </Button>
      </div>
    </div>
  );
}
