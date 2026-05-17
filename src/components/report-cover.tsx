/**
 * ReportCover — Phase 6.0 editorial entrance to the policy report.
 *
 * The customer just finished a 2-min test drive (the upload journey)
 * and tapped "See the verdict →" on the Destination beat. They land
 * on /report/[id]; this is the first thing they see.
 *
 * Designed as a magazine COVER PAGE — pure typography + one ink-line
 * illustration (the CarSmiley rating). No card frames, no shadows,
 * no rounded boxes. Generous whitespace. The publication is "The
 * Garage" (continuous with the test-drive metaphor: drive →
 * back to the garage for the review).
 *
 * Layout, top to bottom:
 *
 *     · THE GARAGE · NO. 0042 ·          [mono · sage masthead]
 *
 *         A TEST-DRIVE REVIEW             [mono · plum section label]
 *
 *         Your Audi A6.                   [serif · italic plum on model]
 *
 *         Reviewed · 17 May 2026          [mono · slate byline]
 *
 *              [ CarSmiley rating ]       [scale-pop entrance]
 *                  · Good ·
 *
 *         "Your A6 is well-covered —      [serif italic pull-quote]
 *          but you're one engine-
 *          protection claim away from
 *          a ₹1.5L bill."
 *
 *         ↓ Read the full review          [mono scroll cue]
 *
 *         ─────────────────────────       [hairline separator]
 *
 *         HDFC ERGO · DL-09-CAU-2020      [mono vehicle band — factbox]
 *         Delhi RTO · 2015
 *                 [NumberPlate]
 */

import { CarSmiley, type SmileyRating } from "@/components/car-smiley";
import { NumberPlate } from "@/components/number-plate";
import { computeCoverageScore } from "@/lib/coverage-score";
import { formatINR } from "@/lib/format";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";

interface ReportCoverProps {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
}

/* ─── Smiley rating from coverage score ─────────────────────────────── */

interface RatingMeta {
  rating: SmileyRating;
  label: string;
}

/**
 * Map the 0–100 coverage score to the 5-point CarSmiley rating used
 * across the brand. Insurance-tuned labels: we avoid "Delighted" /
 * "Awful" in favour of language that signals coverage health.
 */
function ratingFromCoverageScore(score: number): RatingMeta {
  if (score >= 85) return { rating: 5, label: "Excellent" };
  if (score >= 70) return { rating: 4, label: "Good" };
  if (score >= 50) return { rating: 3, label: "Decent" };
  if (score >= 30) return { rating: 2, label: "Gaps to watch" };
  return { rating: 1, label: "Critical" };
}

/* ─── Issue number from report ID ───────────────────────────────────── */

/**
 * Deterministic 4-digit "No. XXXX" issue number derived from the
 * report's parsed-policy ID. Gives the cover a magazine-issue feel
 * ("we've done this many times") without requiring a DB counter.
 */
function issueNumberFor(id: string): string {
  let h = 5_381;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  }
  // Map into [42, 9999] — first issue is No. 42 (editorial cliché on purpose).
  const n = 42 + (Math.abs(h) % 9958);
  return n.toString().padStart(4, "0");
}

/* ─── Date helper ───────────────────────────────────────────────────── */

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/* ─── Verdict highlight ──────────────────────────────────────────────
 *
 * Phase 6.0 keeps the verdict in plain serif (no per-word colouring)
 * and lets the pull-quote treatment — centered, larger serif,
 * plum-italic curly quotes — carry the emphasis on its own. Earlier
 * versions tried to italicise the "gap" phrase, but the LLM verdict
 * structure is too varied for a clean heuristic and the highlight
 * either ate the whole sentence or landed on the wrong word.
 */

export function ReportCover({ parsedPolicy, report }: ReportCoverProps) {
  const make = parsedPolicy.vehicle.make || "your car";
  const model = parsedPolicy.vehicle.model || "";
  const vehicleLabel = `${make} ${model}`.trim();

  // Smiley rating — coverage score is the source of truth.
  const coverageScore = computeCoverageScore(parsedPolicy, report);
  const { rating, label: ratingLabel } = ratingFromCoverageScore(
    coverageScore.score
  );

  // Issue number + date for the byline + masthead.
  const issueNo = issueNumberFor(parsedPolicy.id);
  const reviewDate = formatReviewDate(report.generatedAt);

  // The verdict: prefer the LLM-generated takeaway headline (per-customer)
  // and fall back to the coverage-score template if missing.
  const verdict =
    report.keyTakeaway.headline?.trim() || coverageScore.headline;

  // Vehicle band facts — used in the factbox under the cover.
  const yearLabel = parsedPolicy.vehicle.yearOfManufacture || "";
  const rtoLabel = parsedPolicy.vehicle.rto || "";
  const insurerShort =
    parsedPolicy.insurerName
      ?.split(/\s+/)
      .slice(0, 2)
      .join(" ") || "";

  return (
    <section className="bg-brand-offwhite">
      <div className="max-w-2xl mx-auto px-5 md:px-6 pt-10 md:pt-16 pb-10 md:pb-14">
        {/* Masthead — publication name + issue number */}
        <div className="text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold">
          · The Garage · No. {issueNo} ·
        </div>

        {/* Section label */}
        <div className="mt-4 text-center font-mono text-[11px] md:text-[12px] uppercase tracking-[0.22em] text-brand-plum font-bold">
          · A Test-Drive Review ·
        </div>

        {/* Headline — Your Vehicle Make Model. */}
        <h1 className="mt-6 md:mt-8 text-center font-serif font-medium text-[44px] md:text-[64px] leading-[1.02] tracking-[-0.022em] text-brand-charcoal m-0">
          Your{" "}
          <span className="italic text-brand-plum">
            {vehicleLabel}.
          </span>
        </h1>

        {/* Byline */}
        <div className="mt-4 md:mt-5 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
          Reviewed · {reviewDate}
        </div>

        {/* Hero: CarSmiley rating */}
        <div className="mt-9 md:mt-11 flex flex-col items-center text-brand-plum">
          <div className="relative">
            {/* Soft pulse rings behind the smiley — same energy as the
             *  Destination beat on the journey. */}
            <span
              className="absolute inset-0 -m-6 rounded-full bg-brand-plum/8 animate-roadpulse"
              aria-hidden
            />
            <div className="relative animate-smiley-pop">
              <CarSmiley rating={rating} width={140} />
            </div>
          </div>
          <div className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold">
            · {ratingLabel} ·
          </div>
        </div>

        {/* The verdict — one-sentence pull quote. Plain serif body,
         *  plum-italic curly quotes for the editorial accent. */}
        <p className="mt-9 md:mt-11 text-center max-w-xl mx-auto font-serif text-[19px] md:text-[24px] leading-[1.4] tracking-[-0.01em] text-brand-charcoal">
          <span className="italic text-brand-plum">&ldquo;</span>
          {verdict}
          <span className="italic text-brand-plum">&rdquo;</span>
        </p>

        {/* Scroll cue */}
        <div className="mt-10 md:mt-12 text-center font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
          ↓ Read the full review
        </div>

        {/* Hairline separator + vehicle factbox */}
        <div className="mt-10 md:mt-14 border-t border-brand-charcoal/15" />
        <div className="mt-6 md:mt-7 text-center space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-slate">
            {[insurerShort, rtoLabel ? `${rtoLabel} RTO` : "", yearLabel]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <div className="flex flex-col items-center gap-2">
            {parsedPolicy.vehicle.registrationNumber && (
              <NumberPlate
                value={parsedPolicy.vehicle.registrationNumber}
                size="lg"
              />
            )}
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
              Cover: {formatDateShort(parsedPolicy.odPeriodStart)} →{" "}
              {formatDateShort(parsedPolicy.odPeriodEnd)} · IDV{" "}
              {formatINR(parsedPolicy.idv)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Short date for the cover band ─────────────────────────────────── */

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
