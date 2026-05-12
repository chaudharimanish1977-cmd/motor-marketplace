"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  Gauge,
  Users,
  Car,
  Heart,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MidLoadAnswers {
  annualKm?: string;
  drivenBy?: string;
  otherCars?: string;
  priority?: string;
}

interface Props {
  /** Called whenever the user changes an answer. Parent picks them up via a
   *  ref so this never gates the redirect — if the user skips, that's fine. */
  onChange?: (answers: MidLoadAnswers) => void;
}

interface Question {
  key: keyof MidLoadAnswers;
  icon: LucideIcon;
  prompt: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    key: "annualKm",
    icon: Gauge,
    prompt: "How much do you drive a year?",
    options: ["< 5,000 km", "5–10k km", "10–15k km", "15k+ km"],
  },
  {
    key: "drivenBy",
    icon: Users,
    prompt: "Who drives this car?",
    options: ["Just me", "Family", "A driver", "Multiple"],
  },
  {
    key: "otherCars",
    icon: Car,
    prompt: "Any other cars in the household?",
    options: ["Only this", "1 more", "2–3", "4+"],
  },
  {
    key: "priority",
    icon: Heart,
    prompt: "What matters most to you?",
    options: ["Lowest price", "Easy claims", "Wide network", "Max coverage"],
  },
];

/**
 * Compact single-question carousel shown WHILE the policy is parsing. One
 * question on screen at a time, auto-advances on answer, with dot nav for
 * jumping between questions. Far less visual clutter than the 4-tile grid,
 * which made the questions easy to ignore.
 *
 * Critically: redirect is NEVER gated on completion. Parent reads the
 * answers via the onChange callback and ships whatever is set when parse
 * finishes — even an empty object is fine.
 */
export function MidLoadQuestions({ onChange }: Props) {
  const [answers, setAnswers] = useState<MidLoadAnswers>({});
  const [idx, setIdx] = useState(0);

  const current = QUESTIONS[idx];
  const Icon = current?.icon;
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const isAnswered = !!answers[current.key];

  const select = (value: string) => {
    const next = { ...answers, [current.key]: value };
    setAnswers(next);
    onChange?.(next);
    // Auto-advance to the next unanswered question — better UX than asking
    // the user to find the right-arrow themselves.
    if (idx + 1 < QUESTIONS.length) {
      setTimeout(() => setIdx(idx + 1), 250);
    }
  };

  const go = (n: number) =>
    setIdx(((n % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length);

  return (
    <div className="rounded-2xl border border-brand-light-gray bg-white shadow-soft overflow-hidden">
      {/* Compact header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-deepblue">
          While we read your policy
        </div>
        <div className="text-[10px] text-brand-slate font-medium tabular-nums">
          {answeredCount === QUESTIONS.length
            ? "All set ✓"
            : `${idx + 1} / ${QUESTIONS.length}`}
        </div>
      </div>

      {/* Question + options carousel */}
      <div className="relative px-12 py-4">
        {/* Left chevron */}
        <button
          type="button"
          aria-label="Previous question"
          onClick={() => go(idx - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-offwhite hover:bg-brand-light-gray flex items-center justify-center text-brand-slate transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Right chevron */}
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
          {/* Icon + prompt */}
          <div className="flex flex-col items-center gap-2 mb-3">
            <div
              className={clsx(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                isAnswered
                  ? "bg-brand-deepblue text-white"
                  : "bg-brand-deepblue/10 text-brand-deepblue"
              )}
            >
              {isAnswered ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                Icon && <Icon className="w-4 h-4" />
              )}
            </div>
            <div className="text-sm font-bold text-brand-charcoal">
              {current.prompt}
            </div>
          </div>

          {/* Options — single row */}
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

      {/* Dot nav */}
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
