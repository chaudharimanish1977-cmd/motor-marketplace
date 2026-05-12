"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";

/**
 * RightOffer investor pitch deck. 17 slides, 16:9, designed for the
 * 2-minute spoken script. Pure black background, Inter typography, orange
 * accents only on the lines that matter.
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
 * exports a clean 17-page document.
 */
export function PitchDeck() {
  const slides = SLIDES;
  const [idx, setIdx] = useState(0);
  const [printMode, setPrintMode] = useState(false);

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

  if (printMode) {
    return (
      <div className="bg-black text-white font-sans">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="aspect-[16/9] w-full max-w-screen-2xl mx-auto border-b border-white/10 print:border-0 print:break-after-page"
          >
            <SlideShell idx={i} total={slides.length}>
              {slide.render()}
            </SlideShell>
          </div>
        ))}
        <button
          onClick={() => setPrintMode(false)}
          className="fixed top-4 right-4 z-50 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold tracking-wider uppercase print:hidden"
        >
          Exit print mode (P)
        </button>
      </div>
    );
  }

  const slide = slides[idx];

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden">
      {/* Single slide, vertically + horizontally centered */}
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
                ? "w-8 bg-white"
                : i < idx
                  ? "w-2 bg-white/40 hover:bg-white/60"
                  : "w-2 bg-white/15 hover:bg-white/30"
            )}
          />
        ))}
      </div>

      {/* Nav buttons (invisible click zones on left/right edges) */}
      <button
        onClick={() => go(idx - 1)}
        aria-label="Previous"
        className="absolute left-0 top-0 bottom-0 w-1/4 cursor-w-resize z-30 focus:outline-none"
      />
      <button
        onClick={() => go(idx + 1)}
        aria-label="Next"
        className="absolute right-0 top-0 bottom-0 w-1/4 cursor-e-resize z-30 focus:outline-none"
      />

      {/* Hint, fades after a few seconds via CSS */}
      <div className="absolute bottom-6 right-8 text-[10px] text-white/30 font-medium tracking-wider uppercase z-40 animate-fade-out-slow">
        ← → · space · F · P
      </div>
    </div>
  );
}

// ============================================================================
// Slide shell — common chrome (footer brand + page number)
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
        <div className="absolute top-8 left-12 text-[11px] tracking-[0.15em] uppercase text-white/30 font-semibold">
          RightOffer
        </div>
      )}
      <div className="absolute bottom-8 left-12 text-[11px] tracking-[0.15em] uppercase text-white/30 font-semibold">
        rightoffer.in
      </div>
      <div className="absolute bottom-8 right-12 text-[11px] tracking-[0.15em] uppercase text-white/30 font-semibold tabular-nums">
        {String(idx + 1).padStart(2, "0")} <span className="text-white/15">/ {String(total).padStart(2, "0")}</span>
      </div>
      <div className="w-full max-w-6xl">{children}</div>
    </div>
  );
}

// ============================================================================
// Helper components — keep slide markup readable
// ============================================================================

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] md:text-xs font-bold tracking-[0.18em] uppercase text-white/40 mb-6">
      {children}
    </div>
  );
}

function HugeNumber({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={clsx(
        "font-extrabold leading-[0.9] text-[120px] md:text-[180px] lg:text-[220px] tracking-tight",
        accent ? "text-[#FF6B35]" : "text-white"
      )}
    >
      {children}
    </div>
  );
}

function Body({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={clsx("text-white/60 text-lg md:text-xl leading-relaxed font-normal", className)}>
      {children}
    </p>
  );
}

function Headline({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1 className={clsx("text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight", className)}>
      {children}
    </h1>
  );
}

function Accent({ children }: { children: ReactNode }) {
  return <span className="text-[#FF6B35]">{children}</span>;
}

function Gold({ children }: { children: ReactNode }) {
  return <span className="text-[#FFD54F]">{children}</span>;
}

// ============================================================================
// THE SLIDES
// ============================================================================

interface Slide {
  render: () => ReactNode;
}

const SLIDES: Slide[] = [
  // ─────────────────────────────────────────────────── 01 Cover
  {
    render: () => (
      <div className="text-center">
        <div className="font-extrabold text-7xl md:text-9xl tracking-tight leading-none mb-6">
          RightOffer
        </div>
        <div className="text-xl md:text-2xl text-white/70 font-normal max-w-2xl mx-auto">
          Insurance, the way{" "}
          <span className="text-white font-semibold">WhatsApp</span> does conversation.
        </div>
        <div className="mt-32 inline-flex flex-col items-center gap-1 text-[11px] tracking-[0.15em] uppercase text-white/40 font-semibold">
          <div>Pre-seed + Seed · $7 — 10M</div>
          <div>Manish Chaudhari · Founder &amp; CEO</div>
          <div>2025</div>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 02 The hook
  {
    render: () => (
      <div>
        <HugeNumber accent>35 million</HugeNumber>
        <div className="mt-8 text-2xl md:text-3xl font-medium text-white">
          Indians renew their car insurance every year.
        </div>
        <div className="mt-8 space-y-1.5 text-white/60 text-base md:text-lg max-w-2xl">
          <div>80% don&apos;t read their policy.</div>
          <div>60% are missing protection.</div>
          <div>
            <Accent>₹85,000</Accent> average claim-time shortfall.
          </div>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 03 The regret
  {
    render: () => (
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
          The most expensive
          <br />
          financial decision Indians
          <br />
          make in <Accent>5 minutes</Accent>.
        </h1>
        <div className="mt-10 text-xl md:text-2xl text-white/50 font-medium">
          And then live with for 5 years.
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 04 Three misalignments
  {
    render: () => (
      <div>
        <Eyebrow>Why this product exists</Eyebrow>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
          {[
            {
              title: "Customer",
              body: "Doesn't read the 15-page policy. Discovers the gap at claim time.",
            },
            {
              title: "Insurer",
              body: "Competes only on premium. Race to bottom → claim disputes → brand damage.",
            },
            {
              title: "Aggregator",
              body: "Sorts only on price. Commodifies the category.",
            },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-2xl md:text-3xl font-extrabold mb-3">{col.title}</div>
              <Body className="!text-base !leading-relaxed">{col.body}</Body>
            </div>
          ))}
        </div>
        <div className="mt-16 text-lg md:text-xl text-white/80 max-w-3xl">
          The market has been waiting for one player. An{" "}
          <Accent>independent AI advisor</Accent> that reads YOUR policy and curates offers around YOUR profile.
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 05 The product
  {
    render: () => (
      <div>
        <Eyebrow>Three layers, one product</Eyebrow>
        <div className="space-y-10">
          {[
            {
              h: "AI Parser",
              b: "Reads any Indian motor policy in 90 seconds. Works across 25+ insurer formats.",
            },
            {
              h: "Coverage Score + Money-at-Risk",
              b: "Translates every gap into rupees. “₹85,000 out of pocket if claim happens today” — the emotional trigger that converts.",
            },
            {
              h: "Multi-tier Reverse Auction",
              b: "Insurers compete in tiers anchored to the customer's selection, not the cheapest header.",
            },
          ].map((row) => (
            <div key={row.h}>
              <div className="text-3xl md:text-4xl font-extrabold mb-2">{row.h}</div>
              <Body>{row.b}</Body>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 06 WhatsApp moment
  {
    render: () => (
      <div>
        <Headline>
          Insurance, the way
          <br />
          <Accent>WhatsApp</Accent> does conversation.
        </Headline>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { n: "01", t: "Send", s: "policy PDF on WhatsApp." },
            { n: "02", t: "AI reads", s: "in 90 seconds." },
            { n: "03", t: "Pick", s: "from 2–4 offers." },
            { n: "04", t: "Buy", s: "policy PDF back on chat." },
          ].map((step) => (
            <div
              key={step.n}
              className="border border-white/15 rounded-2xl p-6"
            >
              <div className="text-xs font-bold tracking-[0.15em] uppercase text-[#FF6B35] mb-2">
                {step.n}
              </div>
              <div className="text-2xl font-extrabold mb-1">{step.t}</div>
              <div className="text-sm text-white/50 leading-relaxed">{step.s}</div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-lg md:text-xl text-white/70 max-w-3xl">
          No app. No login. No agent. No 15-screen funnel.{" "}
          <span className="text-white font-semibold">
            The simplest insurance product India has seen.
          </span>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 07 Why now
  {
    render: () => (
      <div>
        <Eyebrow>Why now</Eyebrow>
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
              b: "$5 → $0.05 per policy in 36 months. Free, instant policy review is finally viable.",
            },
            {
              t: "Digital readiness is universal.",
              b: "87% of car buyers research insurance online. UPI, Aadhaar, DigiLocker, WhatsApp Business — all production-ready.",
            },
            {
              t: "New-licence digital-first insurers.",
              b: "A fresh wave of IRDAI grants — hungry for D2C distribution, no legacy agent network to defend.",
            },
          ].map((row, i) => (
            <div key={i} className="flex gap-5">
              <div className="text-xl md:text-2xl font-extrabold text-[#FF6B35] tabular-nums w-8 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="text-xl md:text-2xl font-extrabold mb-1">{row.t}</div>
                <Body className="!text-base">{row.b}</Body>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 08 Market
  {
    render: () => (
      <div>
        <Eyebrow>The market</Eyebrow>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { n: "$13B", l: "TAM", s: "Motor + Retail Health GWP in India", accent: false },
            { n: "$3.5B", l: "SAM", s: "Private car + health renewals", accent: false },
            { n: "$180M", l: "SOM · Year 5", s: "5% capture × 10% take rate", accent: true },
          ].map((b) => (
            <div key={b.l}>
              <div
                className={clsx(
                  "font-extrabold text-7xl md:text-8xl tracking-tight leading-none",
                  b.accent ? "text-[#FF6B35]" : "text-white"
                )}
              >
                {b.n}
              </div>
              <div className="mt-3 text-xs font-bold tracking-[0.15em] uppercase text-white/40">
                {b.l}
              </div>
              <div className="mt-2 text-sm text-white/60 leading-relaxed">{b.s}</div>
            </div>
          ))}
        </div>
        <div className="mt-16 text-sm md:text-base text-white/50 max-w-3xl">
          Motor growing 13% CAGR. Retail health growing 20%+. Combined ARR opportunity at scale:{" "}
          <span className="text-white font-semibold">$25M+</span>.
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 09 Economics
  {
    render: () => (
      <div>
        <Headline>
          10% commission. <Accent>96%</Accent> gross margin.
          <br />
          One revenue line.
        </Headline>
        <div className="mt-16 border border-white/15 rounded-2xl overflow-hidden">
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="bg-white/5">
                <th className="text-left p-4 md:p-5 font-semibold text-white/40 text-xs md:text-sm tracking-wider uppercase">&nbsp;</th>
                <th className="text-left p-4 md:p-5 font-bold text-white text-base md:text-lg">RightOffer</th>
                <th className="text-left p-4 md:p-5 font-semibold text-white/50 text-base md:text-lg">PB Fintech / industry</th>
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
                <tr
                  key={i}
                  className="border-t border-white/10"
                >
                  <td className="p-4 md:p-5 text-white/60">{row[0]}</td>
                  <td className="p-4 md:p-5 font-bold text-white">{row[1]}</td>
                  <td className="p-4 md:p-5 text-white/40">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 10 Competitive map
  {
    render: () => (
      <div>
        <Eyebrow>Competitive landscape</Eyebrow>
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-8 gap-y-6 items-center max-w-4xl">
          <div></div>
          <div className="text-center text-xs font-bold tracking-[0.15em] uppercase text-white/40">
            Price-first
          </div>
          <div className="text-center text-xs font-bold tracking-[0.15em] uppercase text-white/40">
            Advice-first
          </div>

          <div className="text-xs font-bold tracking-[0.15em] uppercase text-white/40 -rotate-90 md:rotate-0 whitespace-nowrap">
            Agent-led
          </div>
          <div className="border border-white/15 rounded-xl p-6 md:p-8 text-center">
            <div className="text-lg md:text-xl font-bold">GIBL · Renewbuy</div>
          </div>
          <div className="border border-white/15 rounded-xl p-6 md:p-8 text-center">
            <div className="text-lg md:text-xl font-bold">Local agents</div>
            <div className="text-sm text-white/40 mt-1">Family CA</div>
          </div>

          <div className="text-xs font-bold tracking-[0.15em] uppercase text-white/40 -rotate-90 md:rotate-0 whitespace-nowrap">
            Digital-first
          </div>
          <div className="border border-white/15 rounded-xl p-6 md:p-8 text-center">
            <div className="text-lg md:text-xl font-bold">Policy Bazaar</div>
            <div className="text-sm text-white/40 mt-1">Acko</div>
          </div>
          <div className="rounded-xl p-6 md:p-8 text-center bg-[#FF6B35] text-black">
            <div className="text-xl md:text-2xl font-extrabold">RightOffer</div>
            <div className="text-sm font-semibold mt-1">Independent AI advisor</div>
          </div>
        </div>
        <div className="mt-12 text-lg md:text-xl text-white/70 max-w-3xl">
          <span className="text-white font-semibold">
            Empty quadrant. We are alone in the only quadrant that scales.
          </span>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 11 Distribution wedge
  {
    render: () => (
      <div>
        <Headline>
          We launch with the insurers
          <br />
          who <Accent>need us most</Accent>.
        </Headline>
        <div className="mt-12 text-lg md:text-xl text-white/60 max-w-3xl leading-relaxed">
          IRDAI&apos;s last 24 months have produced a fresh wave of{" "}
          <span className="text-white font-semibold">digital-first insurer licences</span>. These insurers:
        </div>
        <ul className="mt-8 space-y-3 text-base md:text-lg text-white/80 max-w-3xl">
          {[
            "Have zero legacy agent network to defend.",
            "Need D2C distribution urgently.",
            "Will integrate via API on Day 1.",
            "Will share data and co-design product.",
            "Have younger underwriting teams who view us as an ally.",
          ].map((b) => (
            <li key={b} className="flex gap-3">
              <span className="text-[#FF6B35] mt-0.5">·</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-12 text-sm md:text-base text-white/40 max-w-3xl">
          Three launch partners targeted from this cohort. Conversations in motion.
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 12 Defensibility
  {
    render: () => (
      <div>
        <Eyebrow>Five moats</Eyebrow>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {[
            {
              t: "Data network effects",
              b: "Every parsed policy improves our gap-detection model.",
            },
            {
              t: "IRDAI Direct Broker licence",
              b: "₹75L net worth + 6-9 month process. First-mover advantage on activation date.",
            },
            {
              t: "Insurer API integrations",
              b: "Multi-month BD per partner. Once locked, switching cost is prohibitive.",
            },
            {
              t: "AI advisor IP",
              b: "Tier-composition logic, claim-cost simulator, gap-detection. Proprietary.",
            },
            {
              t: "WhatsApp channel ownership",
              b: "Once a customer has 2 years of renewal-cadence conversation history with our number, no competitor rebuilds that trust quickly.",
            },
          ].map((m, i) => (
            <div key={m.t}>
              <div className="text-xs font-bold tracking-[0.15em] uppercase text-[#FF6B35] mb-2">
                Moat {String(i + 1).padStart(2, "0")}
              </div>
              <div className="text-xl md:text-2xl font-extrabold mb-1">{m.t}</div>
              <Body className="!text-base">{m.b}</Body>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 13 Traction
  {
    render: () => (
      <div>
        <Eyebrow>
          <Gold>We&apos;re not pre-product</Gold>
        </Eyebrow>
        <div className="font-extrabold text-6xl md:text-8xl tracking-tight">
          rightoffer.in
        </div>
        <div className="mt-1 text-3xl md:text-5xl font-extrabold tracking-tight">
          <Accent>Live.</Accent>
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            { t: "V1 product", s: "Full customer flow end-to-end: parser → report → auction → checkout" },
            { t: "25+", s: "Real Indian motor policies parsed across 10+ insurer formats" },
            { t: "3", s: "New-licence insurer conversations in active BD" },
            { t: "D2C", s: "Pure software, 96% gross margin, self-serve, zero agents" },
          ].map((s) => (
            <div key={s.t} className="border border-white/15 rounded-xl p-5">
              <div className="text-xl md:text-2xl font-extrabold mb-2">{s.t}</div>
              <div className="text-xs md:text-sm text-white/50 leading-relaxed">{s.s}</div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-sm md:text-base text-white/40">
          Built in 8 weeks. ₹4,000/month total infra cost. Demo at rightoffer.in/investor.
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 14 Team
  {
    render: () => (
      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-12">
        <div>
          <div className="text-4xl md:text-5xl font-extrabold leading-tight">
            Manish Chaudhari
          </div>
          <div className="mt-1 text-lg md:text-xl text-white/50 font-medium">
            Founder &amp; CEO
          </div>
          <Body className="mt-6 !text-base max-w-xl">
            23 years across Indian financial services. Operating depth across{" "}
            <span className="text-white font-semibold">
              risk, underwriting, process, product, and technology
            </span>.
          </Body>
          <ul className="mt-6 space-y-3 text-sm md:text-base text-white/70 max-w-xl">
            {[
              "President & Head of Retail Assets, Poonawalla Fincorp (2021-2024) — ₹30,000+ cr book, 1,000+ team",
              "Co-founded CoinTribe Technologies (2015-2020) — digital lending, full 5-year founder cycle",
              "VP & National Credit Head, Magma Fincorp (2012-2015) — direct adjacency to Magma HDI motor",
              "Earlier: Reliance Capital, GE Money, Standard Chartered, ICICI Bank, PNB Housing",
              "15K+ LinkedIn followers, deep insurer network across India",
            ].map((b) => (
              <li key={b} className="flex gap-3">
                <span className="text-[#FF6B35] mt-1">·</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-l border-white/10 pl-8">
          <Eyebrow>Hiring next</Eyebrow>
          <div className="space-y-3 text-base md:text-lg font-semibold text-white">
            <div>Founding CTO (AI/ML)</div>
            <div>Head of Insurer Relationships</div>
            <div>Head of Growth</div>
          </div>
          <div className="mt-8 text-xs md:text-sm text-white/40 max-w-xs">
            Series-A bench by month 9.
          </div>
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 15 Roadmap
  {
    render: () => (
      <div>
        <Eyebrow>24 months</Eyebrow>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          {[
            { w: "Now", e: "V1 live · investor demo runs" },
            { w: "Month 6", e: "Direct Broker licence active · revenue ON", accent: true },
            { w: "Month 9", e: "Retail health launches (90 days after motor)" },
            { w: "Month 12", e: "5,000 paid policies / mo across motor + health" },
            { w: "Month 18", e: "Mobile app GA · WhatsApp live everywhere" },
            { w: "Month 24", e: "20,000 policies / mo · ₹200 cr GWP · Series A ready", accent: true },
          ].map((m, i) => (
            <div key={i} className="relative">
              <div
                className={clsx(
                  "w-3 h-3 rounded-full mb-3",
                  m.accent ? "bg-[#FF6B35]" : "bg-white/40"
                )}
              />
              <div className="text-xs font-bold tracking-[0.15em] uppercase text-white/40 mb-1">
                {m.w}
              </div>
              <div className="text-sm md:text-base text-white/80 leading-snug">{m.e}</div>
            </div>
          ))}
        </div>
        <div className="mt-16 text-sm md:text-base text-white/50 max-w-3xl">
          <span className="text-white font-semibold">Phase 1 (months 1-6) — unregulated advisor mode.</span> Build product, perfect AI, embed with insurers. Revenue switches on at month 6.
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 16 The ask
  {
    render: () => (
      <div>
        <div className="font-extrabold text-[72px] md:text-[120px] tracking-tight leading-none">
          $7M <Accent>—</Accent> $10M
        </div>
        <div className="mt-4 text-base md:text-xl text-white/60 font-medium max-w-2xl">
          Pre-seed + Seed, combined. Structurable as tranched commitment.
        </div>
        <div className="mt-8 md:mt-10">
          <div className="text-[10px] md:text-xs font-bold tracking-[0.18em] uppercase text-white/40 mb-3">
            Use of funds
          </div>
          <div className="space-y-2 max-w-3xl">
            {[
              { l: "Tech + product (AI, mobile, WhatsApp)", p: 40 },
              { l: "Compliance + licence + insurer integrations", p: 20 },
              { l: "D2C acquisition (SEO, WhatsApp, content, PR)", p: 20 },
              { l: "Team (12-15 hires, no field sales)", p: 15 },
              { l: "Buffer", p: 5 },
            ].map((row) => (
              <div key={row.l} className="flex items-center gap-4">
                <div className="flex-1 text-xs md:text-sm text-white/70">{row.l}</div>
                <div className="w-32 md:w-44 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF6B35]"
                    style={{ width: `${row.p * 2.5}%` }}
                  />
                </div>
                <div className="text-xs md:text-sm font-bold tabular-nums w-10 text-right">
                  {row.p}%
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 md:mt-8 text-xs md:text-sm text-white/40 max-w-3xl">
          Series A target: $25-35M at $120-180M post (Q2 2027).
        </div>
      </div>
    ),
  },

  // ─────────────────────────────────────────────────── 17 Vision
  {
    render: () => (
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight">
          Motor today.
          <br />
          Health in 90 days.
          <br />
          <Accent>Every Indian household&apos;s</Accent>
          <br />
          <Accent>insurance, made simple.</Accent>
        </h1>
        <div className="mt-20 text-sm md:text-base text-white/40 font-medium tracking-wider">
          Manish Chaudhari · founder@rightoffer.in · rightoffer.in
        </div>
      </div>
    ),
  },
];
