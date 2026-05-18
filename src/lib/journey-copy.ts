/**
 * Journey copy — single source of truth for what each stop says in
 * each lifecycle state.
 *
 * Phase 5 expansion:
 *
 *   Stop 1 · Hello       ~12s   confirm + personalise
 *   Stop 2 · Read        ~22s   show the work
 *   Stop 3 · Ask         ~20s   capture 2-4 dynamic questions
 *   Stop 4 · Preview     ~15s   RCP teaser — "what we're recommending"
 *   Stop 5 · Stitching   ~18s   anticipate quotes / verdict
 *   Stop 6 · Destination  hold  finish-line beat, tap-to-advance
 *
 * State D (lapsed) skips Stop 3 (Ask); ~75s total.
 *
 * Pure (no React) so this file is easy to scan, edit, and translate.
 */

import type { LifecycleState } from "./lifecycle-state";

/* ─── Per-stop content ──────────────────────────────────────────────── */

export interface ActContent {
  /** Display heading in editorial serif. */
  heading: string;
  /** Optional body line beneath the heading (italic-serif slate). */
  body?: string;
  /** Milliseconds this stop stays on screen before auto-advance. */
  durationMs: number;
}

export interface JourneyContent {
  /** Conversational masthead pinned above the road bar for the entire
   *  journey. Sets the tone — a 2-min test drive together for healthy
   *  states, urgency framing for lapsed (State D). */
  masthead: string;
  hello: ActContent;
  read: ActContent;
  ask: ActContent;
  preview: ActContent;
  stitching: ActContent;
  destination: ActContent;
  /** True for State D: collapse the journey, skip the Ask stop. */
  skipAsk: boolean;
  /** Total expected duration of the journey (excludes the destination
   *  hold which the customer dismisses themselves). */
  minTotalMs: number;
}

/* ─── Context that personalises copy ────────────────────────────────── */

export interface JourneyContext {
  /** "Honda City" / "Maruti Swift" — populated once parse-preview returns. */
  vehicleLabel?: string;
  /** Insurer name from parse-preview, when available. */
  insurerName?: string;
  /** Days until expiry — drives State-specific date language. */
  daysUntilExpiry?: number | null;
  /** Number of documents in the upload stack (Phase 3+, defaults to 1). */
  docCount?: number;
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

const FALLBACK_VEHICLE = "your car";

/** Friendly "in N days" string that handles 0/1/negative naturally. */
function renewalPhrase(days: number | null | undefined): string {
  if (typeof days !== "number") return "";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/* ─── The map ──────────────────────────────────────────────────────── */

/**
 * Resolve the journey content for a given lifecycle state + context.
 * Pure — call from anywhere, including during render.
 */
export function getJourneyContent(
  state: LifecycleState,
  ctx: JourneyContext = {}
): JourneyContent {
  const vehicle = ctx.vehicleLabel || FALLBACK_VEHICLE;
  const days = ctx.daysUntilExpiry;
  const docCount = ctx.docCount ?? 1;

  // State-specific masthead — pinned above the road bar across every
  // stop. Sets the conversational tone for the whole experience.
  // Healthy states (A/B/C) frame the journey as a shared test drive;
  // State D leans into urgency since the customer is uncovered.
  const masthead =
    state === "D"
      ? "· Let's get you back on cover ·"
      : "· Let's take a 2-min test drive together ·";

  // Shared destination content — personalised by vehicle in all states.
  const destination: ActContent = {
    heading: `Your ${vehicle} review is ready.`,
    body:
      state === "D"
        ? "We'll show you exactly what to do right now to get back on cover."
        : "Coverage strengths, gaps, and what to ask for at renewal — all inside.",
    durationMs: 0,
  };

  switch (state) {
    case "A": {
      const helloBody =
        typeof days === "number"
          ? days === 0
            ? "Renewal's today — perfect window."
            : days === 1
              ? "Renewal's tomorrow — perfect window."
              : `Renewal's ${renewalPhrase(days)} — perfect window.`
          : "We're in the renewal window.";
      const helloHeading =
        docCount > 1
          ? `Stacking up your ${docCount} documents.`
          : `Reading your ${vehicle}.`;
      return {
        hello: { heading: helloHeading, body: helloBody, durationMs: 12_000 },
        read: {
          heading: "What we're checking.",
          body:
            docCount > 1
              ? "Side by side: declared value, depreciation, no-claim bonus, engine protection, cashless network."
              : "Declared value, depreciation, no-claim bonus, engine protection, cashless network — the things that decide whether your claim lands in full or in fragments.",
          durationMs: 22_000,
        },
        ask: {
          heading: "A few quick things — so we can tailor.",
          body: "Help us understand you better.",
          // ~7s per question across 4 questions, plus settle time
          // for the chosen-chip plum confirmation. Tight enough to
          // feel like a chat, loose enough that questions don't
          // get yanked away mid-thought.
          durationMs: 28_000,
        },
        preview: {
          heading: `For your ${vehicle}, we're recommending.`,
          body: "A first peek at the coverage profile — the full reasoning lands on the next screen.",
          durationMs: 15_000,
        },
        stitching: {
          heading: "Stitching your verdict.",
          body: "Pulling the threads together — strengths, gaps, and what to ask for at renewal.",
          durationMs: 18_000,
        },
        destination,
        skipAsk: false,
        minTotalMs: 95_000,
        masthead,
      };
    }

    case "B": {
      const helloBody =
        typeof days === "number"
          ? `${renewalPhrase(days)} till renewal — let's see how this year's policy is holding up.`
          : "Let's see how this year's policy is holding up.";
      return {
        hello: {
          heading: `Got your ${vehicle}.`,
          body: helloBody,
          durationMs: 12_000,
        },
        read: {
          heading: "What we're checking.",
          body: "Declared value, depreciation, no-claim bonus, engine protection, cashless network — the things that decide whether your claim lands in full or in fragments.",
          durationMs: 22_000,
        },
        ask: {
          heading: "A few quick things — so we can tailor.",
          body: "Help us understand you better.",
          // ~7s per question across 4 questions, plus settle time
          // for the chosen-chip plum confirmation. Tight enough to
          // feel like a chat, loose enough that questions don't
          // get yanked away mid-thought.
          durationMs: 28_000,
        },
        preview: {
          heading: `For your ${vehicle}, we're recommending.`,
          body: "A first peek at the coverage profile — the full reasoning lands on the next screen.",
          durationMs: 15_000,
        },
        stitching: {
          heading: "Filing this year's read.",
          body: "We'll come knocking 45 days before renewal — with a fresh review for the next round.",
          durationMs: 18_000,
        },
        destination,
        skipAsk: false,
        minTotalMs: 95_000,
        masthead,
      };
    }

    case "C":
      return {
        hello: {
          heading: `Got your fresh ${vehicle} policy.`,
          body: "Let's check exactly what you signed up for.",
          durationMs: 12_000,
        },
        read: {
          heading: "What we're checking.",
          body: "Declared value, depreciation, no-claim bonus, engine protection, cashless network — the things that decide whether your claim lands in full or in fragments.",
          durationMs: 22_000,
        },
        ask: {
          heading: "A few quick things — so we can tailor.",
          body: "Help us understand you better.",
          // ~7s per question across 4 questions, plus settle time
          // for the chosen-chip plum confirmation. Tight enough to
          // feel like a chat, loose enough that questions don't
          // get yanked away mid-thought.
          durationMs: 28_000,
        },
        preview: {
          heading: `For your ${vehicle}, we're checking.`,
          body: "Quick look at the coverage profile we'd recommend at renewal time.",
          durationMs: 15_000,
        },
        stitching: {
          heading: "Saving this for the year.",
          body: "We'll be back when renewal's in sight — with a fresh review for the next round.",
          durationMs: 18_000,
        },
        destination,
        skipAsk: false,
        minTotalMs: 95_000,
        masthead,
      };

    case "D": {
      const daysLapsed = typeof days === "number" ? Math.abs(days) : null;
      return {
        hello: {
          heading: daysLapsed
            ? `Your ${vehicle} policy expired ${daysLapsed} day${
                daysLapsed === 1 ? "" : "s"
              } ago.`
            : `Your ${vehicle} policy has lapsed.`,
          body: "Reviewing what was there — we'll get you up to date next.",
          durationMs: 12_000,
        },
        read: {
          heading: "What we're checking.",
          body: "Declared value, depreciation, no-claim bonus, engine protection, cashless network — the things you were paying for last year.",
          durationMs: 18_000,
        },
        ask: {
          // Skipped — but keep shape consistent for typing.
          heading: "",
          body: "",
          durationMs: 0,
        },
        preview: {
          heading: `For your ${vehicle}, we'd recommend.`,
          body: "What the cover looked like last year vs what it should look like now.",
          durationMs: 12_000,
        },
        stitching: {
          heading: "Reviewing the lapse.",
          body: "On the next screen: what to do right now to get back on cover.",
          durationMs: 15_000,
        },
        destination,
        skipAsk: true,
        minTotalMs: 57_000,
        masthead,
      };
    }
  }
}

/* ─── Ask stop — dynamic question bank ──────────────────────────────── */

/**
 * The Ask-stop question bank. Customer always sees Q1 + Q2. Q3 + Q4 are
 * "towed in" by the car if the customer answers the first two within
 * ~8 seconds of arrival on the stop. The home-page priority chip slot
 * (Q3) auto-skips when an answer was pre-filled upstream.
 *
 * All options are committal — no "Don't remember" / "Not sure" /
 * "Middle of the road" answers. Forcing a decision keeps the data
 * clean and the answers usable.
 */
export const ASK_QUESTIONS = [
  {
    key: "pastClaims" as const,
    prompt: "Filed a claim in the last 3 years?",
    options: ["No", "Yes — once", "Yes — more than once"],
  },
  {
    key: "worry" as const,
    prompt: "What worries you most about your current policy?",
    options: [
      "Claim getting denied",
      "Hidden costs",
      "No support when needed",
    ],
  },
  {
    key: "priority" as const,
    prompt: "What matters more at renewal?",
    options: ["Pay less", "Worry less"],
  },
  {
    key: "parking" as const,
    prompt: "Where's the car parked at night?",
    options: ["Garage / basement", "Driveway / society", "On the street"],
  },
] as const;

export type AskQuestionKey = (typeof ASK_QUESTIONS)[number]["key"];

/** Captured answers from Stop 3. All fields optional — customer may skip. */
export interface JourneyAnswers {
  pastClaims?: string;
  worry?: string;
  priority?: string;
  parking?: string;
}
