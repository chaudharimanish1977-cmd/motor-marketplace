/**
 * Stop 3 · Ask — the next ~20 seconds.
 *
 * Capture 2-4 high-leverage answers that the policy itself doesn't
 * surface (past claims, what they worry about, what matters at renewal,
 * where the car is parked).
 *
 * Dynamic loading — Q1 + Q2 are always visible. Q3 (and later Q4) get
 * "towed in" by the SketchCarTowing illustration once the customer has
 * answered the first two. Skipping is always allowed.
 *
 * No fence-sitter options. Every chip is committal so the answer is
 * actually usable downstream.
 *
 * Skipped entirely in State D (urgency context).
 */
"use client";

import { useEffect, useState } from "react";
import { ActHeading } from "./act-frame";
import { SketchCarStatic } from "@/components/sketches";
import {
  ASK_QUESTIONS,
  type ActContent,
  type JourneyAnswers,
} from "@/lib/journey-copy";

interface ActAskProps {
  content: ActContent;
  answers: JourneyAnswers;
  onChange: (answers: JourneyAnswers) => void;
}

export function ActAsk({ content, answers, onChange }: ActAskProps) {
  // Internal mirror so chip taps stay snappy even if the parent
  // re-renders late. Parent stays the source of truth between stops.
  const [local, setLocal] = useState<JourneyAnswers>(answers);

  // How many questions we've revealed so far. Always starts with 2;
  // we bump to 3 then 4 as the customer commits to earlier answers.
  const [visibleCount, setVisibleCount] = useState(2);

  // Filter the bank — drop any question whose answer was pre-seeded
  // by upstream (home-page chip carries `priority`, for instance), so
  // the customer never sees the same question twice.
  const queue = ASK_QUESTIONS.filter((q) => !answers[q.key]);

  // Once Q1 + Q2 are answered, queue Q3. Once Q3 is answered, queue Q4.
  // Each step has a short delay so the towing animation reads.
  useEffect(() => {
    const answered = queue
      .slice(0, visibleCount)
      .filter((q) => !!local[q.key]).length;
    if (answered >= visibleCount && visibleCount < queue.length) {
      const id = setTimeout(
        () => setVisibleCount((n) => Math.min(n + 1, queue.length)),
        450
      );
      return () => clearTimeout(id);
    }
  }, [local, queue, visibleCount]);

  const pick = (key: keyof JourneyAnswers, value: string) => {
    const next = {
      ...local,
      [key]: local[key] === value ? undefined : value,
    };
    setLocal(next);
    onChange(next);
  };

  return (
    <div>
      <ActHeading heading={content.heading} body={content.body} />

      {/* Question stack */}
      <div className="mt-6 md:mt-8 space-y-5 md:space-y-7 max-w-2xl mx-auto">
        {queue.slice(0, visibleCount).map((q, i) => (
          <div
            key={q.key}
            // The first two animate-in from the act-fade entrance.
            // Q3 / Q4 ride in on the towing animation.
            className={i >= 2 ? "animate-towing-in" : ""}
          >
            {/* Prompt + (for towed-in questions) the small towing car
             *  to the left of the prompt. */}
            <div className="flex items-center justify-center gap-2 mb-2.5">
              {i >= 2 && (
                <span
                  className="text-brand-plum -mr-1 -mt-0.5"
                  aria-hidden
                >
                  <SketchCarStatic width={20} color="currentColor" />
                </span>
              )}
              <div className="font-serif italic text-[15px] md:text-base text-brand-slate text-center">
                {q.prompt}
              </div>
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
                    className={`inline-flex items-center px-4 py-2 rounded-full border font-serif italic text-sm min-h-[40px] transition-all ${
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

      {/* Tiny mono caption — sets the "answer 2 to unlock the rest" expectation */}
      {visibleCount < queue.length && (
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate text-center">
          · {queue.length} questions queued · answer {visibleCount} to unlock the rest ·
        </p>
      )}
    </div>
  );
}
