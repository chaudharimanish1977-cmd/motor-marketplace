/**
 * Stop 3 · Ask — capture up to 4 high-leverage answers.
 *
 * One question at a time. Q2 only appears after Q1 is answered;
 * Q3 after Q2; Q4 after Q3. No skip option — the only way forward
 * is to answer, and the only nudge is the overall 2-min journey
 * pacing (the Ask stop's time budget is the safety net).
 *
 * The car-tow-in animation on each new question doubles as the
 * customer's visual confirmation that their previous answer was
 * registered, so we don't add a separate confirmation hold.
 *
 * Pre-seeded answers (e.g. home-page priority chip) are filtered
 * out of the queue before rendering, so the customer never sees a
 * question they've already answered upstream.
 *
 * All chip options are committal — no fence-sitter answers.
 *
 * When the queue is exhausted (last question answered), we show a
 * brief "All set" beat for ~1.5s then fire `onComplete` so the
 * orchestrator can advance early to Stop 4 (no point holding the
 * customer here once we've got their answers).
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
  /** Fired ~1.5s after the last question is answered. Lets the
   *  orchestrator advance to Stop 4 immediately instead of holding
   *  the customer on "All set" until the Ask stop's time budget
   *  runs out. */
  onComplete?: () => void;
}

/** Hold time on the "All set" card before we tell the parent to
 *  advance. Long enough that the customer registers the thanks,
 *  short enough that it doesn't feel like a stall. */
const ALL_SET_HOLD_MS = 1500;

export function ActAsk({
  content,
  answers,
  onChange,
  onComplete,
}: ActAskProps) {
  // Internal mirror so chip taps stay snappy even if the parent
  // re-renders late. Parent stays the source of truth between stops.
  const [local, setLocal] = useState<JourneyAnswers>(answers);

  // Snapshot the queue ONCE at mount, dropping any question that was
  // pre-seeded by upstream (home-page chip carries `priority`, for
  // instance). We deliberately don't re-filter as the customer's
  // own answers stream in — otherwise the queue would shrink while
  // `idx` advances, causing the customer to skip every other
  // question. The lazy initializer ensures this snapshot is taken
  // once per ActAsk lifetime.
  const [queue] = useState(() =>
    ASK_QUESTIONS.filter((q) => !answers[q.key])
  );

  // Which question is currently centre-stage (0-indexed into queue).
  // Advances on each commit; runs until the queue is exhausted.
  const [idx, setIdx] = useState(0);

  const total = queue.length;
  const done = idx >= total;
  const current = done ? null : queue[idx];

  const advance = () => setIdx((n) => Math.min(n + 1, total));

  const pick = (key: keyof JourneyAnswers, value: string) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    onChange(next);
    // No artificial post-tap hold — the towing-in animation on the
    // next question (520ms) carries the visual feedback all on its
    // own. Tap → immediate transition → car tows the new question in.
    advance();
  };

  // Once the queue is exhausted, show the "All set" beat for a
  // moment, then signal the orchestrator to move us to Stop 4.
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => onComplete?.(), ALL_SET_HOLD_MS);
    return () => clearTimeout(id);
  }, [done, onComplete]);

  return (
    <div>
      <ActHeading heading={content.heading} body={content.body} />

      {/* Question carousel — single question at a time. */}
      <div className="mt-6 md:mt-8 max-w-2xl mx-auto min-h-[170px] flex items-center justify-center">
        {current ? (
          // Q1 (idx===0) shares the parent's act-fade-in entrance —
          // we don't double-animate it with towing-in, so the heading
          // lands first and Q1 settles in under it. Q2+ get the
          // car-tows-it-in feel as the customer commits to earlier
          // answers (and the tow animation is the visual receipt for
          // the previous tap).
          <div
            key={current.key}
            className={`w-full ${idx === 0 ? "" : "animate-towing-in"}`}
          >
            {/* Tow car icon + label */}
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
          </div>
        ) : (
          // Queue exhausted — brief "All set" beat that holds for
          // ALL_SET_HOLD_MS, then the orchestrator advances us.
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
