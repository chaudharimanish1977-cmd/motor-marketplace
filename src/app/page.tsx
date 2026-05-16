/**
 * Home page — Reading Room edition.
 *
 * An editorial newspaper-style landing page. Adapted from the Reading
 * Room brand mockup (downloads/home page_files/reading-motor.jsx),
 * trimmed for the V1 marketing surface. Nine sections in order:
 *
 *    1. Brand row    · wordmark + Upload CTA + sign-in (stacks on mobile)
 *    2. Headline     · "Understand your insurance before it costs you."
 *                      with subhead "Most people sell insurance. We
 *                      help you decide." and the primary "Review my car
 *                      policy" CTA below — all above the fold.
 *    3. How it works · 3 numbered steps with sketches + the IDV/NCB
 *                      "what we check" caption merged in
 *    4. Case study   · sample anonymised review card
 *    5. Three rules  · principle statements
 *    6. Quote        · 4-story testimonial carousel
 *    7. Stats        · 4 big serif numbers
 *    8. Final CTA    · "Decide for yourself."
 *    9. Footer       · monospace uppercase legal row (centred on mobile)
 *
 * BrandBlobs is intentionally absent — the Reading Room calls for a pure
 * white (light) / warm-near-black (dark) page surface. The SiteHeader
 * mounted globally from layout.tsx is replaced *visually* on this page
 * by section 1's brand row (the SiteHeader still renders for app routes).
 */
import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import {
  SketchCar,
  SketchCarStatic,
  SketchDoc,
  SketchLoupe,
  SketchSedan,
  SketchVerdict,
} from "@/components/sketches";
import { ReadingQuoteCarousel } from "@/components/reading-quote-carousel";
import { HeadlineCTA } from "@/components/headline-cta";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Detect whether the visitor has any kind of session (full magic-link or
  // narrow upload-session). Either flavour means we can offer a direct
  // "My policies" entry rather than the cold "Sign in" prompt.
  const [fullSessionEmail, uploadSession] = await Promise.all([
    getSession(),
    getUploadSession(),
  ]);
  const signedIn = !!(fullSessionEmail || uploadSession);

  return (
    <article className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-16">
      <V7Brand signedIn={signedIn} />
      <V7Headline />
      <V7HowItWorks />
      <V7CaseStudy />
      <V7Rules />
      <V7Quote />
      <V7Stats />
      <V7CTA />
      <V7Foot />
    </article>
  );
}

/* ─── 1. Brand row ──────────────────────────────────────────────────────── */
/* Responsive layout:
 *   - Mobile (<md): stacked. Row 1 = wordmark only (the fixed top-right
 *     theme toggle owns its corner). Row 2 = full-width Upload pill +
 *     Sign in link, centred. This avoids the collision between the old
 *     right-edge "Upload →" fallback and the theme toggle, and pushes
 *     the primary action above the headline where a thumb can reach it.
 *   - Desktop (md+): wordmark left, Upload + Sign in absolute-centred on
 *     the page so the CTA sits dead-centre regardless of wordmark width. */
function V7Brand({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="relative flex flex-col gap-3 py-4 md:py-6 md:flex-row md:items-center md:justify-between md:gap-4">
      {/* Wordmark — italic serif "r" + small-caps RightOffer + sage CAR pill. */}
      <Link
        href="/"
        aria-label="RightOffer Car — home"
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
      >
        <span
          className="font-serif italic font-semibold text-[22px] leading-none text-brand-plum"
          aria-hidden
        >
          r
        </span>
        <span
          className="font-serif font-medium text-lg leading-none text-brand-charcoal tracking-tight"
          style={{ fontVariant: "small-caps" }}
        >
          RightOffer
        </span>
        <span className="ml-2 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em] bg-brand-sage text-brand-offwhite rounded-sm">
          CAR
        </span>
      </Link>

      {/* Upload-policy CTA + sign-in link. On mobile this sits as a centred
       *  row directly below the wordmark; on desktop it's absolute-centred
       *  on the page so it lands dead-centre regardless of wordmark width. */}
      <div className="flex items-center justify-center gap-4 md:absolute md:left-1/2 md:-translate-x-1/2 md:gap-5">
        <LoadingLink
          href="/upload"
          className="inline-flex items-center gap-2 bg-brand-plum text-brand-offwhite px-5 py-2.5 rounded-full font-serif italic font-medium text-base hover:opacity-90 transition-opacity"
        >
          <span>Upload your</span>
          <SketchCarStatic
            width={44}
            className="align-middle"
            color="currentColor"
          />
          <span>policy</span>
          <span aria-hidden>→</span>
        </LoadingLink>
        <Link
          href="/me"
          className="font-serif italic text-[14px] text-brand-slate hover:text-brand-charcoal transition-colors"
        >
          {signedIn ? "My policies" : "Sign in"}
        </Link>
      </div>
    </header>
  );
}

/* ─── 2. Headline ───────────────────────────────────────────────────────── */
/* The animated ink-line car sits between the two lines of the headline as
 * a moment of visual breath — it's the only motion above the fold and
 * earns its place by replacing what would otherwise be empty vertical
 * space. Tight top padding so the headline starts close to the brand row
 * and the Hero CTA below stays within the first screen. */
function V7Headline() {
  return (
    <section className="pt-6 md:pt-8 pb-10 md:pb-12 text-center border-b border-brand-charcoal/10">
      <h1 className="font-serif font-medium text-5xl md:text-7xl lg:text-[88px] leading-[1] tracking-[-0.028em] max-w-5xl mx-auto text-brand-charcoal">
        <span className="block">Understand your</span>
        <span className="block py-2 md:py-3 text-brand-plum" aria-hidden>
          <span className="inline-flex justify-center">
            <SketchCar width={150} color="currentColor" />
          </span>
        </span>
        <span className="block italic text-brand-plum">
          insurance before it costs you.
        </span>
      </h1>
      <p className="mt-5 font-serif text-2xl md:text-3xl leading-[1.25] text-brand-slate max-w-3xl mx-auto text-balance">
        Most people sell insurance.{" "}
        <span className="italic text-brand-sage">We help you decide.</span>
      </p>
      {/* Above-the-fold CTA block — owns the profile chip pair, the
       *  primary "Get my free 2-minute review" pill, and the trust
       *  caption underneath. Client component because the chip state
       *  affects the CTA's href (we pass the priority through as a
       *  query param to /upload). */}
      <HeadlineCTA />
    </section>
  );
}

/* ─── 3. How it works ──────────────────────────────────────────────────── */
function V7HowItWorks() {
  const steps = [
    {
      n: "i.",
      title: "Upload the PDF.",
      body: "Drag in your motor policy. Anonymised by default; encrypted in transit; deletable in one click.",
      Sketch: SketchDoc,
    },
    {
      n: "ii.",
      title: "We read every clause.",
      body: "IDV, premium split, NCB, Zero-Dep, engine cover, RSA, cashless network, claim ratio. Each finding cites the clause we read it from.",
      Sketch: SketchLoupe,
    },
    {
      n: "iii.",
      title: "You get the verdict.",
      body: "One screen. Plain English. Renew, switch insurer, re-price IDV, or do nothing — whichever the document actually warrants.",
      Sketch: SketchVerdict,
    },
  ];
  return (
    <section className="pt-10 md:pt-14 pb-6">
      <div className="flex items-baseline gap-4 mb-4 md:mb-5 pb-3 md:pb-4 border-b border-brand-charcoal/10">
        <span className="font-serif italic text-base md:text-lg text-brand-slate">
          How a review works
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate hidden sm:inline">
          · · · · 03 STEPS · · · ·
        </span>
      </div>
      {/* Caption — the IDV/NCB "what we check" line absorbed from the old
       *  V7Hero. Sits between the section heading and the step grid as a
       *  one-line promise of what the review covers. */}
      <p className="font-serif italic text-[14.5px] md:text-base leading-[1.55] text-brand-slate max-w-3xl mb-7 md:mb-10 text-balance">
        We check the dozen things — declared value, depreciation cover, no-claim
        bonus, engine protection, cashless network — that decide whether your
        claim lands in full or in fragments.
      </p>
      <div className="grid md:grid-cols-3 gap-6 md:gap-10">
        {steps.map((s, i) => {
          const accentClass =
            i % 2 === 1 ? "text-brand-sage" : "text-brand-plum";
          const sketchAccent = i % 2 === 1 ? "var(--plum)" : "var(--sage)";
          return (
            <div key={s.n}>
              {/* Sketch tile — full-size surface block on desktop, hidden
               *  on mobile (a smaller inline sketch sits next to the step
               *  number instead, keeping each step compact). */}
              <div className="hidden md:grid py-4 place-items-center bg-brand-surface mb-4 border-y border-brand-charcoal/10">
                <span className={accentClass}>
                  <s.Sketch
                    width={220}
                    color="currentColor"
                    accent={sketchAccent}
                  />
                </span>
              </div>
              <div className="flex md:block items-start gap-4">
                <span className={`md:hidden flex-shrink-0 mt-1 ${accentClass}`}>
                  <s.Sketch
                    width={64}
                    color="currentColor"
                    accent={sketchAccent}
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-serif italic font-medium text-[22px] md:text-[28px] tracking-[-0.01em] leading-none ${accentClass}`}
                  >
                    {s.n}
                  </div>
                  <div className="font-serif font-semibold text-lg md:text-2xl leading-[1.15] tracking-[-0.015em] mt-1 mb-2 md:mb-3 text-brand-charcoal">
                    {s.title}
                  </div>
                  <p className="font-serif text-sm md:text-[15.5px] leading-[1.55] md:leading-[1.6] text-brand-slate text-balance m-0">
                    {s.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── 4. Case study ────────────────────────────────────────────────────── */
function V7CaseStudy() {
  const findings = [
    {
      k: "GAP",
      label: "IDV undervalued",
      detail: "₹6.4L declared · market ~₹8.8L",
      sev: "high" as const,
    },
    {
      k: "GAP",
      label: "No Zero-Dep cover",
      detail: "Standard for cars under 5 yrs old",
      sev: "high" as const,
    },
    {
      k: "OK",
      label: "Roadside assistance",
      detail: "Active until renewal",
      sev: "ok" as const,
    },
    {
      k: "WATCH",
      label: "NCB at 25%",
      detail: "Resets if you claim before Jan",
      sev: "mid" as const,
    },
    {
      k: "OK",
      label: "PA cover for owner",
      detail: "Mandatory · in place",
      sev: "ok" as const,
    },
  ];
  return (
    <section id="sample" className="pt-10 pb-6">
      <div className="relative bg-brand-surface px-7 py-10 md:px-11 md:py-11 border-l-4 border-brand-sage">
        <div className="absolute top-8 right-9 opacity-85 hidden md:block text-brand-sage">
          <SketchSedan width={260} color="currentColor" />
        </div>
        <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-3">
          CASE STUDY · ANONYMISED
        </div>
        <h3 className="font-serif font-medium text-3xl md:text-4xl tracking-[-0.02em] leading-[1.05] max-w-2xl m-0 mb-2 text-brand-charcoal">
          The audit took{" "}
          <em className="italic text-brand-plum">
            one minute, forty-seven seconds.
          </em>
        </h3>
        <p className="font-serif italic text-[15.5px] text-brand-slate mb-8 max-w-xl">
          One Bengaluru sedan owner. One uploaded PDF. One re-pricing
          recommendation worth ₹2.4 lakh of cover.
        </p>

        <div className="grid md:grid-cols-[1.1fr_1fr] gap-9 items-start">
          {/* Findings card */}
          <div className="p-5 bg-brand-offwhite border border-brand-charcoal/10 border-l-4 border-l-brand-plum">
            <div className="flex justify-between pb-3.5 border-b border-brand-charcoal/10 mb-3.5">
              <div>
                <div className="font-serif font-semibold text-[22px] tracking-[-0.01em] text-brand-charcoal">
                  Honda City · 2021
                </div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-slate mt-1">
                  BENGALURU · BAJAJ ALLIANZ · ₹12,840/YR
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-slate">
                  SCORE
                </div>
                <div className="font-serif font-semibold text-4xl text-brand-sage leading-[0.9] mt-0.5">
                  62
                  <span className="text-brand-slate text-sm italic font-normal">
                    /100
                  </span>
                </div>
              </div>
            </div>
            <div className="grid gap-1.5">
              {findings.map((f, i) => {
                const cm =
                  f.sev === "high"
                    ? "text-brand-sage"
                    : f.sev === "mid"
                      ? "text-brand-slate"
                      : "text-brand-plum";
                return (
                  <div
                    key={f.label}
                    className={`grid grid-cols-[64px_1fr] gap-3 items-baseline py-1.5 ${
                      i < findings.length - 1
                        ? "border-b border-dotted border-brand-charcoal/10"
                        : ""
                    }`}
                  >
                    <span
                      className={`font-mono font-bold text-[9.5px] tracking-[0.12em] ${cm}`}
                    >
                      {f.k}
                    </span>
                    <span>
                      <span className="font-serif font-semibold text-sm text-brand-charcoal">
                        {f.label}.
                      </span>{" "}
                      <span className="font-serif italic text-[13.5px] text-brand-slate">
                        {f.detail}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verdict */}
          <div>
            <div className="font-serif font-medium text-[24px] md:text-[26px] leading-[1.2] tracking-[-0.015em] text-brand-charcoal">
              The recommendation:{" "}
              <span className="italic text-brand-plum">
                re-price the IDV by ₹2.4 lakh and add Zero-Dep cover before
                renewal.
              </span>
            </div>
            <p className="mt-4 font-serif text-[15.5px] leading-[1.6] text-brand-slate text-balance">
              The owner kept the same insurer. The same premium. She walked
              away with ₹2.4 lakh more cover than she would have had on
              auto-renewal — purely from reading a document she&apos;d never
              have read herself.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 5. Three rules ───────────────────────────────────────────────────── */
function V7Rules() {
  const rules = [
    {
      n: "i.",
      title: "We don't push insurance.",
      body: "We curate what's best for you and earn only when you buy that. We'd rather you didn't buy than buy the wrong cover. The product is the curation; the commission is downstream of it.",
    },
    {
      n: "ii.",
      title: "We don't bury the answer.",
      body: "One screen. Plain English. Each finding cites the clause we read it from.",
    },
    {
      n: "iii.",
      title: "We don't chase you down.",
      body: "You'll never get a “just calling to follow up on your renewal”. The verdict appears once; the decision stays with the user.",
    },
  ];
  return (
    <section id="rules" className="pt-10 md:pt-14 pb-8">
      <div className="flex items-baseline gap-4 mb-5 md:mb-7 pb-3 md:pb-4 border-b border-brand-charcoal/10">
        <span className="font-serif italic text-base md:text-lg text-brand-slate">
          The three rules we keep
        </span>
      </div>
      {/* Mobile: tighter row layout per rule. The italic number and the
       *  title sit on one line (number is smaller), with the explanatory
       *  body wrapping below. Desktop: 3-column grid as before. */}
      <div className="grid md:grid-cols-3 gap-7 md:gap-10">
        {rules.map((r, i) => {
          const accentClass =
            i === 1 ? "text-brand-sage" : "text-brand-plum";
          return (
            <div key={r.n}>
              <div className="flex md:block items-baseline gap-2 md:gap-0">
                <div
                  className={`font-serif italic font-medium text-2xl md:text-[32px] tracking-[-0.01em] mb-0 md:mb-3.5 ${accentClass}`}
                >
                  {r.n}
                </div>
                <div className="font-serif font-semibold text-lg md:text-[22px] leading-[1.2] md:leading-[1.18] tracking-[-0.015em] mb-0 md:mb-3 text-brand-charcoal">
                  {r.title}
                </div>
              </div>
              <p className="mt-2 md:mt-0 font-serif text-sm md:text-[15.5px] leading-[1.55] md:leading-[1.6] text-brand-slate text-balance m-0">
                {r.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── 6. Quote — 4-story carousel ───────────────────────────────────────── */
function V7Quote() {
  return (
    <section className="py-16 text-center">
      <ReadingQuoteCarousel />
    </section>
  );
}

/* ─── 7. Stats ──────────────────────────────────────────────────────────── */
function V7Stats() {
  const stats: [string, string, "plum" | "sage"][] = [
    ["1,000+", "policies reviewed", "plum"],
    ["₹1.8L", "avg gap uncovered", "sage"],
    ["89%", "would recommend", "plum"],
    ["0", "sales calls placed", "sage"],
  ];
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 py-10 border-y border-brand-charcoal/10 bg-brand-surface">
      {stats.map(([k, v, col], i) => (
        <div
          key={k}
          className={`px-5 md:px-7 ${
            i < stats.length - 1
              ? "md:border-r border-brand-charcoal/10"
              : ""
          }`}
        >
          <div
            className={`font-serif font-medium text-[44px] md:text-[68px] tracking-[-0.03em] leading-[0.9] ${
              col === "plum" ? "text-brand-plum" : "text-brand-sage"
            }`}
          >
            {k}
          </div>
          <div className="mt-3 font-serif italic text-sm text-brand-slate">
            {v}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ─── 8. Final CTA ──────────────────────────────────────────────────────── */
function V7CTA() {
  return (
    <section className="pt-20 pb-12 text-center relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-brand-plum">
        <SketchCar width={180} color="currentColor" />
      </div>
      <h3 className="mt-24 font-serif font-medium text-5xl md:text-7xl leading-[1.02] tracking-[-0.028em] text-balance text-brand-charcoal m-0">
        Decide for <em className="italic text-brand-sage">yourself.</em>
      </h3>
      <p className="mt-4 font-serif italic text-[17px] text-brand-slate max-w-xl mx-auto">
        Free. No card. No sales calls.
        <br />
        The verdict appears in your browser, mail box, and WhatsApp.
      </p>
      <LoadingLink
        href="/upload"
        className="mt-7 inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-7 py-4 rounded-full font-serif italic font-medium text-[19px] hover:opacity-90 transition-opacity"
      >
        Upload my car policy <span aria-hidden>→</span>
      </LoadingLink>
    </section>
  );
}

/* ─── 9. Footer ─────────────────────────────────────────────────────────── */
function V7Foot() {
  // Self-healing copyright year — pre-launch we want the brand to read as
  // contemporary regardless of the month a visitor arrives in.
  const year = new Date().getFullYear();
  return (
    <footer className="py-5 mt-10 border-t border-brand-charcoal/10 flex flex-col md:flex-row gap-3 md:gap-0 items-center md:items-center justify-center md:justify-between text-center md:text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-brand-slate">
      <span className="flex flex-wrap items-center justify-center gap-3 md:gap-5">
        <span>© RIGHTOFFER {year} · MADE FOR INDIA</span>
        {/* Language pill — V1 placeholder. Hindi is currently the only
         *  second-language we surface; more (Telugu, Tamil, Marathi, Bengali)
         *  will follow once the localisation pipeline is wired. Non-functional
         *  for now but signals intent for semi-urban + rural penetration. */}
        <span className="inline-flex items-center gap-1.5 border border-brand-charcoal/15 rounded-full px-2 py-0.5 normal-case tracking-normal">
          <span className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-brand-charcoal">
            EN
          </span>
          <span className="text-brand-charcoal/30" aria-hidden>
            ·
          </span>
          <span className="font-serif text-[12px] text-brand-slate">
            हिंदी
          </span>
        </span>
      </span>
      <span className="flex flex-wrap justify-center gap-5">
        <a
          href="mailto:hello@rightoffer.in"
          className="hover:text-brand-charcoal transition-colors"
        >
          HELLO@RIGHTOFFER.IN
        </a>
        <Link
          href="/sample-review"
          className="hover:text-brand-charcoal transition-colors"
        >
          SAMPLE
        </Link>
        <Link
          href="/privacy"
          className="hover:text-brand-charcoal transition-colors"
        >
          PRIVACY
        </Link>
        <Link
          href="/terms"
          className="hover:text-brand-charcoal transition-colors"
        >
          TERMS
        </Link>
      </span>
    </footer>
  );
}
