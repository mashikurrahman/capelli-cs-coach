'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Play, CheckCircle2, XCircle,
  Trophy, RotateCcw, Lightbulb, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

async function fetchScenarios() {
  const res = await fetch('/api/training/scenarios');
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

export default function TrainingMode() {
  const { data, isLoading } = useQuery({ queryKey: ['scenarios'], queryFn: fetchScenarios });
  const [active, setActive] = useState<any | null>(null);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const scenarios: any[] = data?.scenarios ?? [];

  if (active) {
    return (
      <ScenarioPractice
        scenario={active}
        onExit={() => { setActive(null); setAnswered(null); }}
      />
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Mode</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Practice with real Capelli CS scenarios before handling live tickets
          </p>
        </div>
        {score.total > 0 && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">
              {score.correct}/{score.total} correct this session
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-32" />)}
        </div>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <GraduationCap className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No training scenarios yet</p>
          <p className="text-sm text-gray-400 mt-1">
            An Admin or Trainer can add practice scenarios in the Admin panel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map(s => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 shadow-card p-5 cursor-pointer hover:border-capelli-navy transition-colors group"
              onClick={() => setActive(s)}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge variant={s.difficulty === 'BEGINNER' ? 'success' : s.difficulty === 'ADVANCED' ? 'danger' : 'warning'}>
                  {s.difficulty}
                </Badge>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-capelli-navy transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{s.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{s.complaint}</p>
              {s.quizQuestions?.length > 0 && (
                <p className="text-xs text-capelli-navy mt-2 font-medium">{s.quizQuestions.length} questions</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScenarioPractice({ scenario, onExit }: { scenario: any; onExit: () => void }) {
  const [step, setStep] = useState<'read' | 'answer' | 'done'>('read');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<{ correct: boolean; selected: number }[]>([]);

  const questions: any[] = scenario.quizQuestions ?? [];
  const currentQ = questions[qIndex];
  const score = results.filter(r => r.correct).length;

  if (step === 'read') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <button onClick={onExit} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Back to Scenarios
        </button>
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-capelli-navy" />
            <h2 className="font-bold text-gray-900 text-lg">{scenario.title}</h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Customer Message:</p>
            <p className="text-sm text-gray-800 leading-relaxed">{scenario.complaint}</p>
          </div>
          {scenario.hints?.length > 0 && (
            <div className="bg-capelli-infoBg border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-bold text-capelli-info mb-1 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" /> HINTS
              </p>
              {scenario.hints.map((h: string, i: number) => (
                <p key={i} className="text-xs text-blue-700">• {h}</p>
              ))}
            </div>
          )}
          <Button onClick={() => setStep(questions.length > 0 ? 'answer' : 'done')} className="w-full gap-2 bg-capelli-navy hover:bg-blue-900">
            <Play className="w-4 h-4" />
            {questions.length > 0 ? 'Start Questions' : 'View Answer'}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'answer' && currentQ) {
    const isAnswered = selected !== null;

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            ← Exit
          </button>
          <span className="text-sm text-gray-500">Question {qIndex + 1} of {questions.length}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
          <p className="font-semibold text-gray-800 mb-4">{currentQ.question}</p>
          <div className="space-y-2 mb-5">
            {currentQ.options.map((opt: string, i: number) => {
              const isSelected = selected === i;
              const isCorrect = i === currentQ.correctIndex;
              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border text-sm transition-all',
                    !isAnswered && 'hover:border-capelli-navy hover:bg-blue-50',
                    isAnswered && isCorrect && 'border-green-400 bg-green-50 text-green-800',
                    isAnswered && isSelected && !isCorrect && 'border-red-400 bg-red-50 text-red-800',
                    !isAnswered && isSelected && 'border-capelli-navy bg-blue-50',
                    !isSelected && !isAnswered && 'border-gray-200'
                  )}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {isAnswered ? (
            <div>
              {currentQ.explanation && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs font-bold text-gray-700 mb-1">Explanation</p>
                  <p className="text-sm text-gray-600">{currentQ.explanation}</p>
                </div>
              )}
              <Button
                onClick={() => {
                  const isCorrect = selected === currentQ.correctIndex;
                  setResults(prev => [...prev, { correct: isCorrect, selected: selected! }]);
                  if (qIndex + 1 < questions.length) {
                    setQIndex(p => p + 1);
                    setSelected(null);
                  } else {
                    setStep('done');
                  }
                }}
                className="w-full bg-capelli-navy hover:bg-blue-900"
              >
                {qIndex + 1 < questions.length ? 'Next Question' : 'See Results'}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setSelected(selected ?? 0)}
              disabled={selected === null}
              variant="outline"
              className="w-full"
            >
              Confirm Answer
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 text-center">
        <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Scenario Complete!</h2>
        <p className="text-gray-500 mt-1">{scenario.title}</p>
        <div className="mt-4 text-3xl font-bold text-capelli-navy">
          {score}/{questions.length}
        </div>
        <p className="text-sm text-gray-500 mt-1">questions correct</p>
        {scenario.explanation && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-4 text-left">{scenario.explanation}</p>
        )}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onExit} className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" /> Back to Scenarios
          </Button>
          <Button className="flex-1 bg-capelli-navy hover:bg-blue-900" onClick={onExit}>
            Continue Training
          </Button>
        </div>
      </div>
    </div>
  );
}
