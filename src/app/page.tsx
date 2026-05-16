/**
 * Home page — Reading Room edition.
 *
 * An editorial newspaper-style landing page. Adapted from the Reading
 * Room brand mockup (downloads/home page_files/reading-motor.jsx),
 * trimmed down for the V1 marketing surface. Ten sections in order:
 *
 *    1. Brand row    · wordmark + centered Upload CTA + sign-in
 *    2. Headline     · "Understand your insurance before it costs you."
 *                      with subhead "Most people sell insurance. We
 *                      help you decide."
 *    3. Hero         · "We will read what you are driving with." +
 *                      IDV/NCB body + animated car + Review CTA
 *    4. § I How it works · 3 numbered steps with sketches
 *    5. § II Case study  · sample anonymised review card
 *    6. § III Three rules · principle statements
 *    7. Quote        · large italic blockquote
 *    8. Stats        · 4 big serif numbers
 *    9. CTA          · "Decide for yourself."
 *   10. Footer       · monospace uppercase legal row
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
      <V7Hero />
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
function V7Brand({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="relative py-6 flex items-center justify-between gap-4">
      {/* Wordmark on the left — italic serif "r" + small-caps RightOffer +
       *  sage CAR pill. */}
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

      {/* Centered Upload-policy CTA with the sign-in link beside it. The
       *  absolute-positioned wrapper keeps the CTA dead-centered regardless
       *  of the wordmark width on the left. A small static ink-line car
       *  sits inline between "Upload" and "policy" — same shape as the
       *  hero's animated car, but stripped of motion so it reads as an
       *  icon inside the button. */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-5">
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

      {/* Mobile fallback — on narrow screens the centered group is hidden;
       *  show a compact Upload CTA on the right edge so the page still has
       *  a single primary action. */}
      <LoadingLink
        href="/upload"
        className="md:hidden inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-3 py-1.5 rounded-full font-serif italic font-medium text-sm hover:opacity-90 transition-opacity"
      >
        Upload <span aria-hidden>→</span>
      </LoadingLink>
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
    <section className="pt-6 md:pt-8 pb-2 text-center">
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
    </section>
  );
}

/* ─── 3. Hero — sub-headline + body + CTA ───────────────────────────────── */
/* Compact centered section directly under the headline. The animated car
 * moved up between the two headline lines, so this block focuses on the
 * "what we check" promise and the primary CTA. Tight spacing on both
 * sides so the Review-my-car-policy pill lands above the fold. */
function V7Hero() {
  return (
    <section className="pt-4 md:pt-6 pb-10 md:pb-12 text-center border-b border-brand-charcoal/10">
      <h2 className="font-serif font-medium text-[32px] md:text-[44px] leading-[1.05] tracking-[-0.02em] text-balance text-brand-charcoal max-w-3xl mx-auto m-0">
        We read what you are{" "}
        <em className="italic text-brand-sage">driving</em> with.
      </h2>
      <p className="mt-3 font-serif text-[17px] md:text-[19px] leading-[1.55] text-brand-slate max-w-2xl mx-auto text-balance">
        IDV, NCB, Zero-Dep, engine cover, cashless networks — things that
        decide whether your claim gets paid in full or in fragments.
      </p>
      <div className="mt-6">
        <LoadingLink
          href="/upload"
          className="inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-7 py-4 rounded-full font-serif italic font-medium text-[18px] hover:opacity-90 transition-opacity"
        >
          Review my car policy <span aria-hidden>→</span>
        </LoadingLink>
      </div>
    </section>
  );
}

/* ─── 4. § I · How it works ─────────────────────────────────────────────── */
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
    <section className="pt-14 pb-6">
      <div className="flex items-baseline gap-4 mb-7 pb-4 border-b border-brand-charcoal/10">
        <span className="font-serif italic text-lg text-brand-slate">
          How a review works
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
          · · · · 03 STEPS · · · ·
        </span>
      </div>
      <div className="grid md:grid-cols-3 gap-10">
        {steps.map((s, i) => {
          const accentClass =
            i % 2 === 1 ? "text-brand-sage" : "text-brand-plum";
          const sketchAccent = i % 2 === 1 ? "var(--plum)" : "var(--sage)";
          return (
            <div key={s.n}>
              <div className="py-4 grid place-items-center bg-brand-surface mb-4 border-y border-brand-charcoal/10">
                <span className={accentClass}>
                  <s.Sketch
                    width={220}
                    color="currentColor"
                    accent={sketchAccent}
                  />
                </span>
              </div>
              <div
                className={`font-serif italic font-medium text-[28px] tracking-[-0.01em] ${accentClass}`}
              >
                {s.n}
              </div>
              <div className="font-serif font-semibold text-2xl leading-[1.15] tracking-[-0.015em] mt-1 mb-3 text-brand-charcoal">
                {s.title}
              </div>
              <p className="font-serif text-[15.5px] leading-[1.6] text-brand-slate text-balance m-0">
                {s.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── 5. § II · Case study ──────────────────────────────────────────────── */
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

/* ─── 6. § III · Three rules ────────────────────────────────────────────── */
function V7Rules() {
  const rules = [
    {
      n: "i.",
      title: "We don't take commission.",
      body: "Not a paisa. Not a kickback. Independence is the entire product — everything else is consequence.",
    },
    {
      n: "ii.",
      title: "We don't bury the answer.",
      body: "One screen. Plain English. Each finding cites the clause we read it from.",
    },
    {
      n: "iii.",
      title: "We don't pick up the phone.",
      body: "You'll never get a follow-up call. The verdict appears once; the decision stays yours.",
    },
  ];
  return (
    <section id="rules" className="pt-14 pb-8">
      <div className="flex items-baseline gap-4 mb-7 pb-4 border-b border-brand-charcoal/10">
        <span className="font-mono font-bold text-[10.5px] uppercase tracking-[0.18em] text-brand-sage">
          § III.
        </span>
        <span className="font-serif italic text-lg text-brand-slate">
          The three rules we keep
        </span>
      </div>
      <div className="grid md:grid-cols-3 gap-10">
        {rules.map((r, i) => {
          const accentClass =
            i === 1 ? "text-brand-sage" : "text-brand-plum";
          return (
            <div key={r.n}>
              <div
                className={`font-serif italic font-medium text-[32px] tracking-[-0.01em] mb-3.5 ${accentClass}`}
              >
                {r.n}
              </div>
              <div className="font-serif font-semibold text-[22px] leading-[1.18] tracking-[-0.015em] mb-3 text-brand-charcoal">
                {r.title}
              </div>
              <p className="font-serif text-[15.5px] leading-[1.6] text-brand-slate text-balance m-0">
                {r.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── 7. Quote ──────────────────────────────────────────────────────────── */
function V7Quote() {
  return (
    <section className="py-16 text-center">
      <blockquote className="m-0 mx-auto max-w-4xl font-serif italic font-normal text-3xl md:text-[54px] leading-[1.2] tracking-[-0.025em] text-balance text-brand-charcoal">
        <span
          className="text-brand-plum text-[76px] leading-[0.4] align-[-0.2em]"
          aria-hidden
        >
          “
        </span>
        I was about to auto-renew. The review showed my IDV was undervalued by{" "}
        <span className="italic text-brand-sage">₹2.4 lakh</span>. Switched to
        a properly-priced policy at the same premium.
        <span
          className="text-brand-plum text-[76px] leading-[0.4] align-[-0.55em]"
          aria-hidden
        >
          ”
        </span>
      </blockquote>
      <div className="mt-7 font-mono text-[11px] uppercase tracking-[0.16em] text-brand-slate">
        — Priya S. <span className="text-brand-plum">·</span> Bengaluru{" "}
        <span className="text-brand-plum">·</span> Sedan owner
      </div>
    </section>
  );
}

/* ─── 8. Stats ──────────────────────────────────────────────────────────── */
function V7Stats() {
  const stats: [string, string, "plum" | "sage"][] = [
    ["14,200", "policies reviewed", "plum"],
    ["₹1.8L", "avg gap uncovered", "sage"],
    ["96%", "would recommend", "plum"],
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

/* ─── 9. CTA ────────────────────────────────────────────────────────────── */
function V7CTA() {
  return (
    <section className="pt-20 pb-12 text-center relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-brand-plum">
        <SketchCar width={180} color="currentColor" />
      </div>
      <h3 className="mt-24 font-serif font-medium text-5xl md:text-7xl leading-[1.02] tracking-[-0.028em] text-balance text-brand-charcoal m-0">
        Decide for <em className="italic text-brand-sage">yourself.</em>
      </h3>
      <p className="mt-4 font-serif italic text-[17px] text-brand-slate max-w-md mx-auto">
        Free. No card. No sales calls. The verdict appears in your browser.
      </p>
      <LoadingLink
        href="/upload"
        className="mt-7 inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-7 py-4 rounded-full font-serif italic font-medium text-[19px] hover:opacity-90 transition-opacity"
      >
        Upload my motor policy <span aria-hidden>→</span>
      </LoadingLink>
    </section>
  );
}

/* ─── 10. Footer ────────────────────────────────────────────────────────── */
function V7Foot() {
  return (
    <footer className="py-5 mt-10 border-t border-brand-charcoal/10 flex flex-col md:flex-row gap-2 md:gap-0 items-start md:items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.12em] text-brand-slate">
      <span>© RIGHTOFFER 2026 · NOT AN INSURER · MADE FOR INDIA</span>
      <span className="flex gap-5">
        <a
          href="mailto:hello@rightoffer.in"
          className="hover:text-brand-charcoal transition-colors"
        >
          HELLO@RIGHTOFFER.IN
        </a>
        <span>PRIVACY</span>
        <span>TERMS</span>
      </span>
    </footer>
  );
}
