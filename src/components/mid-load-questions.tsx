/**
 * MidLoadQuestions — the in-parse survey carousel.
 *
 * Mounted on the upload page during the ~30-60s parse wait, and on the
 * /report/[id] loading screen as a back-up surface if the user hits
 * the report URL before parsing finishes. Captures the customer-side
 * attributes that the policy PDF *doesn't* tell us (driving behaviour,
 * household context, claim history, priority).
 *
 * Five questions in order:
 *
 *   1. annualKm      — driving frequency.   Drives risk modelling.
 *   2. drivenBy      — who drives the car.  Drives risk modelling.
 *   3. otherCars     — household car count. Drives cross-sell timing.
 *   4. priority      — what matters most.   Drives recommendation lens.
 *                       Aligned with the home page chip ("Pay less" /
 *                       "Worry less") so a chip selection on the home
 *                       page pre-fills this question via the
 *                       `?priority=` URL param.
 *   5. pastClaims    — claim history.       Drives NCB / risk weighting.
 *
 * The carousel auto-advances on tap, persists answers to localStorage,
 * and skips already-answered questions via `skipAnswered`.
 *
 * Visual treatment: Reading-Room editorial — italic-serif prompts,
 * plum-tinted active chips, mono uppercase caption header, plain SVG
 * chevrons (not lucide), surface card with no drop shadow.
 */
"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

export interface MidLoadAnswers {
  annualKm?: string;
  drivenBy?: string;
  otherCars?: string;
  priority?: string;
  pastClaims?: string;
}

interface Props {
  /** Called whenever the user changes an answer. Parent reads via a ref;
   *  never gates the redirect. */
  onChange?: (answers: MidLoadAnswers) => void;
  /** Pre-fill answered state — used on phase-2 loader so questions answered
   *  on phase-1 don't appear again, and to consume the home page chip
   *  selection (passed via `?priority=` query param). */
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
    options: ["Pay less", "Worry less", "Both matter"],
  },
  {
    key: "pastClaims",
    prompt: "Filed a claim in the last 3 years?",
    options: ["No", "Yes — once", "Yes — twice+", "Don't remember"],
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
    skipAnswered && initialAnswers ? firstUnansweredIdx(initialAnswers) : 0
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
    if (idx + 1 < QUESTIONS.length) {
      setTimeout(() => {
        if (skipAnswered) {
          setIdx(firstUnansweredIdx(next));
        } else {
          setIdx(idx + 1);
        }
      }, 250);
    }
  };

  const go = (n: number) =>
    setIdx(((n % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length);

  // All answered — render a quiet editorial confirmation.
  if (allDone) {
    return (
      <div className="rounded-2xl border border-brand-charcoal/15 bg-brand-surface px-5 py-4 flex items-center gap-3">
        <Tick />
        <div>
          <div className="font-serif font-semibold text-brand-charcoal">
            All five answered — thanks.
          </div>
          <div className="font-serif italic text-sm text-brand-slate">
            We&apos;ll tailor your review with these.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-charcoal/15 bg-brand-surface overflow-hidden">
      <div className="px-4 pt-3 pb-2 text-center">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand-sage">
          · While we read · A few quick questions ·
        </div>
      </div>

      <div className="relative px-12 py-5">
        <button
          type="button"
          aria-label="Previous question"
          onClick={() => go(idx - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-full text-brand-plum hover:bg-brand-plum/10 transition-colors"
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          aria-label="Next question"
          onClick={() => go(idx + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-full text-brand-plum hover:bg-brand-plum/10 transition-colors"
        >
          <Chevron direction="right" />
        </button>

        <div
          key={idx}
          className="text-center animate-in fade-in duration-300"
        >
          <div className="font-serif italic text-lg text-brand-charcoal mb-4 inline-flex items-center justify-center gap-2">
            {isAnswered && <Tick small />}
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
                    "inline-flex items-center px-4 py-1.5 rounded-full border font-serif italic text-sm transition-all",
                    selected
                      ? "border-brand-plum bg-brand-plum/10 text-brand-plum"
                      : "border-brand-charcoal/20 text-brand-slate hover:border-brand-charcoal/50 hover:text-brand-charcoal"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-3 border-t border-brand-charcoal/10">
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
                  ? "w-7 bg-brand-plum"
                  : answered
                    ? "w-3 bg-brand-sage"
                    : "w-2 bg-brand-charcoal/20 hover:bg-brand-charcoal/40"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline
        points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"}
      />
    </svg>
  );
}

function Tick({ small = false }: { small?: boolean }) {
  const size = small ? 14 : 16;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="text-brand-sage"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/** Build the URL query suffix for the answers (no leading '?' or '&'). */
export function answersToQuery(answers: MidLoadAnswers): string {
  const params = new URLSearchParams();
  if (answers.annualKm) params.set("km", answers.annualKm);
  if (answers.drivenBy) params.set("drv", answers.drivenBy);
  if (answers.otherCars) params.set("oc", answers.otherCars);
  if (answers.priority) params.set("pri", answers.priority);
  if (answers.pastClaims) params.set("pc", answers.pastClaims);
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

/**
 * Translate the home page chip selection (`pay_less` / `worry_less`)
 * into the priority answer the MidLoadQuestions carousel uses ("Pay
 * less" / "Worry less"). Returns null if the priority param is missing
 * or unrecognised — callers should treat that as "no pre-fill".
 */
export function priorityFromChipParam(
  param: string | null | undefined
): string | null {
  if (param === "pay_less") return "Pay less";
  if (param === "worry_less") return "Worry less";
  return null;
}
