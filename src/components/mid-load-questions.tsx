"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface MidLoadAnswers {
  annualKm?: string;
  drivenBy?: string;
  otherCars?: string;
  priority?: string;
}

interface Props {
  /** Called whenever the user changes an answer. Parent reads via a ref;
   *  never gates the redirect. */
  onChange?: (answers: MidLoadAnswers) => void;
  /** Pre-fill answered state — used on phase-2 loader so questions answered
   *  on phase-1 don't appear again. */
  initialAnswers?: MidLoadAnswers;
  /** When set, answers are also persisted to localStorage under this key. The
   *  report page reads the same key on mount to merge phase-2 answers in. */
  persistKey?: string;
  /** When true, the carousel auto-jumps to the first UNanswered question on
   *  mount and tap-to-answer auto-advances to the next unanswered one. */
  skipAnswered?: boolean;
}

interface Question {
  key: keyof MidLoadAnswers;
  prompt: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    key: "annualKm",
    prompt: "How much do you drive a year?",
    options: ["< 5,000 km", "5–10k km", "10–15k km", "15k+ km"],
  },
  {
    key: "drivenBy",
    prompt: "Who drives this car?",
    options: ["Just me", "Family", "A driver", "Multiple"],
  },
  {
    key: "otherCars",
    prompt: "Any other cars in the household?",
    options: ["Only this", "1 more", "2–3", "4+"],
  },
  {
    key: "priority",
    prompt: "What matters most to you?",
    options: ["Lowest price", "Easy claims", "Wide network", "Max coverage"],
  },
];

function firstUnansweredIdx(a: MidLoadAnswers): number {
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (!a[QUESTIONS[i].key]) return i;
  }
  return 0;
}

export function MidLoadQuestions({
  onChange,
  initialAnswers,
  persistKey,
  skipAnswered,
}: Props) {
  const [answers, setAnswers] = useState<MidLoadAnswers>(
    () => initialAnswers ?? {}
  );
  const [idx, setIdx] = useState(() =>
    skipAnswered && initialAnswers
      ? firstUnansweredIdx(initialAnswers)
      : 0
  );

  // Persist to localStorage when persistKey is set (phase-2 case)
  useEffect(() => {
    if (!persistKey) return;
    try {
      window.localStorage.setItem(persistKey, JSON.stringify(answers));
    } catch {
      // Storage quota / private-mode — silent
    }
  }, [answers, persistKey]);

  const current = QUESTIONS[idx];
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const isAnswered = !!answers[current.key];
  const allDone = answeredCount === QUESTIONS.length;

  const select = (value: string) => {
    const next = { ...answers, [current.key]: value };
    setAnswers(next);
    onChange?.(next);
    // Auto-advance: skip-mode jumps to the next unanswered, otherwise just +1
    if (idx + 1 < QUESTIONS.length) {
      setTimeout(() => {
        if (skipAnswered) {
          const j = firstUnansweredIdx(next);
          setIdx(j);
        } else {
          setIdx(idx + 1);
        }
      }, 250);
    }
  };

  const go = (n: number) =>
    setIdx(((n % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length);

  // Once everything is answered, render a tight "all set" confirmation
  // instead of leaving the carousel sitting on a stale tile.
  if (allDone) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-success flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-brand-charcoal">
            All 4 answered — thanks!
          </div>
          <div className="text-xs text-brand-slate">
            We&apos;ll tailor your report with these.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-light-gray bg-white shadow-soft overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-deepblue">
          While we work · help us tailor your report
        </div>
        <div className="text-[10px] text-brand-slate font-medium tabular-nums">
          {answeredCount} / {QUESTIONS.length} answered
        </div>
      </div>

      <div className="relative px-12 py-4">
        <button
          type="button"
          aria-label="Previous question"
          onClick={() => go(idx - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-offwhite hover:bg-brand-light-gray flex items-center justify-center text-brand-slate transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Next question"
          onClick={() => go(idx + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-offwhite hover:bg-brand-light-gray flex items-center justify-center text-brand-slate transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div
          key={idx}
          className="text-center animate-in fade-in duration-300"
        >
          <div className="text-sm font-bold text-brand-charcoal mb-3 inline-flex items-center justify-center gap-1.5">
            {isAnswered && (
              <CheckCircle2 className="w-4 h-4 text-brand-success" />
            )}
            <span>{current.prompt}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {current.options.map((opt) => {
              const selected = answers[current.key] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => select(opt)}
                  className={clsx(
                    "text-xs px-3 py-1.5 rounded-full border-2 font-semibold transition-all",
                    selected
                      ? "bg-brand-deepblue text-white border-brand-deepblue scale-[1.02]"
                      : "bg-white border-brand-light-gray text-brand-charcoal hover:border-brand-electricblue hover:bg-blue-50"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 py-2.5 bg-brand-offwhite/40 border-t border-brand-light-gray">
        {QUESTIONS.map((q, i) => {
          const answered = !!answers[q.key];
          return (
            <button
              key={q.key}
              type="button"
              aria-label={`Question ${i + 1}`}
              onClick={() => go(i)}
              className={clsx(
                "h-1.5 rounded-full transition-all",
                i === idx
                  ? "w-6 bg-brand-deepblue"
                  : answered
                    ? "w-3 bg-brand-success"
                    : "w-2 bg-brand-light-gray hover:bg-brand-slate/40"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Build the URL query suffix for the answers (no leading '?' or '&'). */
export function answersToQuery(answers: MidLoadAnswers): string {
  const params = new URLSearchParams();
  if (answers.annualKm) params.set("km", answers.annualKm);
  if (answers.drivenBy) params.set("drv", answers.drivenBy);
  if (answers.otherCars) params.set("oc", answers.otherCars);
  if (answers.priority) params.set("pri", answers.priority);
  return params.toString();
}

/** Storage key for phase-2 persistence. */
export function midLoadStorageKey(reportId: string): string {
  return `mm:midload:${reportId}`;
}

/** Read whatever's been persisted client-side. Returns {} if nothing/invalid. */
export function readPersistedAnswers(key: string): MidLoadAnswers {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as MidLoadAnswers;
  } catch {
    // ignore
  }
  return {};
}
