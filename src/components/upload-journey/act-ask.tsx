/**
 * Act 3 · Ask — the next ~20 seconds.
 *
 * Job: capture the 2 high-leverage questions that the policy itself
 * doesn't tell us (past claims, what worries them most). Both are
 * single-select chip rows; both are skippable. We never gate progress
 * on an answer.
 *
 * The Ask act is skipped entirely in State D (urgency context).
 */
"use client";

import { useState } from "react";
import { ActFrame, ActHeading } from "./act-frame";
import {
  ASK_QUESTIONS,
  type ActContent,
  type JourneyAnswers,
} from "@/lib/journey-copy";

interface ActAskProps {
  content: ActContent;
  answers: JourneyAnswers;
  onChange: (answers: JourneyAnswers) => void;
  progress: React.ReactNode;
}

export function ActAsk({
  content,
  answers,
  onChange,
  progress,
}: ActAskProps) {
  // Internal mirror so changes are responsive even if the parent
  // re-renders late. Parent stays the source of truth between acts.
  const [local, setLocal] = useState<JourneyAnswers>(answers);

  const pick = (key: keyof JourneyAnswers, value: string) => {
    const next = { ...local, [key]: local[key] === value ? undefined : value };
    setLocal(next);
    onChange(next);
  };

  return (
    <ActFrame kicker="· Reading Room · No. 3" progress={progress}>
      <ActHeading heading={content.heading} body={content.body} />
      <div className="mt-7 md:mt-9 space-y-6 md:space-y-8 max-w-2xl mx-auto">
        {ASK_QUESTIONS.map((q) => (
          <div key={q.key}>
            <div className="font-serif italic text-[15px] md:text-base text-brand-slate text-center mb-3">
              {q.prompt}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {q.options.map((opt) => {
                const active = local[q.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pick(q.key, opt)}
                    aria-pressed={active}
                    className={`inline-flex items-center px-4 py-1.5 rounded-full border font-serif italic text-sm transition-all ${
                      active
                        ? "border-brand-plum bg-brand-plum/10 text-brand-plum"
                        : "border-brand-charcoal/20 text-brand-slate hover:border-brand-charcoal/50 hover:text-brand-charcoal"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ActFrame>
  );
}
