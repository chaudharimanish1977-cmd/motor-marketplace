/**
 * Journey copy — single source of truth for what each of the 5 acts
 * says in each lifecycle state.
 *
 * The 5-act journey is the editorial 90-second experience that runs
 * during the parsing wait. Same skeleton across states; content shifts
 * by state. This file is pure (no React) so it's easy to scan, edit,
 * and translate later.
 *
 * Act structure:
 *
 *   1 · Hello     ~15s   confirm receipt, personalise
 *   2 · Read      ~25s   show the work, build trust (LoaderScene mounts here)
 *   3 · Ask       ~20s   capture 2 high-leverage questions
 *   4 · skip      —      (educational beat removed by user decision)
 *   5 · Anticipate ~30s  capability tease + reveal hold
 *
 * State D (lapsed) compresses to 60s total — urgency context, skip Ask.
 */

import type { LifecycleState } from "./lifecycle-state";

/* ─── Per-act content ──────────────────────────────────────────────── */

export interface ActContent {
  /** Display heading in editorial serif. */
  heading: string;
  /** Optional body line beneath the heading (italic-serif slate). */
  body?: string;
  /** Milliseconds this act stays on screen before auto-advance. */
  durationMs: number;
}

export interface JourneyContent {
  hello: ActContent;
  read: ActContent;
  ask: ActContent;
  anticipate: ActContent;
  /** True for State D: collapse the journey, skip the Ask act, urgency framing. */
  skipAsk: boolean;
  /** Total expected duration of the journey. Caller uses this to enforce the
   *  hold-to-90s discipline (or hold-to-60s for State D). */
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

/* ─── The map ──────────────────────────────────────────────────────── */

const FALLBACK_VEHICLE = "your car";

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

  switch (state) {
    case "A": {
      const helloBody =
        typeof days === "number" && days >= 0
          ? `Renewal's in ${days} days — perfect window.`
          : "We're in the renewal window.";
      const helloHeading =
        docCount > 1
          ? `Stacking up your ${docCount} documents.`
          : `Reading your ${vehicle}.`;
      return {
        hello: { heading: helloHeading, body: helloBody, durationMs: 15_000 },
        read: {
          heading: "What we're checking.",
          body:
            docCount > 1
              ? "Side by side: declared value, depreciation cover, no-claim bonus, engine protection, cashless network."
              : "Declared value, depreciation cover, no-claim bonus, engine protection, cashless network — the things that decide whether your claim lands in full or in fragments.",
          durationMs: 25_000,
        },
        ask: {
          heading: "Two quick things — so we can tailor.",
          body: "Tap to choose. Skip if you'd rather not say.",
          durationMs: 20_000,
        },
        anticipate: {
          heading: "Stitching your verdict.",
          body: "We're pulling 3 fresh quotes from our partners — they'll be on the next screen alongside yours.",
          durationMs: 30_000,
        },
        skipAsk: false,
        minTotalMs: 90_000,
      };
    }

    case "B": {
      const helloBody =
        typeof days === "number"
          ? `${days} days till renewal — let's see how this year's policy is holding up.`
          : "Let's see how this year's policy is holding up.";
      return {
        hello: {
          heading: `Got your ${vehicle}.`,
          body: helloBody,
          durationMs: 15_000,
        },
        read: {
          heading: "What we're checking.",
          body: "Declared value, depreciation cover, no-claim bonus, engine protection, cashless network — the things that decide whether your claim lands in full or in fragments.",
          durationMs: 25_000,
        },
        ask: {
          heading: "Two quick things — so we can tailor.",
          body: "Tap to choose. Skip if you'd rather not say.",
          durationMs: 20_000,
        },
        anticipate: {
          heading: "Stitching your verdict.",
          body: "We'll come knocking 45 days before renewal — with the best quotes we can find.",
          durationMs: 30_000,
        },
        skipAsk: false,
        minTotalMs: 90_000,
      };
    }

    case "C":
      return {
        hello: {
          heading: `Got your fresh ${vehicle} policy.`,
          body: "Let's check exactly what you signed up for.",
          durationMs: 15_000,
        },
        read: {
          heading: "What we're checking.",
          body: "Declared value, depreciation cover, no-claim bonus, engine protection, cashless network — the things that decide whether your claim lands in full or in fragments.",
          durationMs: 25_000,
        },
        ask: {
          heading: "Two quick things — so we can tailor.",
          body: "Tap to choose. Skip if you'd rather not say.",
          durationMs: 20_000,
        },
        anticipate: {
          heading: "Saving this for the year.",
          body: "We'll be back when renewal's in sight.",
          durationMs: 30_000,
        },
        skipAsk: false,
        minTotalMs: 90_000,
      };

    case "D": {
      const daysLapsed = typeof days === "number" ? Math.abs(days) : null;
      return {
        hello: {
          heading: daysLapsed
            ? `Your ${vehicle} policy expired ${daysLapsed} day${daysLapsed === 1 ? "" : "s"} ago.`
            : `Your ${vehicle} policy has lapsed.`,
          body: "Reviewing what was there — we'll get you up to date next.",
          durationMs: 15_000,
        },
        read: {
          heading: "What we're checking.",
          body: "Declared value, depreciation cover, no-claim bonus, engine protection, cashless network — the things you were paying for last year.",
          durationMs: 20_000,
        },
        ask: {
          // Skipped — but keep shape consistent for typing.
          heading: "",
          body: "",
          durationMs: 0,
        },
        anticipate: {
          heading: "Reviewing the lapse.",
          body: "On the next screen: what to do right now to get back on cover.",
          durationMs: 25_000,
        },
        skipAsk: true,
        minTotalMs: 60_000,
      };
    }
  }
}

/* ─── Ask-act option lists ──────────────────────────────────────────── */

/**
 * The 2 high-leverage questions surfaced in Act 3. Both are
 * single-select chip rows; skipping is allowed.
 *
 * Kept here (not in the component) so translation / A-B-testing can
 * touch labels without component edits.
 */
export const ASK_QUESTIONS = [
  {
    key: "pastClaims" as const,
    prompt: "Filed a claim in the last 3 years?",
    options: [
      "No",
      "Yes — once",
      "Yes — more than once",
      "Don't remember",
    ],
  },
  {
    key: "worry" as const,
    prompt: "What worries you most about your current policy?",
    options: [
      "Claim getting denied",
      "Hidden costs",
      "No support when needed",
      "Not sure",
    ],
  },
] as const;

export type AskQuestionKey = (typeof ASK_QUESTIONS)[number]["key"];

/** Captured answers from Act 3. Optional fields — customer may skip. */
export interface JourneyAnswers {
  pastClaims?: string;
  worry?: string;
}
