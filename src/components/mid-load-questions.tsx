"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  Gauge,
  Users,
  Car,
  Heart,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MidLoadAnswers {
  annualKm?: string;
  drivenBy?: string;
  otherCars?: string;
  priority?: string;
}

interface Props {
  onComplete: (answers: MidLoadAnswers) => void;
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
    prompt: "How much do you drive in a year?",
    options: [
      "Less than 5,000 km",
      "5,000 – 10,000 km",
      "10,000 – 15,000 km",
      "More than 15,000 km",
    ],
  },
  {
    key: "drivenBy",
    icon: Users,
    prompt: "Who drives this car the most?",
    options: [
      "Just me",
      "Me and a family member",
      "A driver",
      "Multiple drivers",
    ],
  },
  {
    key: "otherCars",
    icon: Car,
    prompt: "Do you own more cars?",
    options: ["Only this one", "One more", "2–3 more", "4 or more"],
  },
  {
    key: "priority",
    icon: Heart,
    prompt: "What matters most to you?",
    options: [
      "Lowest premium",
      "Best claim experience",
      "Wide garage network",
      "Engine + add-on protection",
    ],
  },
];

/**
 * Productive 4-question survey shown WHILE the policy is parsing. Each answer
 * is captured locally then handed off via onComplete — the parent stitches
 * them into the redirect URL so the report page can show "your driving
 * profile" without needing a backend round trip.
 *
 * Auto-advances on selection. Last question's selection triggers onComplete.
 */
export function MidLoadQuestions({ onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<MidLoadAnswers>({});
  const [done, setDone] = useState(false);

  const current = QUESTIONS[idx];
  const Icon = current?.icon;

  const select = (option: string) => {
    if (!current) return;
    const next = { ...answers, [current.key]: option };
    setAnswers(next);

    if (idx + 1 >= QUESTIONS.length) {
      setDone(true);
      // Slight pause so the user sees their final selection register before
      // the screen transitions to the loading-only state.
      setTimeout(() => onComplete(next), 450);
    } else {
      setTimeout(() => setIdx((i) => i + 1), 250);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-success/30 bg-emerald-50/60 p-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-success flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-brand-charcoal">
            Thanks — personalising your report.
          </div>
          <div className="text-xs text-brand-slate">
            We&apos;ll use these answers to tailor what you see next.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-light-gray bg-white p-5 shadow-soft">
      {/* Header: progress + icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-deepblue/10 flex items-center justify-center">
            {Icon && <Icon className="w-4 h-4 text-brand-deepblue" />}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-slate">
            While we read your policy · Question {idx + 1} of {QUESTIONS.length}
          </div>
        </div>
        <div className="flex gap-1">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={clsx(
                "h-1 rounded-full transition-all",
                i < idx
                  ? "w-2 bg-brand-success"
                  : i === idx
                    ? "w-6 bg-brand-deepblue"
                    : "w-2 bg-brand-light-gray"
              )}
            />
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div className="text-base font-semibold text-brand-charcoal mb-3">
        {current.prompt}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {current.options.map((opt) => {
          const isSelected = answers[current.key] === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => select(opt)}
              className={clsx(
                "text-left text-sm px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-2",
                isSelected
                  ? "border-brand-deepblue bg-brand-deepblue/5 text-brand-deepblue font-semibold"
                  : "border-brand-light-gray bg-white text-brand-charcoal hover:border-brand-electricblue/50 hover:bg-blue-50/40"
              )}
            >
              <span>{opt}</span>
              {isSelected ? (
                <CheckCircle2 className="w-4 h-4 text-brand-deepblue shrink-0" />
              ) : (
                <ArrowRight className="w-4 h-4 text-brand-slate/40 shrink-0" />
              )}
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
