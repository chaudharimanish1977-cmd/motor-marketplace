"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

/**
 * RightOffer investor pitch deck. 20 slides, 16:9, designed to read like
 * the product itself — editorial typography, plum + sage accents, serif
 * body, mono small-caps kickers. Same aesthetic an investor sees when we
 * walk them through a customer audit, so the deck and the demo rhyme.
 *
 * Controls:
 *   → / Space / J     next slide
 *   ← / K             previous slide
 *   1–9               jump to slide
 *   Home / End        first / last slide
 *   F                 toggle fullscreen
 *   P                 toggle print preview (all slides in flow)
 *
 * The print mode shows every slide stacked so Ctrl+P → "Save as PDF"
 * exports a clean 20-page document.
 */
export function PitchDeck() {
  const slides = SLIDES;
  const [idx, setIdx] = useState(0);
  const [printMode, setPrintMode] = useState(false);

  // Enable print mode when URL contains ?print=1 — used by /api/pitch/pdf
  // so puppeteer can render the full stacked deck headlessly without any
  // keyboard interaction. Reads window.location at mount so we don't need
  // useSearchParams (which would force a Suspense boundary).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("print") === "1") setPrintMode(true);
  }, []);

  // The deck now respects the user's dark/light preference like every
  // other surface. Brand tokens (charcoal, plum, sage, slate) flip via
  // CSS variables in globals.css; the only hand-tuned values are the
  // page bg (see BG below) — cream in light, warm near-black in dark.
  // No more force-strip of the `dark` class.

  const go = useCallback(
    (n: number) => {
      setIdx((((n % slides.length) + slides.length) % slides.length));
    },
    [slides.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "j":
        case "J":
          e.preventDefault();
          go(idx + 1);
          break;
        case "ArrowLeft":
        case "k":
        case "K":
          e.preventDefault();
          go(idx - 1);
          break;
        case "Home":
          go(0);
          break;
        case "End":
          go(slides.length - 1);
          break;
        case "f":
        case "F":
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen?.();
          }
          break;
        case "p":
        case "P":
          setPrintMode((m) => !m);
          break;
        default:
          if (/^[1-9]$/.test(e.key)) {
            const target = parseInt(e.key, 10) - 1;
            if (target < slides.length) go(target);
          }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, idx, slides.length]);

  // Page background. Light = warm cream #fdf8f0 (editorial, matches
  // the audit report aesthetic). Dark = warm near-black #13100f (mirrors
  // the cream's warmth on the dark side; subtly distinct from pure
  // #0e0a10 page bg so the deck still reads as its own surface).
  // text-brand-charcoal flips cream-on-dark / charcoal-on-light via
  // the CSS variable — no override needed.
  const BG = "bg-[#fdf8f0] dark:bg-[#13100f] text-brand-charcoal font-serif";

  if (printMode) {
    return (
      <div className={BG}>
        {slides.map((slide, i) => (
          <div
            key={i}
            className="aspect-[16/9] w-full max-w-screen-2xl mx-auto border-b border-brand-charcoal/10 print:border-0 print:break-after-page"
          >
            <SlideShell idx={i} total={slides.length}>
              {slide.render()}
            </SlideShell>
          </div>
        ))}
        <button
          onClick={() => setPrintMode(false)}
          className="fixed top-4 right-4 z-50 px-4 py-2 rounded-full bg-brand-plum/10 hover:bg-brand-plum/20 text-xs font-mono font-semibold tracking-wider uppercase text-brand-plum print:hidden"
        >
          Exit print mode (P)
        </button>
      </div>
    );
  }

  const slide = slides[idx];

  return (
    <div className={clsx("fixed inset-0 overflow-hidden", BG)}>
      <SlideShell idx={idx} total={slides.length}>
        {slide.render()}
      </SlideShell>

      {/* Progress dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-40">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={clsx(
              "h-1.5 rounded-full transition-all",
              i === idx
                ? "w-8 bg-brand-plum"
                : i < idx
                  ? "w-2 bg-brand-plum/40 hover:bg-brand-plum/60"
                  : "w-2 bg-brand-charcoal/15 hover:bg-brand-charcoal/30"
            )}
          />
        ))}
      </div>

      {/* Nav arrows — editorial-quiet, plum tint on hover */}
      <button
        onClick={() => go(idx - 1)}
        aria-label="Previous slide"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-brand-plum/5 hover:bg-brand-plum/15 border border-brand-plum/15 hover:border-brand-plum/40 flex items-center justify-center text-brand-plum/60 hover:text-brand-plum transition-all z-40"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => go(idx + 1)}
        aria-label="Next slide"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-brand-plum/5 hover:bg-brand-plum/15 border border-brand-plum/15 hover:border-brand-plum/40 flex items-center justify-center text-brand-plum/60 hover:text-brand-plum transition-all z-40"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Hint */}
      <div className="absolute bottom-6 right-8 text-[10px] text-brand-charcoal/30 font-mono font-medium tracking-wider uppercase z-40 animate-fade-out-slow">
        ← → · space · F · P
      </div>
    </div>
  );
}

// ============================================================================
// Slide shell — common chrome (wordmark + page number + footer brand)
// ============================================================================

function SlideShell({
  idx,
  total,
  children,
}: {
  idx: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center p-12 md:p-20">
      {idx > 0 && (
        <div className="absolute top-8 left-12">
          <Wordmark />
        </div>
      )}
      <div className="absolute bottom-8 left-12 font-mono text-[10.5px] tracking-[0.18em] uppercase text-brand-charcoal/40 font-semibold">
        · rightoffer.in ·
      </div>
      <div className="absolute bottom-8 right-12 font-mono text-[10.5px] tracking-[0.18em] uppercase text-brand-charcoal/40 font-semibold tabular-nums">
        {String(idx + 1).padStart(2, "0")}{" "}
        <span className="text-brand-charcoal/20">/ {String(total).padStart(2, "0")}</span>
      </div>
      <div className="w-full max-w-6xl">{children}</div>
    </div>
  );
}

/**
 * Text wordmark matching the site header — italic plum "r" + small-caps
 * RightOffer + sage CAR pill. Inline (no SVG), so the deck has no asset
 * dependency that could fail to load.
 */
function Wordmark({ size = "default" }: { size?: "default" | "large" }) {
  const isLarge = size === "large";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={clsx(
          "font-serif italic font-semibold leading-none text-brand-plum",
          isLarge ? "text-5xl" : "text-xl"
        )}
        aria-hidden
      >
        r
      </span>
      <span
        className={clsx(
          "font-serif font-medium leading-none text-brand-charcoal tracking-tight",
          isLarge ? "text-4xl" : "text-base"
        )}
        style={{ fontVariant: "small-caps" }}
      >
        RightOffer
      </span>
      <span
        className={clsx(
          "font-mono font-bold tracking-[0.12em] bg-brand-sage text-brand-offwhite rounded-sm",
          isLarge ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]"
        )}
      >
        CAR
      </span>
      <span className="sr-only">RightOffer Car</span>
    </span>
  );
}

// ============================================================================
// Editorial helpers — match the audit-report typography
// ============================================================================

/** Mono small-caps kicker. The deck's structural anchor — every slide has one. */
function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] md:text-[12px] font-bold tracking-[0.18em] uppercase text-brand-sage mb-8">
      · {children} ·
    </div>
  );
}

/** Serif headline — medium weight, generous line-height, plum italic accents inline. */
function Headline({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={clsx(
        "font-serif font-medium text-4xl md:text-6xl lg:text-7xl leading-[1.06] tracking-[-0.018em] text-brand-charcoal",
        className
      )}
    >
      {children}
    </h1>
  );
}

/** Inline italic plum accent — replaces the old bold-orange Accent. */
function Em({ children }: { children: ReactNode }) {
  return <span className="italic text-brand-plum">{children}</span>;
}

/** Sage accent — for positive callouts (savings, traction wins). */
function Sage({ children }: { children: ReactNode }) {
  return <span className="text-brand-sage font-semibold">{children}</span>;
}

/** Body copy — slate serif. */
function Body({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={clsx(
        "font-serif text-brand-slate text-lg md:text-xl leading-[1.55]",
        className
      )}
    >
      {children}
    </p>
  );
}

/** Huge editorial number — serif italic plum, used for hero stats. */
function HugeNumber({
  children,
  tone = "charcoal",
}: {
  children: ReactNode;
  tone?: "plum" | "charcoal";
}) {
  return (
    <div
      className={clsx(
        "font-serif font-medium leading-[0.95] text-[110px] md:text-[170px] lg:text-[200px] tracking-[-0.03em]",
        tone === "plum" ? "italic text-brand-plum" : "text-brand-charcoal"
      )}
    >
      {children}
    </div>
  );
}

/** Pull quote — italic serif, plum left rule. */
function PullQuote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="border-l-2 border-brand-plum pl-5 max-w-3xl">
      <p className="font-serif italic text-[20px] md:text-[24px] leading-[1.45] text-brand-charcoal m-0">
        {children}
      </p>
    </blockquote>
  );
}

// ============================================================================
// THE SLIDES — 20, editorial, 16:9
// ============================================================================

interface Slide {
  render: () => ReactNode;
}

const SLIDES: Slide[] = [
  // ─────────────────────────────────────────────────── 01 Cover
  {
    render: () => (
      <div className="text-center">
        <div className="mb-10 inline-block">
          <Wordmark size="large" />
        </div>
        <div className="font-serif italic font-medium text-2xl md:text-3xl text-brand-charcoal max-w-2xl mx-auto leading-[1.35]">
          Right Cover. Right Price.
          <br />
          <Em>The Right Offer.</Em>
        </div>
        <div className="mt-6 font-serif text-base md:text-lg text-brand-slate max-w-xl mx-auto">
          An honest second opinion on motor insurance — and the marketplace
          built around it.
        </div>
        <div className="mt-24 inline-flex flex-col items-center gap-1 font-mono text-[10.5px] tracking-[0.18em] uppercase text-brand-charcoal/45 font-semibold">
          <div>· Pre-seed + Seed · $7M — $10M ·</div>
          <div>· Manish Chaudhari · Founder &amp; CEO ·</div>
          <div>· 2026 ·</div>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 02 The problem
  {
    render: () => (
      <div>
        <Kicker>The renewal moment</Kicker>
        <HugeNumber tone="plum">35 million</HugeNumber>
        <div className="mt-6 font-serif font-medium text-2xl md:text-3xl text-brand-charcoal leading-[1.3] max-w-3xl">
          Indians renew their car insurance every year.
        </div>
        <div className="mt-8 space-y-2 font-serif text-base md:text-lg text-brand-slate max-w-2xl">
          <div>
            <Sage>80%</Sage> don&rsquo;t read the policy.
          </div>
          <div>
            <Sage>60%</Sage> are missing protection they&rsquo;d need at claim
            time.
          </div>
          <div>
            <Em>₹85,000</Em> average claim-time shortfall per gap.
          </div>
        </div>
        <div className="mt-12 font-mono text-[9.5px] md:text-[10.5px] tracking-[0.14em] uppercase text-brand-charcoal/35 font-medium max-w-3xl">
          · Sources · IRDAI Annual Report FY24 · MoRTH Vahan Sewa · General
          Insurance Council · RightOffer internal analysis ·
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 03 The regret
  {
    render: () => (
      <div className="text-center">
        <Headline className="text-center">
          The most expensive
          <br />
          financial decision Indians
          <br />
          make in <Em>five minutes</Em>.
        </Headline>
        <div className="mt-10 font-serif italic text-xl md:text-2xl text-brand-slate">
          And then live with it.
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 04 Three misalignments
  {
    render: () => (
      <div>
        <Kicker>Why the category is broken</Kicker>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
          {[
            {
              title: "The customer",
              body: "Doesn't read the 15-page policy. Discovers the gap at claim time. By then it's too late.",
            },
            {
              title: "The insurer",
              body: "Competes only on premium. Race to bottom → claim disputes → brand damage. No way out.",
            },
            {
              title: "The aggregator",
              body: "Sorts on price. Sells the lead. Commodifies the category. Then the call-spam begins.",
            },
          ].map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-plum font-bold mb-3">
                · {col.title} ·
              </div>
              <Body className="!text-base !leading-[1.55]">{col.body}</Body>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <PullQuote>
            Most people sell insurance. <Em>We help you decide.</Em>
          </PullQuote>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 05 Four stakeholders
  {
    render: () => (
      <div>
        <Kicker>Four stakeholders · one alignment</Kicker>
        <Headline className="!text-3xl md:!text-5xl lg:!text-6xl mb-10 md:mb-12">
          Right coverage <Em>squares</Em> what lowest-premium broke.
        </Headline>

        {/* 4-column stakeholder wants — each column shows what they
            actually optimise for. Reading them side-by-side surfaces
            the conflict everyone's been building around: customer
            wants low premium, insurer wants high, intermediary takes
            highest commission, regulator wants all of the above plus
            transparency + claim performance. The current category
            sells one cell of this matrix to one customer at a time;
            no product has aligned the full grid. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7 mb-10 md:mb-12">
          {[
            {
              t: "Customer",
              items: [
                "Lowest premium",
                "Zero co-pay at claim",
                "Fully digital experience",
                "Tailored to my car",
              ],
            },
            {
              t: "Insurer",
              items: [
                "High premiums",
                "Low commissions",
                "Digital intake",
                "Risk-fit customers",
              ],
            },
            {
              t: "Intermediary",
              items: [
                "Lowest premium pitch",
                "Highest commission",
              ],
            },
            {
              t: "Regulator",
              items: [
                "Lowest premiums",
                "Lowest commissions",
                "Transparent offerings",
                "Service excellence",
                "Timely claim settlement",
              ],
            },
          ].map((col) => (
            <div
              key={col.t}
              className="border-l-2 border-brand-plum/40 pl-4"
            >
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-plum font-bold mb-3">
                · {col.t} ·
              </div>
              <ul className="list-none p-0 m-0 space-y-1.5 font-serif text-[13.5px] md:text-[14.5px] text-brand-charcoal leading-[1.4]">
                {col.items.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* RightOffer positioning answer — sage left-rule so it visually
            reads as the answer, not just another column. Three braided
            moves in one paragraph: re-frame the question, data-driven
            bid, honest commission. */}
        <div className="border-l-2 border-brand-sage pl-6 max-w-4xl">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-3">
            · Why RightOffer is placed for this ·
          </div>
          <p className="font-serif text-[15.5px] md:text-[17px] text-brand-charcoal leading-[1.55] m-0">
            The category has been sold on{" "}
            <Em>&ldquo;insurance starting at ₹XXX/month&rdquo;</Em>{" "}
            for a decade. Customers who&rsquo;ve been through a claim
            know that wasn&rsquo;t enough. We change the question from
            &ldquo;lowest premium&rdquo; to{" "}
            <Em>right coverage at the right price</Em> — a data-driven
            bidding process matches each customer to insurers whose
            risk appetite fits, the entire flow is digital, and a{" "}
            <Sage>flat 10% commission</Sage> across every insurer
            keeps the ranking honest and lets carriers pass the saving
            back to the customer. One product that aligns with what
            every stakeholder — including the regulator — actually
            wants.
          </p>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 06 The product
  {
    render: () => (
      <div>
        <Kicker>One product · two phases</Kicker>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-14">
          <div className="border-l-2 border-brand-sage pl-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-2">
              · Phase 1 · Live today ·
            </div>
            <Headline className="!text-3xl md:!text-4xl mb-4">
              The <Em>audit</Em>.
            </Headline>
            <Body className="!text-base">
              Forward your policy. AI-powered editorial review of coverage gaps,
              IDV, add-on relevance, claim-time math. Free. Two minutes. No
              sign-up.
            </Body>
          </div>
          <div className="border-l-2 border-brand-plum pl-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-plum font-bold mb-2">
              · V1 · In build ·
            </div>
            <Headline className="!text-3xl md:!text-4xl mb-4">
              The <Em>marketplace</Em>.
            </Headline>
            <Body className="!text-base">
              Same audit + reverse-bid auction. Insurers compete for the
              customer&rsquo;s curated bundle. Customer picks. End-to-end
              issuance.
            </Body>
          </div>
        </div>
        <div className="font-serif text-base md:text-lg text-brand-slate max-w-3xl">
          Built on an <Em>IRDAI composite broker licence</Em> — same commission
          from every insurer on the platform, so the recommendation stays
          honest. No commercial conflict in the ranking.
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 07 The channel
  {
    render: () => (
      <div>
        <Kicker>Forward an email. Get an audit.</Kicker>
        <div className="font-serif italic font-medium text-4xl md:text-6xl lg:text-7xl text-brand-plum tracking-tight mb-10 leading-[1.05]">
          review@rightoffer.in
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
          {[
            { n: "01", t: "Send", s: "Forward your policy PDF — from any inbox, on any device." },
            { n: "02", t: "AI reads", s: "OCR, classify, parse, generate audit. Inside 90 seconds." },
            { n: "03", t: "Audit arrives", s: "Editorial PDF + web view + magic-link, in your reply." },
          ].map((step) => (
            <div key={step.n}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold mb-2">
                · {step.n} ·
              </div>
              <div className="font-serif font-medium text-2xl md:text-3xl text-brand-charcoal mb-2">
                {step.t}
              </div>
              <Body className="!text-base">{step.s}</Body>
            </div>
          ))}
        </div>
        <Body className="!text-lg max-w-3xl">
          No app. No login. No call-spam. No 15-screen funnel.{" "}
          <Em>Email is universal.</Em> Customers come back the only way they
          remember — forwarding the next year&rsquo;s renewal.
        </Body>
        <div className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-charcoal/40 font-medium">
          · WhatsApp channel · Phase 2 ·
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 08 The audit artefact
  {
    render: () => (
      <div>
        <Kicker>What the customer gets</Kicker>
        <Headline className="mb-10">
          Two minutes. One PDF.
          <br />
          <Em>Zero call-spam.</Em>
        </Headline>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Mock audit card — editorial preview of what the customer sees */}
          <div className="border border-brand-charcoal/15 rounded-lg p-6 bg-white">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-2">
              · Policy review ·
            </div>
            <div className="font-serif font-medium text-2xl text-brand-charcoal mb-1">
              Audi A6<span className="italic text-brand-plum"> (2015)</span>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-slate mb-5">
              Owner · Anju C. · HDFC ERGO · Cover 18 May 25–17 May 26
            </div>
            <div className="border-l-2 border-brand-plum pl-4 mb-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-brand-plum font-bold mb-1">
                · Aryan&rsquo;s bottom line ·
              </div>
              <p className="font-serif text-[13px] text-brand-charcoal m-0 leading-[1.45]">
                Solid foundation but four critical gaps leave you exposed to
                ₹50,000+ out-of-pocket on common claims.
              </p>
              <div className="mt-3 inline-block bg-brand-plum/10 border border-brand-plum/25 rounded px-3 py-2">
                <div className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-brand-plum font-bold mb-0.5">
                  What to do
                </div>
                <p className="font-serif font-semibold text-[12px] text-brand-charcoal m-0">
                  Add Engine Protector + Consumables + NCB Protection + RSA —
                  ₹4,800/yr. Closes all major exposures.
                </p>
              </div>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-slate">
              · Coverage snapshot · 8 add-ons audited ·
            </div>
          </div>
          <div className="space-y-4">
            {[
              "Coverage snapshot table — every add-on, status, recommendation",
              "Claim-time math — ₹ exposure per gap, plain English",
              "Things to ask before binding — copy-paste lines",
              "IDV check — verified against current market resale",
              "Glossary — every term in the report, plain English",
              "PDF attached + magic-link web view + ?admin reveal",
            ].map((b) => (
              <div key={b} className="flex gap-3">
                <span className="text-brand-plum font-bold mt-1">·</span>
                <Body className="!text-base">{b}</Body>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 09 Multi-doc comparator
  {
    render: () => (
      <div>
        <Kicker>One forward · many documents</Kicker>
        <Headline className="mb-10">
          Forward your policy + every renewal quote.
          <br />
          We compare them <Em>side by side</Em>.
        </Headline>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { role: "Policy", insurer: "HDFC ERGO", period: "May 25 – May 26" },
            { role: "Quote", insurer: "Acko", period: "May 26 – May 27" },
            { role: "Quote", insurer: "Tata AIG", period: "May 26 – May 27" },
          ].map((d, i) => (
            <div
              key={i}
              className="border border-brand-charcoal/15 rounded-lg p-5 bg-white"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-brand-plum font-bold mb-1">
                · {d.role} ·
              </div>
              <div className="font-serif font-semibold text-base text-brand-charcoal mb-1">
                {d.insurer}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand-slate">
                {d.period}
              </div>
            </div>
          ))}
        </div>
        <PullQuote>
          <span className="text-brand-plum">→</span> One verdict across all
          three. Recommended bundle, missing add-ons by quote, closest fit.
          One email, one PDF, one decision.
        </PullQuote>
        <div className="mt-10 max-w-3xl">
          <Body>
            <Em>Unique behaviour.</Em> No aggregator does this — they sell
            single quotes, one at a time. Customers who shop renewal across 3
            insurers spend two evenings comparing tabs. We do it in two
            minutes.
          </Body>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 10 Aryan
  {
    render: () => (
      <div>
        <Kicker>The editorial voice</Kicker>
        <div className="font-serif italic font-medium text-7xl md:text-9xl text-brand-plum tracking-tight mb-8 leading-[0.95]">
          Aryan.
        </div>
        <div className="font-serif text-xl md:text-2xl text-brand-charcoal max-w-3xl leading-[1.4] mb-10">
          Every audit is signed by Aryan — our editorial advisor. Plain
          English. Specific. Calmly opinionated. <Em>Never a sales pitch.</Em>
        </div>
        <PullQuote>
          Your 11-year-old Audi A6 needs targeted protection, not bare-bones
          cover. Engine Protector + Consumables for ₹3,200 — critical for
          monsoon waterlogging.
        </PullQuote>
        <div className="mt-10 max-w-3xl">
          <Body>
            Not a chatbot. No avatar. No &ldquo;Hi I&rsquo;m Aryan!&rdquo;{" "}
            <Em>A stable byline</Em> — like a column the customer reads every
            renewal. Trust compounds across years.
          </Body>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 11 Behind the curtain
  {
    render: () => (
      <div>
        <Kicker>The matching intelligence customers never see</Kicker>
        <div className="font-serif italic font-medium text-6xl md:text-8xl text-brand-plum tracking-tight mb-6 leading-[0.95]">
          Section 6.
        </div>
        <div className="font-serif text-xl md:text-2xl text-brand-charcoal max-w-3xl leading-[1.4] mb-10">
          Every audit generates an <Em>Ideal Insurer Profile</Em> — selection
          criteria + ranked recommended insurers. Hidden from the customer.
          Read by the auction.
        </div>
        <div className="border border-brand-plum/30 rounded-lg p-6 bg-brand-plum/5 max-w-4xl mb-10">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold mb-3">
            · Selection criteria · sample ·
          </div>
          <ul className="font-serif text-[15px] text-brand-charcoal leading-[1.55] space-y-1 list-disc pl-5">
            <li>Premium-vehicle workshop network in Delhi-NCR</li>
            <li>Cashless claim turnaround under 48 hours</li>
            <li>Engine Protection + Consumables available as add-ons</li>
            <li>Customer-rating CSAT &gt; 4.0 on motor renewals</li>
          </ul>
        </div>
        <Body className="max-w-3xl">
          Customer sees a clean verdict. The auction reads more. That gap is{" "}
          <Em>the moat</Em> — we route RFQs to insurers who actually fit,
          without giving the customer (or the insurer) a script to game.
        </Body>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 12 Why now
  {
    render: () => (
      <div>
        <Kicker>Why now</Kicker>
        <div className="space-y-7">
          {[
            {
              t: "IRDAI 2023 reforms.",
              b: "EOM cap + Direct Broker access — the regulatory door opened for AI-led brokers.",
            },
            {
              t: "DPDP Act 2023.",
              b: "Consent-based data flows favour independents over agent-network incumbents.",
            },
            {
              t: "AI parsing cost collapsed.",
              b: "$5 → $0.05 per policy in 36 months. Free, instant policy review finally viable.",
            },
            {
              t: "Digital readiness is universal.",
              b: "87% of car buyers research insurance online. UPI / Aadhaar / DigiLocker / WhatsApp Business — all production-ready.",
            },
            {
              t: "New-licence digital-first insurers.",
              b: "A fresh wave of IRDAI grants — hungry for D2C distribution, no legacy agent network to defend.",
            },
          ].map((row, i) => (
            <div key={i} className="flex gap-5">
              <div className="font-serif italic font-medium text-xl md:text-2xl text-brand-plum tabular-nums w-10 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="font-serif font-medium text-xl md:text-2xl text-brand-charcoal mb-1">
                  {row.t}
                </div>
                <Body className="!text-base">{row.b}</Body>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 13 Market
  {
    render: () => (
      <div>
        <Kicker>The market</Kicker>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-14">
          {[
            {
              n: "$13B",
              l: "TAM",
              s: "Motor + Retail Health GWP in India",
              accent: false,
            },
            {
              n: "$3.5B",
              l: "SAM",
              s: "Private car + health renewals",
              accent: false,
            },
            {
              n: "$180M",
              l: "SOM · Year 5",
              s: "5% capture × 10% take rate",
              accent: true,
            },
          ].map((b) => (
            <div key={b.l}>
              <div
                className={clsx(
                  "font-serif font-medium text-6xl md:text-7xl lg:text-8xl tracking-[-0.025em] leading-none",
                  b.accent ? "italic text-brand-plum" : "text-brand-charcoal"
                )}
              >
                {b.n}
              </div>
              <div className="mt-3 font-mono text-[11px] tracking-[0.18em] uppercase text-brand-plum font-bold">
                · {b.l} ·
              </div>
              <div className="mt-2 font-serif text-sm md:text-base text-brand-slate leading-[1.5]">
                {b.s}
              </div>
            </div>
          ))}
        </div>
        <Body className="max-w-3xl">
          Motor growing <Sage>13% CAGR</Sage>. Retail health growing{" "}
          <Sage>20%+</Sage>. Combined ARR opportunity at scale:{" "}
          <Em>$25M+</Em>.
        </Body>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 14 Economics
  {
    render: () => (
      <div>
        <Kicker>The unit economics</Kicker>
        <Headline className="mb-10">
          10% commission. <Em>96%</Em> gross margin.
          <br />
          One revenue line.
        </Headline>
        <div className="border border-brand-charcoal/15 rounded-xl overflow-hidden">
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="bg-brand-plum/5">
                <th className="text-left p-4 font-mono text-[10.5px] tracking-[0.14em] uppercase font-semibold text-brand-charcoal/50">
                  &nbsp;
                </th>
                <th className="text-left p-4 font-serif font-semibold text-brand-charcoal">
                  RightOffer
                </th>
                <th className="text-left p-4 font-serif text-brand-slate">
                  PB Fintech / industry
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Commission take rate", "10% flat", "6–12% blended"],
                ["Cost per policy", "₹15–40", "₹400–800"],
                ["CAC", "₹200–400", "₹800–1,500"],
                ["LTV (3 renewals)", "₹4,200", "₹2,800"],
                ["Payback", "< 3 months", "9–12 months"],
              ].map((row, i) => (
                <tr key={i} className="border-t border-brand-charcoal/10">
                  <td className="p-4 font-serif text-brand-slate">{row[0]}</td>
                  <td className="p-4 font-serif font-semibold text-brand-charcoal">
                    {row[1]}
                  </td>
                  <td className="p-4 font-serif text-brand-slate/70">
                    {row[2]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 15 Competitive map
  {
    render: () => (
      <div>
        <Kicker>The category, mapped</Kicker>
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-8 gap-y-6 items-center max-w-4xl mb-12">
          <div></div>
          <div className="text-center font-mono text-[10.5px] tracking-[0.16em] uppercase text-brand-charcoal/40 font-semibold">
            · Price-first ·
          </div>
          <div className="text-center font-mono text-[10.5px] tracking-[0.16em] uppercase text-brand-charcoal/40 font-semibold">
            · Advice-first ·
          </div>

          <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-brand-charcoal/40 font-semibold whitespace-nowrap">
            · Agent-led ·
          </div>
          <div className="border border-brand-charcoal/15 rounded-xl p-6 md:p-8 text-center">
            <div className="font-serif font-semibold text-lg md:text-xl text-brand-charcoal">
              GIBL · Renewbuy
            </div>
          </div>
          <div className="border border-brand-charcoal/15 rounded-xl p-6 md:p-8 text-center">
            <div className="font-serif font-semibold text-lg md:text-xl text-brand-charcoal">
              Local agents
            </div>
            <div className="font-serif italic text-sm text-brand-slate mt-1">
              Family CA
            </div>
          </div>

          <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-brand-charcoal/40 font-semibold whitespace-nowrap">
            · Digital-first ·
          </div>
          <div className="border border-brand-charcoal/15 rounded-xl p-6 md:p-8 text-center">
            <div className="font-serif font-semibold text-lg md:text-xl text-brand-charcoal">
              PolicyBazaar
            </div>
            <div className="font-serif italic text-sm text-brand-slate mt-1">
              Acko
            </div>
          </div>
          <div className="rounded-xl p-6 md:p-8 text-center bg-brand-plum text-brand-offwhite">
            <Wordmark />
            <div className="font-serif italic font-medium text-base mt-2 text-brand-offwhite">
              Independent AI advisor + auction
            </div>
          </div>
        </div>
        <PullQuote>
          Empty quadrant. <Em>We are alone</Em> in the only quadrant that
          scales.
        </PullQuote>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 16 Distribution wedge
  {
    render: () => (
      <div>
        <Kicker>Launch with insurers who need us</Kicker>
        <Headline className="mb-10">
          IRDAI&rsquo;s last 24 months produced a fresh wave of{" "}
          <Em>digital-first insurer licences</Em>.
        </Headline>
        <ul className="space-y-4 font-serif text-lg md:text-xl text-brand-charcoal max-w-3xl">
          {[
            "Zero legacy agent network to defend.",
            "Need D2C distribution urgently.",
            "Will integrate via API on Day 1.",
            "Will share data and co-design product.",
            "Younger underwriting teams who see us as an ally, not a threat.",
          ].map((b) => (
            <li key={b} className="flex gap-3">
              <span className="text-brand-plum mt-1.5">·</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-charcoal/45 font-semibold max-w-3xl">
          · Three launch partners targeted from this cohort · BD in progress ·
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 17 Defensibility
  {
    render: () => (
      <div>
        <Kicker>Five moats</Kicker>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {[
            {
              t: "Data network effects",
              b: "Every parsed policy improves gap-detection. Every claim outcome retunes the recommendations.",
            },
            {
              t: "IRDAI composite broker licence",
              b: "₹75L net worth + 6–9 month process. Web-aggregator regs forbid our ranking logic. First-mover on activation date.",
            },
            {
              t: "Insurer API integrations",
              b: "Multi-month BD per partner. Once locked, switching cost is prohibitive. We own the spec.",
            },
            {
              t: "Editorial brand + Aryan voice",
              b: "Customers don't switch from a column they trust. The audit signature compounds across renewal cycles.",
            },
            {
              t: "Section 6 matching IP",
              b: "Hidden-from-customer routing intelligence. Insurers can't game what they can't see.",
            },
          ].map((m, i) => (
            <div key={m.t}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold mb-2">
                · Moat {String(i + 1).padStart(2, "0")} ·
              </div>
              <div className="font-serif font-medium text-xl md:text-2xl text-brand-charcoal mb-1">
                {m.t}
              </div>
              <Body className="!text-base !leading-[1.55]">{m.b}</Body>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 18 Traction
  {
    render: () => (
      <div>
        <Kicker>Built. Live.</Kicker>
        <div className="font-serif font-medium text-5xl md:text-7xl text-brand-charcoal tracking-tight mb-2">
          rightoffer.in
        </div>
        <div className="font-serif italic font-medium text-3xl md:text-5xl text-brand-plum mb-12">
          Audit live today. Marketplace ready, gated for V1.
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-10">
          {[
            {
              t: "Phase 1",
              s: "AI audit · multi-doc comparator · editorial PDF · all live on rightoffer.in",
            },
            {
              t: "End-to-end",
              s: "Parser → audit → bid → checkout → policy issuance — every step coded, gated by feature flag",
            },
            {
              t: "Durable infra",
              s: "QStash queue · Sentry monitoring · DPDP-compliant · 100% India residency on roadmap",
            },
            {
              t: "Founder-built",
              s: "Solo build, 8 weeks to live. ~₹4,000/month infra cost. Demo at demo.rightoffer.in.",
            },
          ].map((s) => (
            <div
              key={s.t}
              className="border border-brand-charcoal/15 rounded-xl p-5 bg-white"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-plum font-bold mb-2">
                · {s.t} ·
              </div>
              <Body className="!text-sm !leading-[1.5]">{s.s}</Body>
            </div>
          ))}
        </div>
        <Body className="max-w-3xl">
          Email-forward channel processed test forwards from{" "}
          <Sage>multiple senders</Sage> across <Sage>five+ insurer formats</Sage>{" "}
          including Audi, Honda, Hyundai, Maruti. Three new-licence insurer
          conversations in active BD.
        </Body>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 19 Team
  {
    render: () => (
      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-12">
        <div>
          <Kicker>The founder</Kicker>
          <div className="font-serif font-medium text-4xl md:text-5xl text-brand-charcoal leading-tight">
            Manish Chaudhari
          </div>
          <div className="mt-2 font-serif italic text-lg md:text-xl text-brand-plum">
            Founder &amp; CEO
          </div>
          <Body className="mt-6 max-w-xl !text-base">
            23 years across Indian financial services. Operating depth across{" "}
            <Em>risk, underwriting, process, product, and technology</Em>.
          </Body>
          <ul className="mt-6 space-y-3 font-serif text-sm md:text-base text-brand-charcoal max-w-xl">
            {[
              "President & Head of Retail Assets, Poonawalla Fincorp (2021-2024) — ₹30,000+ cr book, 1,000+ team",
              "Co-founded CoinTribe Technologies (2015-2020) — digital lending, full 5-year founder cycle",
              "VP & National Credit Head, Magma Fincorp (2012-2015) — direct adjacency to Magma HDI motor",
              "Earlier: Reliance Capital, GE Money, Standard Chartered, ICICI Bank, PNB Housing",
              "15K+ LinkedIn followers · deep insurer network across India",
            ].map((b) => (
              <li key={b} className="flex gap-3">
                <span className="text-brand-plum mt-1.5">·</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-l border-brand-charcoal/15 pl-8">
          <Kicker>Hiring next</Kicker>
          <div className="space-y-2.5 font-serif text-base font-medium text-brand-charcoal">
            <div>Founding CTO (AI/ML)</div>
            <div>Chief Experience Officer</div>
            <div>Chief Product Officer</div>
            <div>Head of Insurer Relationships</div>
            <div>Head of Growth</div>
          </div>
          <div className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-charcoal/45 font-medium max-w-xs">
            · Series-A bench by month 9 ·
          </div>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 20 Roadmap
  {
    render: () => (
      <div>
        <Kicker>24 months</Kicker>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-14">
          {[
            { w: "Now", e: "Phase 1 audit live · demos running" },
            {
              w: "Month 6",
              e: "IRDAI broker licence active · V1 marketplace switches on",
              accent: true,
            },
            { w: "Month 9", e: "Retail health launches" },
            { w: "Month 12", e: "5,000 paid policies/mo · motor + health" },
            { w: "Month 18", e: "Mobile app GA · WhatsApp live everywhere" },
            {
              w: "Month 24",
              e: "20,000 policies/mo · ₹200 cr GWP · Series A ready",
              accent: true,
            },
          ].map((m, i) => (
            <div key={i}>
              <div
                className={clsx(
                  "w-3 h-3 rounded-full mb-3",
                  m.accent ? "bg-brand-plum" : "bg-brand-charcoal/30"
                )}
              />
              <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase font-bold text-brand-plum mb-1">
                · {m.w} ·
              </div>
              <div className="font-serif text-sm md:text-base text-brand-charcoal leading-[1.5]">
                {m.e}
              </div>
            </div>
          ))}
        </div>
        <Body className="max-w-3xl">
          <Em>Phase 1 (now → month 6)</Em> — unregulated advisor mode. Build
          product, perfect AI, embed with insurers. Revenue switches ON when
          the broker licence activates at month 6.
        </Body>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 21 The ask
  {
    render: () => (
      <div>
        <Kicker>The ask</Kicker>
        <div className="font-serif font-medium text-[80px] md:text-[140px] tracking-[-0.025em] leading-[0.95] text-brand-charcoal">
          $7M <Em>—</Em> $10M
        </div>
        <Body className="mt-4 !text-lg max-w-2xl">
          Pre-seed + Seed, combined. Structurable as tranched commitment.
        </Body>
        <div className="mt-10">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold mb-4">
            · Use of funds ·
          </div>
          <div className="space-y-3 max-w-3xl">
            {[
              { l: "Tech + product (AI, mobile, WhatsApp)", p: 40 },
              { l: "Compliance + licence + insurer integrations", p: 20 },
              { l: "D2C acquisition (SEO, content, WhatsApp, PR)", p: 20 },
              { l: "Team (12-15 hires, no field sales)", p: 15 },
              { l: "Buffer", p: 5 },
            ].map((row) => (
              <div key={row.l} className="flex items-center gap-4">
                <div className="flex-1 font-serif text-sm md:text-base text-brand-charcoal">
                  {row.l}
                </div>
                <div className="w-32 md:w-44 h-1.5 bg-brand-charcoal/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-plum"
                    style={{ width: `${row.p * 2.5}%` }}
                  />
                </div>
                <div className="font-mono font-bold text-sm tabular-nums w-10 text-right text-brand-charcoal">
                  {row.p}%
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-charcoal/45 font-medium max-w-3xl">
          · Series A target · $25–35M at $120–180M post · Q2 2027 ·
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 22 Vision
  {
    render: () => (
      <div className="text-center">
        <Headline className="!text-5xl md:!text-7xl lg:!text-8xl !leading-[1.05]">
          Motor today.
          <br />
          Health <Em>in 90 days</Em>.
          <br />
          Every Indian household&rsquo;s
          <br />
          insurance, <Em>made simple</Em>.
        </Headline>
        <div className="mt-20 font-mono text-[10.5px] md:text-[11px] tracking-[0.18em] uppercase text-brand-charcoal/45 font-semibold">
          · Manish Chaudhari · hello@rightoffer.in ·
        </div>
      </div>
    ),
  },
];
