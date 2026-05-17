/**
 * Stop 3 · Ask — the next ~20 seconds.
 *
 * Capture up to 4 high-leverage answers that the policy itself doesn't
 * surface (past claims, what they worry about, what matters at renewal,
 * where the car is parked).
 *
 * One question at a time. After the customer commits to an answer (or
 * taps "skip this →"), the current question gracefully tows out and
 * the next question tows in via the car-tow animation. A counter
 * (`Question N of M`) anchors the customer to where they are in the
 * sequence.
 *
 * Pre-seeded answers (e.g. home-page priority chip) are filtered out
 * of the queue before rendering, so the customer never sees a question
 * they've already answered upstream.
 *
 * All chip options are committal — no fence-sitter answers like
 * "Don't remember" or "Not sure".
 *
 * Skipped entirely in State D (urgency context).
 */
"use client";

import { useState } from "react";
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

  // Filter the bank — drop any question whose answer was pre-seeded
  // by upstream (home-page chip carries `priority`, for instance), so
  // the customer never sees the same question twice.
  const queue = ASK_QUESTIONS.filter((q) => !answers[q.key]);

  // Which question is currently centre-stage (0-indexed into queue).
  // Advances on each commit; the queue runs to completion or until
  // the stop timer auto-advances to Stop 4.
  const [idx, setIdx] = useState(0);

  const total = queue.length;
  const done = idx >= total;
  const current = done ? null : queue[idx];

  const advance = () => setIdx((n) => Math.min(n + 1, total));

  const pick = (key: keyof JourneyAnswers, value: string) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    onChange(next);
    // Short pause so the customer registers their selection before
    // the question tows out.
    setTimeout(advance, 320);
  };

  return (
    <div>
      <ActHeading heading={content.heading} body={content.body} />

      {/* Question carousel — single question on screen at a time.
       *  Re-keyed on idx so the new question mounts with the towing-in
       *  animation envelope. */}
      <div className="mt-6 md:mt-8 max-w-2xl mx-auto min-h-[170px] flex items-center justify-center">
        {current ? (
          <div key={current.key} className="w-full animate-towing-in">
            {/* Tiny towing car — visual anchor that says "the car
             *  brought this question in". Counter (`N of M`) removed
             *  to drop cognitive load; the car-tow-in animation does
             *  the work of suggesting "more is coming". */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-brand-plum" aria-hidden>
                <SketchCarStatic width={20} color="currentColor" />
              </span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-plum font-bold">
                · A question for you ·
              </span>
            </div>

            {/* Prompt */}
            <div className="font-serif italic text-[16px] md:text-lg text-brand-charcoal text-center mb-3.5">
              {current.prompt}
            </div>

            {/* Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {current.options.map((opt) => {
                const active = local[current.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pick(current.key, opt)}
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

            {/* Skip — soft escape that still advances the carousel */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={advance}
                className="font-serif italic text-[13px] text-brand-slate hover:text-brand-charcoal transition-colors"
              >
                Skip this <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        ) : (
          // All done — keep the slot warm with a quiet thank-you while
          // the Stop 3 timer winds down to Stop 4.
          <div className="text-center animate-act-fade-in">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
              · All set ·
            </div>
            <p className="mt-2 font-serif italic text-[15px] text-brand-slate">
              Thanks — we&apos;ll fold these into the verdict.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
