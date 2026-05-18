/**
 * Journey — the 6-stop orchestrator.
 *
 * Drives the customer through Hello → Read → Ask → Preview → Stitching
 * → Destination during the parsing wait + payoff. Each stop auto-
 * advances after its duration, except:
 *
 *   · Stitching gates on (elapsed >= minMs AND parseComplete)
 *   · Destination is tap-to-advance (with a 30s fallback timer)
 *
 * The road bar at the top of the frame shows progress spatially —
 * the car icon glides between milestone flags on each transition.
 *
 * Phase 5 rebuild: replaces the old 4-act / progress-dots flow with
 * the road-metaphor 6-stop journey. State D still skips Ask (75s
 * total instead of ~90s).
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LifecycleState } from "@/lib/lifecycle-state";
import {
  getJourneyContent,
  type JourneyAnswers,
  type JourneyContext,
} from "@/lib/journey-copy";
import { ActFrame } from "./act-frame";
import { ActHello } from "./act-hello";
import { ActRead } from "./act-read";
import { ActAsk } from "./act-ask";
import { ActPreview } from "./act-preview";
import { ActStitching } from "./act-stitching";
import { ActDestination } from "./act-destination";
import { ActError } from "./act-error";

type Phase =
  | "hello"
  | "read"
  | "ask"
  | "preview"
  | "stitching"
  | "destination"
  | "error";

/** Parse-error payload passed in from the dropzone when /api/parse fails. */
export interface JourneyParseError {
  headline: string;
  body: string;
}

interface JourneyProps {
  /** Lifecycle state — drives copy AND whether Ask is skipped (D). */
  state: LifecycleState;
  /** Reactive context — caller updates as parse-preview / parse data
   *  becomes available. Journey re-renders with personalisation. */
  context: JourneyContext;
  /** True once the full /api/parse call has returned successfully. */
  parseComplete: boolean;
  /** When set, the journey breaks out of the stops and renders the
   *  editorial failure card. Null while parsing is healthy. */
  parseError?: JourneyParseError | null;
  /** Captures the customer's answers from Stop 3 as they happen. */
  onAnswersChange?: (answers: JourneyAnswers) => void;
  /** Fired exactly once when the customer taps "See the verdict" on
   *  the destination beat (or the 30s fallback fires). */
  onComplete?: () => void;
  /** Fired when the customer taps "Try a different file" on error. */
  onRetry?: () => void;
  /** Fired when the customer taps "Start over" on error. */
  onAbandon?: () => void;
  /** Optional — the moment the journey was kicked off (e.g. file drop
   *  timestamp). Defaults to the moment the Journey component mounts.
   *  Drives the Destination's dynamic "we drove fast" / "traffic was
   *  heavy" footer + the editorial timer chip freeze. */
  startedAt?: number;
  /** Fired exactly once when the journey arrives at Destination,
   *  with the wall-clock timestamp of arrival. Lets the dropzone
   *  freeze its editorial timer chip at that instant. */
  onArrival?: (arrivedAt: number) => void;
  /** Dev-only — mount the journey directly at a specific stop. Used by
   *  /preview/journey to skip clocks while iterating on visuals. Not
   *  for production use; pass undefined in real flows. */
  initialPhase?:
    | "hello"
    | "read"
    | "ask"
    | "preview"
    | "stitching"
    | "destination";
}

/** Fallback timer on the destination beat — if the customer doesn't
 *  tap "See the verdict" within this many ms, we auto-advance so the
 *  journey eventually terminates. */
const DESTINATION_AUTO_ADVANCE_MS = 30_000;

export function Journey({
  state,
  context,
  parseComplete,
  parseError,
  onAnswersChange,
  onComplete,
  onRetry,
  onAbandon,
  startedAt,
  onArrival,
  initialPhase,
}: JourneyProps) {
  // Resolve per-state content. Memoised on inputs.
  const content = useMemo(
    () => getJourneyContent(state, context),
    [state, context]
  );

  // Compose the road-bar stops. State D drops the Ask milestone.
  const stops = useMemo(
    () =>
      [
        { key: "hello", label: "Hello" },
        { key: "read", label: "Read" },
        ...(content.skipAsk ? [] : [{ key: "ask", label: "Ask" }]),
        { key: "preview", label: "Preview" },
        { key: "stitching", label: "Stitch" },
        { key: "destination", label: "Done" },
      ] as const,
    [content.skipAsk]
  );

  const phaseToIndex = useMemo(() => {
    const m: Record<string, number> = {};
    stops.forEach((s, i) => {
      m[s.key] = i;
    });
    return m;
  }, [stops]);

  const [phase, setPhase] = useState<Phase>(initialPhase ?? "hello");
  const [answers, setAnswers] = useState<JourneyAnswers>({});

  // Phase-entry timestamp — used by the Stitching gate.
  const enteredAtRef = useRef<number>(Date.now());
  useEffect(() => {
    enteredAtRef.current = Date.now();
  }, [phase]);

  // Journey-start timestamp — defaults to the moment the Journey mounts
  // when the caller doesn't pass an explicit `startedAt`. Drives the
  // Destination "we drove fast" / "traffic was heavy" footer.
  const journeyStartRef = useRef<number>(startedAt ?? Date.now());
  // Frozen elapsed time captured at the moment we first arrive at
  // Destination. Once set, never changes — so the footer message and
  // any downstream "you took X seconds" reads are stable.
  const [destinationElapsedMs, setDestinationElapsedMs] = useState<
    number | null
  >(null);

  // Capture the elapsed time the first time phase becomes "destination"
  // and emit `onArrival` so the dropzone can freeze its timer chip.
  useEffect(() => {
    if (phase === "destination" && destinationElapsedMs === null) {
      const now = Date.now();
      setDestinationElapsedMs(now - journeyStartRef.current);
      onArrival?.(now);
    }
  }, [phase, destinationElapsedMs, onArrival]);

  // Error breakout — any phase, any time.
  useEffect(() => {
    if (parseError && phase !== "error") {
      setPhase("error");
    }
  }, [parseError, phase]);

  // Auto-advance through the linear stops. Two stops opt out of the
  // timer-based auto-advance entirely:
  //   · Stitching — gates on (elapsed >= minMs AND parseComplete)
  //   · Ask       — gates on the customer actually answering every
  //                 question (ActAsk fires `onComplete`). Time elapse
  //                 alone is NOT enough to advance from Ask, because
  //                 the audit's personalisation depends on those
  //                 answers; we'd rather hold the customer here with
  //                 a gentle nudge than skip past their input.
  // Destination is tap-driven.
  useEffect(() => {
    if (
      phase === "ask" ||
      phase === "stitching" ||
      phase === "destination" ||
      phase === "error"
    )
      return;

    let duration = 0;
    let next: Phase = "stitching";

    if (phase === "hello") {
      duration = content.hello.durationMs;
      next = "read";
    } else if (phase === "read") {
      duration = content.read.durationMs;
      next = content.skipAsk ? "preview" : "ask";
    } else if (phase === "preview") {
      duration = content.preview.durationMs;
      next = "stitching";
    }

    const id = setTimeout(() => setPhase(next), duration);
    return () => clearTimeout(id);
  }, [phase, content]);

  // Stitching gate — fire "destination" only when minimum duration has
  // elapsed AND the parse is complete. Poll every 250ms so the gate
  // closes promptly when both conditions converge.
  useEffect(() => {
    if (phase !== "stitching") return;
    if (parseError) return;
    const minMs = content.stitching.durationMs;
    const tick = () => {
      const elapsed = Date.now() - enteredAtRef.current;
      if (elapsed >= minMs && parseComplete) {
        setPhase("destination");
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, content.stitching.durationMs, parseComplete, parseError]);

  // Destination auto-advance fallback — if the customer doesn't tap
  // within DESTINATION_AUTO_ADVANCE_MS, fire onComplete ourselves.
  const completedRef = useRef(false);
  useEffect(() => {
    if (phase !== "destination") return;
    const id = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }, DESTINATION_AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [phase, onComplete]);

  const handleAnswers = (next: JourneyAnswers) => {
    setAnswers(next);
    onAnswersChange?.(next);
  };

  const advanceFromDestination = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  };

  // Error state shortcut — bypasses the frame so we can render a
  // larger, more focused recovery surface.
  if (phase === "error" && parseError) {
    return (
      <ActError
        headline={parseError.headline}
        body={parseError.body}
        onRetry={onRetry}
        onAbandon={onAbandon}
      />
    );
  }

  // Currently-rendered stop index for the road bar.
  const currentIndex = phaseToIndex[phase] ?? 0;

  // Body height differs by stop — Preview's grid needs more room than
  // Hello's simple heading. We pin the minimum at the level the
  // tallest stop wants so there's never any layout shift between
  // transitions.
  const bodyMinHeight = phase === "preview" ? 460 : 380;

  return (
    <ActFrame
      masthead={content.masthead}
      stops={stops as unknown as { key: string; label: string }[]}
      currentIndex={currentIndex}
      parked={phase === "destination"}
      bodyMinHeight={bodyMinHeight}
    >
      {phase === "hello" && <ActHello content={content.hello} />}
      {phase === "read" && <ActRead content={content.read} />}
      {phase === "ask" && (
        <ActAsk
          content={content.ask}
          answers={answers}
          onChange={handleAnswers}
          onComplete={() => {
            // The Ask act tells us "all questions are answered, no
            // point holding here." Jump straight to Preview instead
            // of waiting out the rest of the Ask stop's time budget.
            if (phase === "ask") setPhase("preview");
          }}
        />
      )}
      {phase === "preview" && <ActPreview content={content.preview} />}
      {phase === "stitching" && (
        <ActStitching
          content={content.stitching}
          parseComplete={parseComplete}
        />
      )}
      {phase === "destination" && (
        <ActDestination
          content={content.destination}
          elapsedMs={destinationElapsedMs}
          onAdvance={advanceFromDestination}
        />
      )}
    </ActFrame>
  );
}

/** Re-export the answer shape so callers don't need a separate import. */
export type { JourneyAnswers };
