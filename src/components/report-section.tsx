/**
 * ReportSection — the editorial frame every body section of /report/[id]
 * uses in Phase 6.1+.
 *
 * Magazine-style, frameless by default:
 *
 *     · 01 · WHAT'S WORKING ·                    [mono · sage kicker]
 *
 *     Strong on essentials.                       [serif headline, italic plum on accent]
 *
 *     Optional intro line in italic slate.        [serif italic body, optional]
 *
 *     ─────────────────────────────────────       [hairline]
 *
 *     [children — list, items, callouts, etc.]
 *
 *     [optional sketch float on desktop]
 *
 * Design discipline locked in:
 *   - No card frames as default (no rounded boxes, no shadows)
 *   - Generous whitespace (sections separated by `mt-14 md:mt-20`)
 *   - Plum is reserved for accent (italic words, CTAs)
 *   - Sage is reserved for kickers + "what works" affirmation
 *   - Coral is reserved for TRUE alerts (used sparingly)
 *   - Charcoal for body text; slate for muted
 *   - All headings serif (Newsreader), all labels mono (JetBrains Mono)
 */

import type React from "react";

interface ReportSectionProps {
  /** "01", "02", "03", "04" — appears in the kicker. */
  number: string;
  /** "WHAT'S WORKING", "WHAT'S MISSING", etc. — uppercase mono label. */
  kicker: string;
  /** Editorial heading. Pass a string ("Strong on essentials.") and
   *  the component auto-italicises the trailing sentence-phrase in
   *  plum. Pass a ReactNode to control highlight placement yourself. */
  heading: React.ReactNode;
  /** Optional intro paragraph in italic-slate serif under the heading. */
  intro?: React.ReactNode;
  /** Optional ink-line brand sketch shown floated-right on desktop and
   *  centred above the heading on mobile. Use the brand sketch family
   *  (SketchOpenRoad, SketchExitSign, SketchPetrolPump, SketchVerdict,
   *  etc.) for editorial coherence. */
  sketch?: React.ReactNode;
  /** Optional "anchor" / id for in-page links (gate scrolls to gaps etc). */
  anchor?: string;
  /** Section body. Editorial lists, callouts, etc. */
  children?: React.ReactNode;
}

export function ReportSection({
  number,
  kicker,
  heading,
  intro,
  sketch,
  anchor,
  children,
}: ReportSectionProps) {
  return (
    <section
      id={anchor}
      className="relative mt-14 md:mt-20 first:mt-0 max-w-2xl mx-auto px-5 md:px-6 print:mt-10 print:break-inside-avoid"
    >
      {/* Sketch — floated-right on desktop, stacked above on mobile */}
      {sketch && (
        <div className="md:absolute md:top-0 md:right-0 md:-mr-2 md:w-[120px] md:h-auto text-brand-plum/80 mb-4 md:mb-0 flex justify-center md:justify-end">
          {sketch}
        </div>
      )}

      {/* Kicker */}
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold">
        · {number} · {kicker} ·
      </div>

      {/* Heading */}
      <h2 className="mt-3 md:mt-4 font-serif font-medium text-[28px] md:text-[38px] leading-[1.08] tracking-[-0.02em] text-brand-charcoal m-0 max-w-xl">
        {typeof heading === "string"
          ? renderHighlightedHeading(heading)
          : heading}
      </h2>

      {/* Intro */}
      {intro && (
        <p className="mt-3 md:mt-4 font-serif italic text-[15px] md:text-lg leading-[1.55] text-brand-slate max-w-xl">
          {intro}
        </p>
      )}

      {/* Hairline separator before the body */}
      <div className="mt-6 md:mt-8 border-t border-brand-charcoal/15" />

      {/* Body */}
      <div className="mt-6 md:mt-8 max-w-xl">{children}</div>
    </section>
  );
}

/**
 * Heuristic — italicise the trailing sentence-phrase in plum. Lets us
 * write headings like "Strong on essentials." and get the cadence we
 * want without templating special markers. Same heuristic ActFrame's
 * ActHeading uses on the journey.
 */
function renderHighlightedHeading(heading: string): React.ReactNode {
  const m = heading.match(/^(.*?)\s+([^.\s][^.]*\.)$/);
  if (!m) return heading;
  const [, lead, accent] = m;
  return (
    <>
      {lead}{" "}
      <span className="italic text-brand-plum">{accent}</span>
    </>
  );
}

/* ─── Editorial list item primitives ────────────────────────────────── */

/**
 * Editorial list row used inside section bodies. No card frame, no
 * background — just a small status glyph + serif title + slate body
 * + a hairline below it. Replaces the old icon-square + rounded-card
 * pattern from SectionCard.
 */
export function SectionItem({
  status = "neutral",
  title,
  body,
  callout,
}: {
  status?: "good" | "watch" | "alert" | "neutral";
  title: string;
  body?: React.ReactNode;
  /** Optional extra child rendered under the body (e.g. claim simulator). */
  callout?: React.ReactNode;
}) {
  // Status glyphs draw on the real functional colors from the brand
  // palette — `brand-alert` (warm coral #E17055) for true risk,
  // `brand-success` (teal #00B894) for unambiguous wins, plum +
  // sage for the editorial mid-tones. Used sparingly so the page
  // stays calm everywhere except where danger or strength belongs.
  const statusGlyph =
    status === "good"
      ? { char: "✓", cls: "text-brand-success" }
      : status === "watch"
        ? { char: "⚠", cls: "text-brand-plum" }
        : status === "alert"
          ? {
              char: "!",
              cls: "text-brand-alert font-black text-[18px]",
            }
          : { char: "·", cls: "text-brand-slate" };

  return (
    <div className="border-b border-brand-charcoal/10 last:border-b-0 py-4 md:py-5 flex items-start gap-3 md:gap-4">
      {/* Status glyph in a small mono badge — no rounded boxes, no fills */}
      <div
        className={`flex-shrink-0 w-6 h-6 inline-flex items-center justify-center font-mono font-bold text-[14px] leading-none ${statusGlyph.cls}`}
        aria-hidden
      >
        {statusGlyph.char}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-serif font-semibold text-[16px] md:text-[18px] tracking-[-0.01em] text-brand-charcoal leading-snug">
          {title}
        </div>
        {body && (
          <div className="mt-1 font-serif text-[14px] md:text-[15px] leading-[1.55] text-brand-slate">
            {body}
          </div>
        )}
        {callout && <div className="mt-2">{callout}</div>}
      </div>
    </div>
  );
}

/**
 * Editorial pull-quote / call-out used inside section bodies to surface
 * a "money at risk" line, a key takeaway, etc. No card frame —
 * a left-border accent + serif italic copy. Plum by default; pass
 * `tone="alert"` for true alerts.
 */
export function SectionPullQuote({
  label,
  children,
  tone = "plum",
}: {
  /** Mono uppercase kicker above the quote, e.g. "At risk today". */
  label?: string;
  children: React.ReactNode;
  tone?: "plum" | "alert" | "sage";
}) {
  // Alert tone draws on the real `brand-alert` (warm coral #E17055)
  // — used where a number or a callout signals genuine financial
  // risk. Sage + plum keep the editorial mid-tones.
  const borderCls =
    tone === "alert"
      ? "border-brand-alert border-l-4"
      : tone === "sage"
        ? "border-brand-sage border-l-2"
        : "border-brand-plum border-l-2";
  const labelCls =
    tone === "alert"
      ? "text-brand-alert"
      : tone === "sage"
        ? "text-brand-sage"
        : "text-brand-plum";

  return (
    <div
      className={`my-5 md:my-6 pl-4 md:pl-5 ${borderCls}`}
    >
      {label && (
        <div
          className={`font-mono text-[10px] uppercase tracking-[0.14em] font-bold ${labelCls}`}
        >
          · {label} ·
        </div>
      )}
      <div className="mt-1 font-serif italic text-[16px] md:text-lg leading-[1.5] text-brand-charcoal">
        {children}
      </div>
    </div>
  );
}
