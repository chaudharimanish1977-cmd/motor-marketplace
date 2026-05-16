/**
 * Home page — Reading Room edition.
 *
 * An editorial newspaper-style landing page. Direct adaptation of the
 * Reading Room brand mockup (downloads/home page_files/reading-motor.jsx)
 * to Next.js/Tailwind. Twelve sections in order:
 *
 *    1. Brand row    · wordmark + nav + plum CTA
 *    2. Issue masthead · letter number, date, byline (mono uppercase)
 *    3. Headline      · "Most insurance is sold. We thought it should be read."
 *    4. Lead          · drop cap "I" + 3-column with margin annotations
 *    5. Hero          · desk sketch + "Read what you'll drive away with."
 *    6. § I How it works · 3 numbered steps with sketches
 *    7. § II Case study  · sample anonymised review card
 *    8. § III Three rules · principle statements
 *    9. Quote         · large italic blockquote
 *   10. Stats         · 4 big serif numbers
 *   11. CTA           · "Decide for yourself."
 *   12. Footer        · monospace uppercase legal row
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
  SketchDesk,
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
      <V7Lead />
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
       *  sage MOTOR pill. */}
      <Link
        href="/"
        aria-label="RightOffer Motor — home"
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
          MOTOR
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
function V7Headline() {
  return (
    <section className="pt-20 pb-6 text-center">
      <h1 className="font-serif font-medium text-5xl md:text-7xl lg:text-[92px] leading-[1] tracking-[-0.028em] max-w-5xl mx-auto text-balance text-brand-charcoal">
        Most insurance is{" "}
        <span className="italic text-brand-plum">sold.</span>
        <br />
        We thought it should be{" "}
        <span className="italic text-brand-sage">read.</span>
      </h1>
    </section>
  );
}

/* ─── 4. Lead — drop cap + margin annotations ───────────────────────────── */
function V7Lead() {
  return (
    <section className="pb-8 grid md:grid-cols-[1fr_minmax(0,660px)_1fr] gap-6">
      {/* Left margin — footnote */}
      <aside className="hidden md:block text-right pt-3 font-mono text-[10.5px] uppercase tracking-[0.1em] leading-relaxed text-brand-plum">
        ¹ The average motor
        <br />
        policy document
        <br />
        runs 28 pages —
        <br />
        almost none of them
        <br />
        for the owner.
      </aside>

      {/* Lead body with drop cap */}
      <div>
        <p className="font-serif text-[20px] md:text-[22px] leading-[1.55] tracking-[-0.005em] text-balance text-brand-charcoal m-0">
          <span
            className="font-serif italic font-bold text-[80px] leading-[0.85] text-brand-sage float-left mr-3 mt-1.5"
            aria-hidden
          >
            I
          </span>
          n India, you can pay a phone bill, file taxes, and move a lakh
          between banks before your second cup of chai. But when it comes to
          motor insurance — the most consequential decision you make for your
          vehicle each year — you&apos;re still expected to read a 28-page
          document, written by a lawyer, designed for the seller.
          <sup className="text-brand-sage">1</sup>
        </p>
        <p className="mt-6 font-serif text-[18px] md:text-[19px] leading-[1.6] tracking-[-0.005em] text-brand-slate text-balance">
          We built a tool that reads it for you. In under two minutes. For
          free. We don&apos;t earn from insurers, we don&apos;t take
          commission, and we don&apos;t pick up the phone. The product is
          independence; everything else is consequence.
        </p>
      </div>

      {/* Right margin — reading time */}
      <aside className="hidden md:block pt-3 font-mono text-[10.5px] uppercase tracking-[0.1em] leading-relaxed text-brand-slate">
        <span className="font-bold text-brand-plum">Reading time</span>
        <br />
        2 minutes.
        <br />
        About as long
        <br />
        as one Reel —
        <br />
        but for your
        <br />
        bank balance.
      </aside>
    </section>
  );
}

/* ─── 5. Hero — desk sketch + headline + CTA ────────────────────────────── */
function V7Hero() {
  return (
    <section className="py-8 md:py-14 border-b border-brand-charcoal/10">
      <div className="grid md:grid-cols-[1.05fr_1fr] gap-10 md:gap-14 items-center">
        <div className="relative">
          <SketchDesk width={520} color="currentColor" accent="currentColor" />
          <div className="mt-2.5 font-serif italic text-[13.5px] text-brand-slate">
            ↑ The page you&apos;re reading, in object form.
          </div>
        </div>
        <div>
          <h2 className="font-serif font-medium text-[44px] md:text-[60px] leading-[1] tracking-[-0.025em] text-balance text-brand-charcoal m-0">
            Read what you&apos;ll{" "}
            <em className="italic text-brand-sage">drive away</em> with.
          </h2>
          <p className="mt-4 font-serif text-[17px] leading-[1.6] text-brand-slate max-w-md text-balance">
            IDV, NCB, Zero-Dep, engine cover, cashless networks — we check the
            twelve things that decide whether your claim gets paid in full or
            in fragments.
          </p>
          <div className="mt-6 flex items-end justify-between gap-6">
            <LoadingLink
              href="/upload"
              className="inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-6 py-3.5 rounded-full font-serif italic font-medium text-[17px] hover:opacity-90 transition-opacity"
            >
              Review my motor policy <span aria-hidden>→</span>
            </LoadingLink>
            <div className="hidden sm:block text-brand-plum">
              <SketchCar width={220} color="currentColor" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 6. § I · How it works ─────────────────────────────────────────────── */
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
        <span className="font-mono font-bold text-[10.5px] uppercase tracking-[0.18em] text-brand-sage">
          § I.
        </span>
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

/* ─── 7. § II · Case study ──────────────────────────────────────────────── */
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
          § II · CASE STUDY · ANONYMISED
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
            <div className="mt-5 py-2.5 border-y border-brand-charcoal/10 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate flex justify-between">
              <span>REPORT №RO-4471</span>
              <span className="text-brand-plum">· 1m 47s ·</span>
              <span>W/ CONSENT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 8. § III · Three rules ────────────────────────────────────────────── */
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

/* ─── 9. Quote ──────────────────────────────────────────────────────────── */
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

/* ─── 10. Stats ─────────────────────────────────────────────────────────── */
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

/* ─── 11. CTA ───────────────────────────────────────────────────────────── */
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

/* ─── 12. Footer ────────────────────────────────────────────────────────── */
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
