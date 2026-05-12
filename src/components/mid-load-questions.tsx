"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  Gauge,
  Users,
  Car,
  Heart,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MidLoadAnswers {
  annualKm?: string;
  drivenBy?: string;
  otherCars?: string;
  priority?: string;
}

interface Props {
  /** Called whenever the user changes an answer — parent decides when to act on them. */
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
    prompt: "Any other cars?",
    options: ["Only this", "1 more", "2–3", "4+"],
  },
  {
    key: "priority",
    icon: Heart,
    prompt: "What matters most?",
    options: ["Lowest price", "Easy claims", "Wide network", "Max coverage"],
  },
];

/**
 * 4 questions shown side-by-side as a single compact card. The user can
 * answer in any order, skip any of them, and the parent component decides
 * when to act (typically: when parse finishes + user clicks "Get my report").
 *
 * Previous version was sequential one-at-a-time which gated the redirect on
 * completion — that caused users who didn't answer to sit on the page
 * forever even after parse was done. This version never blocks the redirect.
 */
export function MidLoadQuestions({ onChange }: Props) {
  const [answers, setAnswers] = useState<MidLoadAnswers>({});

  const select = (key: keyof MidLoadAnswers, value: string) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    onChange?.(next);
  };

  const answeredCount = Object.values(answers).filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-brand-light-gray bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-deepblue">
            While we read your policy
          </div>
          <div className="text-sm font-semibold text-brand-charcoal">
            Help us tailor your report — 4 quick taps
          </div>
        </div>
        <div className="text-[11px] text-brand-slate font-medium">
          {answeredCount === 0
            ? "Tap any tile to start"
            : answeredCount === QUESTIONS.length
              ? "All set ✓"
              : `${answeredCount} / ${QUESTIONS.length} answered`}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUESTIONS.map((q) => (
          <QuestionTile
            key={q.key}
            question={q}
            selected={answers[q.key]}
            onSelect={(v) => select(q.key, v)}
          />
        ))}
      </div>
    </div>
  );
}

function QuestionTile({
  question,
  selected,
  onSelect,
}: {
  question: Question;
  selected: string | undefined;
  onSelect: (value: string) => void;
}) {
  const Icon = question.icon;
  return (
    <div
      className={clsx(
        "rounded-xl border p-3 transition-colors",
        selected
          ? "border-brand-deepblue bg-brand-deepblue/5"
          : "border-brand-light-gray bg-brand-offwhite/40"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={clsx(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            selected
              ? "bg-brand-deepblue text-white"
              : "bg-white border border-brand-light-gray text-brand-deepblue"
          )}
        >
          {selected ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Icon className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="text-xs font-semibold text-brand-charcoal">
          {question.prompt}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {question.options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={clsx(
                "text-[11px] py-1.5 px-2 rounded-md transition-colors text-center font-medium",
                isSelected
                  ? "bg-brand-deepblue text-white"
                  : "bg-white border border-brand-light-gray text-brand-charcoal hover:border-brand-electricblue hover:bg-blue-50"
              )}
            >
              {opt}
            </button>
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
