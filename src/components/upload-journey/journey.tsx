/**
 * Journey — the 5-act orchestrator.
 *
 * Drives the customer through Hello → Read → Ask → Anticipate during
 * the parsing wait. Each act auto-advances after its duration. The
 * final act (Anticipate) holds until BOTH:
 *
 *   1. its minimum duration has elapsed, AND
 *   2. `parseComplete` is true
 *
 * — at which point it fires `onComplete`, signalling the caller to
 * navigate to the report. This is the "hold-to-90s" discipline locked
 * in earlier: even if the parser returns in 30s, the customer gets
 * the full ritual.
 *
 * State D collapses the journey: skips Act 3 (Ask), targets 60s total.
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LifecycleState } from "@/lib/lifecycle-state";
import {
  getJourneyContent,
  type JourneyAnswers,
  type JourneyContext,
} from "@/lib/journey-copy";
import { ActHello } from "./act-hello";
import { ActRead } from "./act-read";
import { ActAsk } from "./act-ask";
import { ActAnticipate } from "./act-anticipate";

type Phase = "hello" | "read" | "ask" | "anticipate" | "ready";

interface JourneyProps {
  /** Lifecycle state. Phase 1 defaults to "B" until state-aware
   *  routing lands in Phase 2. */
  state: LifecycleState;
  /** Reactive context — caller updates as parse-preview / parse data
   *  becomes available. Journey re-renders with personalisation. */
  context: JourneyContext;
  /** True once the full /api/parse call has returned successfully. */
  parseComplete: boolean;
  /** Captures the customer's answers from Act 3 as they happen. */
  onAnswersChange?: (answers: JourneyAnswers) => void;
  /** Fired exactly once when the journey finishes (post-90s + parse done).
   *  Caller should navigate to the report. */
  onComplete?: () => void;
}

export function Journey({
  state,
  context,
  parseComplete,
  onAnswersChange,
  onComplete,
}: JourneyProps) {
  // Resolve the per-state content. Memoised so we only re-resolve
  // when state or context inputs actually change.
  const content = useMemo(() => getJourneyContent(state, context), [
    state,
    context,
  ]);

  const [phase, setPhase] = useState<Phase>("hello");
  const [answers, setAnswers] = useState<JourneyAnswers>({});

  // Track when each phase was entered — used by the anticipate gate
  // to enforce its minimum duration.
  const enteredAtRef = useRef<number>(Date.now());
  useEffect(() => {
    enteredAtRef.current = Date.now();
  }, [phase]);

  // Auto-advance through the first three acts. Anticipate is gated
  // separately below because it depends on parseComplete.
  useEffect(() => {
    if (phase === "anticipate" || phase === "ready") return;

    let duration = 0;
    let next: Phase = "anticipate";

    if (phase === "hello") {
      duration = content.hello.durationMs;
      next = "read";
    } else if (phase === "read") {
      duration = content.read.durationMs;
      next = content.skipAsk ? "anticipate" : "ask";
    } else if (phase === "ask") {
      duration = content.ask.durationMs;
      next = "anticipate";
    }

    const id = setTimeout(() => setPhase(next), duration);
    return () => clearTimeout(id);
  }, [phase, content]);

  // Anticipate gate — fire "ready" only when minimum duration has
  // elapsed AND the parse is complete. Poll every 250ms so the gate
  // closes promptly when both conditions converge.
  useEffect(() => {
    if (phase !== "anticipate") return;
    const minMs = content.anticipate.durationMs;

    const tick = () => {
      const elapsed = Date.now() - enteredAtRef.current;
      if (elapsed >= minMs && parseComplete) {
        setPhase("ready");
      }
    };
    // Run immediately in case both conditions are already true,
    // then poll until satisfied.
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, content.anticipate.durationMs, parseComplete]);

  // Fire onComplete exactly once when phase reaches "ready".
  const completedRef = useRef(false);
  useEffect(() => {
    if (phase === "ready" && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [phase, onComplete]);

  const handleAnswers = (next: JourneyAnswers) => {
    setAnswers(next);
    onAnswersChange?.(next);
  };

  // Progress dots — the journey shows 3 or 4 dots depending on Ask.
  const phases: Exclude<Phase, "ready">[] = content.skipAsk
    ? ["hello", "read", "anticipate"]
    : ["hello", "read", "ask", "anticipate"];
  const currentIdx = phases.indexOf(phase as Exclude<Phase, "ready">);
  const progress = (
    <div className="flex items-center justify-center gap-2">
      {phases.map((p, i) => (
        <span
          key={p}
          aria-hidden
          className={`h-1.5 rounded-full transition-all ${
            i === currentIdx
              ? "w-8 bg-brand-plum"
              : i < currentIdx
                ? "w-3 bg-brand-sage"
                : "w-2 bg-brand-charcoal/20"
          }`}
        />
      ))}
    </div>
  );

  // Render the current act. Use `key` on each so the act mounts fresh
  // on phase change — gives us animate-in fades for free if we add
  // them later.
  return (
    <div className="w-full max-w-2xl mx-auto">
      {phase === "hello" && (
        <ActHello key="hello" content={content.hello} progress={progress} />
      )}
      {phase === "read" && (
        <ActRead key="read" content={content.read} progress={progress} />
      )}
      {phase === "ask" && (
        <ActAsk
          key="ask"
          content={content.ask}
          answers={answers}
          onChange={handleAnswers}
          progress={progress}
        />
      )}
      {phase === "anticipate" && (
        <ActAnticipate
          key="anticipate"
          content={content.anticipate}
          parseComplete={parseComplete}
          progress={progress}
        />
      )}
      {phase === "ready" && (
        // Render the final state (parse complete + journey done) as a
        // brief beat before the caller navigates. Same shape as
        // anticipate so there's no flash.
        <ActAnticipate
          key="ready"
          content={{ ...content.anticipate, body: "Your verdict is ready." }}
          parseComplete
          progress={progress}
        />
      )}
    </div>
  );
}

/** Re-export the answer shape so callers don't need a separate import. */
export type { JourneyAnswers };
