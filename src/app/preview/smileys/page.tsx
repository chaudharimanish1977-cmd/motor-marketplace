/* eslint-disable react/no-unescaped-entities */
/**
 * /preview/smileys — internal preview of every reusable cute element
 * in the Reading Room visual library, with mock contexts showing where
 * each one lands across the product.
 *
 * Sections (top to bottom):
 *
 *   §1  Rating scale            — the 5-point CarSmiley row + widget mock
 *   §2  Thank-you car           — heart-floating gratitude car
 *   §3  Parsing loader          — the cutest one; animated scene
 *   §4  Empty /me state         — "no policies yet" invitation card
 *   §5  Renewal-reminder email  — email hero illustration
 *   §6  Error page (404)        — sad-car page-not-found
 *   §7  Magic-link confirmation — "check your email" thank-you screen
 *   §8  Sample-review CTA       — body-type car next to the closing CTA
 *   §9  Bid-results header      — happy car next to a savings headline
 *   §10 Privacy/terms masthead  — soft thank-you car atop legal pages
 *   §11 Pricing-tier silhouettes — hatch / sedan / SUV as Basic/Std/Pro
 *   §12 Public share / OG card  — what a shared report looks like
 *   §13 Founder note hero       — editorial open of an About page
 *   §14 Onboarding step markers — five mini cars as progress dots
 *
 * Everything on this page is a MOCK — the real surfaces will get the
 * elements once design is approved.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  CarSmiley,
  ThankYouCar,
  type SmileyRating,
} from "@/components/car-smiley";
import { LoaderScene } from "@/components/loader-scene";
import { NumberPlateOTP } from "@/components/number-plate-otp";
import {
  SketchCar,
  SketchHatchback,
  SketchSedan,
  SketchSUV,
} from "@/components/sketches";
import {
  SketchExitSign,
  SketchGarage,
  SketchOpenRoad,
  SketchPetrolPump,
  SketchRoadside,
  SketchSpeedometer,
  SketchTrafficJam,
  SketchUploadCar,
  TrafficLightDot,
} from "@/components/sketches-scenes";

export const metadata: Metadata = {
  title: "Cute element library · preview",
  description:
    "Internal preview of all reusable Reading Room cute elements and the surfaces they're designed for.",
};

const RATINGS: Array<{
  rating: SmileyRating;
  label: string;
  note: string;
}> = [
  { rating: 1, label: "Awful", note: "X-eyes · angry brows · steam lines" },
  { rating: 2, label: "Bad", note: "Sad eye-arcs · light frown" },
  { rating: 3, label: "Okay", note: "Dot eyes · straight mouth" },
  { rating: 4, label: "Good", note: "Dot eyes · gentle smile" },
  { rating: 5, label: "Delighted", note: "Closed-eye smiles · grin · sparkles" },
];

export default function SmileysPreviewPage() {
  return (
    <article className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      <header className="border-b border-brand-charcoal/15 pb-5 mb-8">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-3">
          · Internal preview ·
        </div>
        <h1 className="font-serif font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
          Cute element{" "}
          <span className="italic text-brand-plum">library.</span>
        </h1>
        <p className="mt-3 font-serif italic text-[15.5px] md:text-[17px] leading-[1.55] text-brand-slate max-w-xl">
          Every reusable ink-line illustration in the Reading Room library,
          mocked into the actual surface it's designed for. Mocks only —
          live surfaces get the elements once we approve here.
        </p>
      </header>

      {/* ═════ §1 RATING SCALE ═════════════════════════════════════ */}
      <Section heading="§1 · Rating scale" subhead="5-point CarSmiley row">
        <div className="grid grid-cols-5 gap-3 md:gap-4 text-brand-plum">
          {RATINGS.map(({ rating, label }) => (
            <div
              key={rating}
              className="flex flex-col items-center gap-2 text-center"
            >
              <CarSmiley rating={rating} width={84} />
              <div className="font-serif font-semibold text-[14px] tracking-[-0.01em] text-brand-charcoal">
                {label}
              </div>
            </div>
          ))}
        </div>

        <SubBlock title="Rating widget mock · 4 of 5 selected">
          <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 py-7">
            <p className="font-serif italic text-lg text-brand-charcoal text-center mb-5">
              How was your review?
            </p>
            <div className="grid grid-cols-5 gap-3 md:gap-4">
              {RATINGS.map(({ rating, label }) => {
                const active = rating === 4;
                return (
                  <div
                    key={rating}
                    className={`flex flex-col items-center gap-2 text-center rounded-2xl px-2 py-3 transition-colors cursor-pointer ${
                      active
                        ? "bg-brand-plum/10 text-brand-plum"
                        : "text-brand-charcoal/30 hover:text-brand-charcoal/60"
                    }`}
                  >
                    <CarSmiley rating={rating} width={56} />
                    <div
                      className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
                        active ? "text-brand-plum" : "text-brand-slate"
                      }`}
                    >
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SubBlock>
      </Section>

      {/* ═════ §2 THANK-YOU CAR ═════════════════════════════════════ */}
      <Section heading="§2 · Thank-you car" subhead="Heart-floating gratitude mark">
        <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 py-8 flex flex-col items-center gap-3 text-brand-plum">
          <ThankYouCar width={120} />
          <h2 className="font-serif font-medium text-2xl tracking-[-0.015em] text-brand-charcoal m-0">
            Thank you.
          </h2>
        </div>
      </Section>

      {/* ═════ §3 PARSING LOADER (the cutest one) ════════════════ */}
      <Section
        heading="§3 · Parsing loader"
        subhead="The cutest one — animated scene; ~30-60s during file upload"
      >
        <LoaderScene />
        <p className="mt-3 font-serif italic text-sm text-brand-slate">
          Bouncing car · floating IDV / NCB / Zero-Dep badges · ambient
          sparkles · cycling status caption · soft reassurance line. This
          replaces the generic upload spinner — the highest-anxiety beat
          in the funnel.
        </p>
      </Section>

      {/* ═════ §4 EMPTY /ME STATE ═════════════════════════════════ */}
      <Section heading="§4 · Empty /me state" subhead='"No policies yet" card for signed-in users'>
        <MockEmptyMe />
      </Section>

      {/* ═════ §5 RENEWAL REMINDER EMAIL ══════════════════════════ */}
      <Section
        heading="§5 · Renewal-reminder email hero"
        subhead='Hero illustration for the "21 days to renewal" mailer'
      >
        <MockRenewalEmail />
      </Section>

      {/* ═════ §6 404 ERROR PAGE ══════════════════════════════════ */}
      <Section heading="§6 · 404 / error page" subhead='"Page got lost" using the sad-car smiley'>
        <Mock404 />
      </Section>

      {/* ═════ §7 MAGIC-LINK CONFIRMATION ═════════════════════════ */}
      <Section
        heading="§7 · Magic-link confirmation"
        subhead='"Check your email" screen after OTP verify'
      >
        <MockMagicLink />
      </Section>

      {/* ═════ §8 SAMPLE-REVIEW CTA ═══════════════════════════════ */}
      <Section
        heading="§8 · Sample-review CTA"
        subhead="Body-type car next to the closing CTA on each /sample-review page"
      >
        <MockSampleCTA />
      </Section>

      {/* ═════ §9 BID-RESULTS HEADER ══════════════════════════════ */}
      <Section
        heading="§9 · Bid-results / offer header"
        subhead='Happy car next to "Your premium dropped by ₹2,100" headline'
      >
        <MockBidResults />
      </Section>

      {/* ═════ §10 PRIVACY / TERMS MASTHEAD ══════════════════════ */}
      <Section
        heading="§10 · Privacy / terms masthead"
        subhead="Soft thank-you car atop legal pages so they read like a letter, not a contract"
      >
        <MockLegalMasthead />
      </Section>

      {/* ═════ §11 PRICING TIER ILLUSTRATIONS ═════════════════════ */}
      <Section
        heading="§11 · Pricing-tier silhouettes"
        subhead="Hatch / sedan / SUV as Basic / Standard / Premium markers"
      >
        <MockPricingTiers />
      </Section>

      {/* ═════ §12 PUBLIC SHARE / OG CARD ═════════════════════════ */}
      <Section
        heading="§12 · Public share / OG card"
        subhead="What a customer's shared report looks like in social previews"
      >
        <MockShareCard />
      </Section>

      {/* ═════ §13 FOUNDER / ABOUT HERO ═══════════════════════════ */}
      <Section
        heading="§13 · Founder / about page hero"
        subhead="Editorial open with hand-drawn car"
      >
        <MockAboutHero />
      </Section>

      {/* ═════ §14 ONBOARDING PROGRESS MARKERS ════════════════════ */}
      <Section
        heading="§14 · Onboarding progress markers"
        subhead="Five mini cars as step indicators across the upload flow"
      >
        <MockOnboardingSteps />
      </Section>

      {/* ═════════════════════════════════════════════════════════════
       *  ROUND 2 EXPANSION — number-plate OTP + 9 more scene metaphors
       *  (user-suggested + CPO additions). These are designs awaiting
       *  approval; once approved, each lands on a specific real surface.
       *  ═════════════════════════════════════════════════════════════ */}

      <div className="mt-16 mb-10 pt-8 border-t-4 border-brand-charcoal/15 text-center">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold">
          · Round 2 · Vocabulary expansion ·
        </div>
        <p className="mt-2 font-serif italic text-[15px] text-brand-slate max-w-xl mx-auto">
          The car as a metaphor language. Each illustration anchors a
          specific product moment — never reused for the wrong one.
        </p>
      </div>

      {/* ═════ §15 NUMBER-PLATE OTP ═══════════════════════════════ */}
      <Section
        heading="§15 · Number-plate OTP"
        subhead="The OTP input rendered as a real Indian HSRP plate · brand signature"
      >
        <MockNumberPlateOTP />
      </Section>

      {/* ═════ §16 UPLOAD CAR (roof rack) ═════════════════════════ */}
      <Section
        heading="§16 · Roof-rack upload car"
        subhead={`"You're bringing your paperwork to us" — replaces the plain dropzone hero`}
      >
        <MockUploadCar />
      </Section>

      {/* ═════ §17 PETROL PUMP (renewal) ══════════════════════════ */}
      <Section
        heading="§17 · Petrol-pump renewal"
        subhead='Annual renewal as a "fill-up" — RO·FUEL station, ₹ ticker, hose to the car'
      >
        <MockPetrolPump />
      </Section>

      {/* ═════ §18 TRAFFIC JAM (the pain) ═════════════════════════ */}
      <Section
        heading="§18 · Stuck in a jam"
        subhead="The customer's current state without RightOffer — pain-state visual for About / comparison pages"
      >
        <MockTrafficJam />
      </Section>

      {/* ═════ §19 GARAGE (parsing alt) ═══════════════════════════ */}
      <Section
        heading="§19 · Service-garage parsing"
        subhead="Alternate loader scene — your policy up on the lift, tools floating around it"
      >
        <MockGarage />
      </Section>

      {/* ═════ §20 TRAFFIC LIGHT FINDINGS ═════════════════════════ */}
      <Section
        heading="§20 · Traffic-light severity row"
        subhead="Tri-state lamp (red / yellow / green) inline with each finding on the report"
      >
        <MockFindingsWithTrafficLight />
      </Section>

      {/* ═════ §21 SPEEDOMETER SCORE ══════════════════════════════ */}
      <Section
        heading="§21 · Vintage speedometer score"
        subhead="The 62/100 report score rendered as a dial needle — where you are vs where you could be"
      >
        <MockSpeedometer />
      </Section>

      {/* ═════ §22 OPEN ROAD (success) ════════════════════════════ */}
      <Section
        heading="§22 · Open road · post-review thank-you"
        subhead={`"You're set. Drive on." — landing image for the final report success state`}
      >
        <MockOpenRoad />
      </Section>

      {/* ═════ §23 ROADSIDE (safety net) ══════════════════════════ */}
      <Section
        heading="§23 · Roadside · what add-ons actually do"
        subhead='Car jacked up with spare tyre nearby — illustrates RSA / Zero-Dep / Engine-Protect benefits'
      >
        <MockRoadside />
      </Section>

      {/* ═════ §24 EXIT SIGN (switch insurer) ═════════════════════ */}
      <Section
        heading="§24 · Highway exit sign"
        subhead='The "switch insurer" recommendation as a friendly direction cue'
      >
        <MockExitSign />
      </Section>

      <footer className="mt-12 pt-6 border-t border-brand-charcoal/15 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
        <Link href="/" className="text-brand-plum hover:underline">
          ← Back to RightOffer
        </Link>
      </footer>
    </article>
  );
}

/* ═══ Section primitives ═════════════════════════════════════════ */

function Section({
  heading,
  subhead,
  children,
}: {
  heading: string;
  subhead?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <div className="mb-5">
        <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage">
          {heading}
        </div>
        {subhead && (
          <div className="font-serif italic text-[13px] text-brand-slate mt-1">
            {subhead}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

function SubBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate mb-3">
        · {title}
      </div>
      {children}
    </div>
  );
}

/* ═══ §4 Empty /me mock ═════════════════════════════════════════ */
function MockEmptyMe() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-12 text-center">
      <div className="flex justify-center text-brand-plum mb-4">
        <SketchCar width={200} color="currentColor" />
      </div>
      <h3 className="font-serif font-medium text-2xl md:text-3xl tracking-[-0.015em] text-brand-charcoal m-0">
        No policies <span className="italic text-brand-plum">yet.</span>
      </h3>
      <p className="mt-3 font-serif italic text-base text-brand-slate max-w-md mx-auto">
        Drop your first motor policy and we'll have a review for you in
        under two minutes.
      </p>
      <div className="mt-6">
        <span className="inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-5 py-2.5 rounded-full font-serif italic font-medium text-sm">
          Upload your first policy <span aria-hidden>→</span>
        </span>
      </div>
    </div>
  );
}

/* ═══ §5 Renewal-reminder email mock ════════════════════════════ */
function MockRenewalEmail() {
  return (
    <div className="rounded-2xl border border-brand-charcoal/15 bg-brand-offwhite overflow-hidden max-w-xl mx-auto shadow-soft">
      {/* Mock email header */}
      <div className="px-6 py-3 border-b border-brand-charcoal/10 bg-brand-surface font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate flex justify-between">
        <span>From: hello@rightoffer.in</span>
        <span>21 days to renewal</span>
      </div>
      {/* Hero */}
      <div className="px-6 py-7 text-center">
        <div className="flex justify-center text-brand-plum mb-3">
          <SketchCar width={140} color="currentColor" />
        </div>
        <h3 className="font-serif font-medium text-2xl tracking-[-0.015em] text-brand-charcoal m-0">
          Your Honda City is up for{" "}
          <span className="italic text-brand-plum">renewal soon.</span>
        </h3>
        <p className="mt-3 font-serif italic text-sm text-brand-slate max-w-sm mx-auto">
          21 days. We've already reviewed last year's policy — want a fresh
          look at this year's quote?
        </p>
        <div className="mt-5">
          <span className="inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-4 py-2 rounded-full font-serif italic font-medium text-sm">
            Get a fresh review <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══ §6 404 page mock ══════════════════════════════════════════ */
function Mock404() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-12 text-center">
      <div className="flex justify-center text-brand-plum mb-3">
        <CarSmiley rating={1} width={120} />
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-2">
        · 404 · This page got lost ·
      </div>
      <h3 className="font-serif font-medium text-3xl md:text-4xl tracking-[-0.02em] text-brand-charcoal m-0">
        We can't find{" "}
        <span className="italic text-brand-plum">that.</span>
      </h3>
      <p className="mt-3 font-serif italic text-base text-brand-slate max-w-md mx-auto">
        Possibly mistyped, possibly moved, possibly never existed.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <span className="inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-4 py-2 rounded-full font-serif italic font-medium text-sm">
          Back to home <span aria-hidden>→</span>
        </span>
      </div>
    </div>
  );
}

/* ═══ §7 Magic-link confirmation mock ═══════════════════════════ */
function MockMagicLink() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-10 text-center">
      <div className="flex justify-center text-brand-plum mb-2">
        <ThankYouCar width={120} />
      </div>
      <h3 className="font-serif font-medium text-2xl md:text-3xl tracking-[-0.015em] text-brand-charcoal m-0">
        Check your{" "}
        <span className="italic text-brand-plum">inbox.</span>
      </h3>
      <p className="mt-3 font-serif italic text-base text-brand-slate max-w-md mx-auto">
        We sent a sign-in link to{" "}
        <span className="not-italic font-semibold text-brand-charcoal">
          you@example.com
        </span>
        . Tap it to read your review.
      </p>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-sage">
        · This link expires in 30 minutes ·
      </p>
    </div>
  );
}

/* ═══ §8 Sample-review CTA mock ═════════════════════════════════ */
function MockSampleCTA() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-10 text-center">
      <div className="flex justify-center text-brand-plum mb-3">
        <SketchSedan width={200} color="currentColor" />
      </div>
      <h3 className="font-serif font-medium text-2xl md:text-[28px] tracking-[-0.015em] leading-tight text-brand-charcoal m-0 max-w-xl mx-auto">
        Want this for{" "}
        <span className="italic text-brand-plum">your own policy?</span>
      </h3>
      <div className="mt-5">
        <span className="inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-5 py-2.5 rounded-full font-serif italic font-medium text-sm">
          Get my free 2-minute review <span aria-hidden>→</span>
        </span>
      </div>
    </div>
  );
}

/* ═══ §9 Bid-results header mock ════════════════════════════════ */
function MockBidResults() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 p-6 md:p-8">
      <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-3">
        · BID № 4471 · Honda City · 2021
      </div>
      <div className="grid md:grid-cols-[1fr_auto] items-center gap-6">
        <div>
          <h3 className="font-serif font-medium text-3xl md:text-4xl tracking-[-0.02em] leading-tight text-brand-charcoal m-0">
            Your premium just dropped by{" "}
            <span className="italic text-brand-plum">₹2,100.</span>
          </h3>
          <p className="mt-3 font-serif italic text-base text-brand-slate max-w-md">
            Same cover. Same insurer. Better quote — because we corrected
            your IDV before re-pricing.
          </p>
        </div>
        <div className="text-brand-plum flex justify-center">
          <CarSmiley rating={5} width={130} />
        </div>
      </div>
    </div>
  );
}

/* ═══ §10 Legal masthead mock ═══════════════════════════════════ */
function MockLegalMasthead() {
  return (
    <div className="rounded-2xl bg-brand-offwhite border border-brand-charcoal/15 px-6 md:px-10 py-10">
      <div className="flex items-start gap-5">
        <div className="text-brand-plum flex-shrink-0 hidden md:block">
          <ThankYouCar width={90} />
        </div>
        <div className="flex-1">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-2">
            · Reading Room ·
          </div>
          <h3 className="font-serif font-medium text-3xl md:text-4xl tracking-[-0.02em] text-brand-charcoal m-0">
            Privacy{" "}
            <span className="italic text-brand-plum">Policy.</span>
          </h3>
          <p className="mt-3 font-serif italic text-base text-brand-slate">
            What we collect, what we don't, and how we look after it.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══ §11 Pricing tier silhouettes mock ═════════════════════════ */
function MockPricingTiers() {
  const tiers = [
    {
      label: "Essential",
      sub: "Third-party + basic",
      price: "₹6,400",
      Sketch: SketchHatchback,
    },
    {
      label: "Standard",
      sub: "Comprehensive + NCB",
      price: "₹12,800",
      Sketch: SketchSedan,
      active: true,
    },
    {
      label: "Total",
      sub: "Zero-Dep + Engine + RSA",
      price: "₹18,900",
      Sketch: SketchSUV,
    },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {tiers.map(({ label, sub, price, Sketch, active }) => (
        <div
          key={label}
          className={`rounded-2xl border px-5 py-7 text-center ${
            active
              ? "border-brand-plum bg-brand-plum/5"
              : "border-brand-charcoal/15 bg-brand-surface"
          }`}
        >
          <div className="text-brand-plum flex justify-center mb-3">
            <Sketch width={140} color="currentColor" />
          </div>
          <div className="font-serif font-semibold text-xl tracking-[-0.015em] text-brand-charcoal">
            {label}
          </div>
          <div className="mt-1 font-serif italic text-sm text-brand-slate">
            {sub}
          </div>
          <div className="mt-3 font-serif font-medium text-2xl text-brand-plum">
            {price}
            <span className="text-brand-slate text-xs italic font-normal">
              {" "}
              /yr
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══ §12 Public share / OG mock ════════════════════════════════ */
function MockShareCard() {
  return (
    <div className="rounded-2xl border-2 border-brand-charcoal/20 bg-gradient-to-br from-brand-surface to-brand-offwhite px-6 md:px-8 py-6 md:py-7 max-w-xl mx-auto">
      <div className="flex items-center gap-5">
        <div className="text-brand-plum flex-shrink-0">
          <SketchSedan width={150} color="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-sage font-bold">
            · rightoffer.in · sample review ·
          </div>
          <div className="mt-1 font-serif font-medium text-xl leading-tight tracking-[-0.015em] text-brand-charcoal">
            Honda City review found{" "}
            <span className="italic text-brand-plum">₹2.4 lakh</span> of
            hidden cover.
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-slate">
            1m 47s · Bengaluru
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ §13 Founder / about hero mock ═════════════════════════════ */
function MockAboutHero() {
  return (
    <div className="px-2 md:px-6 py-2">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-3">
        · About RightOffer ·
      </div>
      <div className="grid md:grid-cols-[1fr_auto] items-end gap-5">
        <h3 className="font-serif font-medium text-3xl md:text-[44px] leading-[1.1] tracking-[-0.025em] text-brand-charcoal m-0">
          We started because{" "}
          <span className="italic text-brand-plum">
            nobody reads their policy
          </span>{" "}
          — and that turned out to cost real money.
        </h3>
        <div className="text-brand-plum hidden md:block">
          <SketchSedan width={160} color="currentColor" />
        </div>
      </div>
      <p className="mt-5 font-serif italic text-base md:text-lg text-brand-slate max-w-2xl">
        In 2025, a friend's claim got cut in half over a missing add-on.
        Two months later, three of us were reading every clause of every
        policy that came our way. RightOffer is what came out of that.
      </p>
    </div>
  );
}

/* ═══ §15 Number-plate OTP mock ════════════════════════════════ */
function MockNumberPlateOTP() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-9">
      <p className="font-serif italic text-base text-brand-slate text-center mb-5">
        Three states of the plate as the customer types:
      </p>
      <div className="flex flex-col items-center gap-7">
        {/* Empty */}
        <div className="flex flex-col items-center gap-2">
          <NumberPlateOTP digits="" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
            · Empty plate · awaiting input ·
          </span>
        </div>
        {/* Mid-type */}
        <div className="flex flex-col items-center gap-2">
          <NumberPlateOTP digits="042" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
            · 3 of 6 digits ·
          </span>
        </div>
        {/* Complete */}
        <div className="flex flex-col items-center gap-2">
          <NumberPlateOTP digits="042817" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-plum font-bold">
            · COMPLETE · PLATE LIGHTS UP IN PLUM ·
          </span>
        </div>
      </div>
      <p className="mt-7 font-serif italic text-sm text-brand-slate text-center max-w-md mx-auto">
        Lands on /me/login OTP, the report email-gate, and any future
        code-entry surface. A signature element competitors won't copy.
      </p>
    </div>
  );
}

/* ═══ §16 Roof-rack upload car mock ════════════════════════════ */
function MockUploadCar() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-10 text-center">
      <div className="flex justify-center text-brand-plum mb-4">
        <SketchUploadCar width={320} color="currentColor" />
      </div>
      <h3 className="font-serif font-medium text-2xl md:text-3xl tracking-[-0.015em] text-brand-charcoal m-0">
        Drop your policy.{" "}
        <span className="italic text-brand-plum">We'll take it from here.</span>
      </h3>
      <p className="mt-3 font-serif italic text-base text-brand-slate max-w-md mx-auto">
        Stack one or many — every document rides on the roof until we've
        read each one.
      </p>
    </div>
  );
}

/* ═══ §17 Petrol pump renewal mock ═════════════════════════════ */
function MockPetrolPump() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-9">
      <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-3">
        · 21 days to renewal · RO·FUEL pump open ·
      </div>
      <div className="grid md:grid-cols-[1fr_auto] items-center gap-4">
        <div>
          <h3 className="font-serif font-medium text-2xl md:text-[28px] tracking-[-0.015em] leading-tight text-brand-charcoal m-0">
            Time to{" "}
            <span className="italic text-brand-plum">top up your cover.</span>
          </h3>
          <p className="mt-3 font-serif italic text-base text-brand-slate max-w-md">
            Last year you paid ₹12,840. Pull up at the pump and we'll
            tell you what this year's quote should look like — and where
            the better-priced ones are parked.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
            · Like grades of petrol · Basic / Standard / Total ·
          </p>
        </div>
        <div className="text-brand-plum">
          <SketchPetrolPump width={320} color="currentColor" />
        </div>
      </div>
    </div>
  );
}

/* ═══ §18 Traffic-jam (pain state) mock ════════════════════════ */
function MockTrafficJam() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-10">
      <div className="text-brand-plum flex justify-center mb-2">
        <SketchTrafficJam width={400} color="currentColor" />
      </div>
      <div className="text-center">
        <h3 className="font-serif font-medium text-2xl md:text-[28px] tracking-[-0.015em] leading-tight text-brand-charcoal m-0 max-w-xl mx-auto">
          The usual way is{" "}
          <span className="italic text-brand-plum">a 6-week traffic jam.</span>
        </h3>
        <p className="mt-3 font-serif italic text-base text-brand-slate max-w-md mx-auto">
          Sales calls. Policy PDFs nobody reads. Renewals stuck behind
          forms. Claims circled around call centres. RightOffer is the
          way out — not the way in.
        </p>
      </div>
    </div>
  );
}

/* ═══ §19 Garage (parsing alt) mock ════════════════════════════ */
function MockGarage() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-10 text-center">
      <div className="text-brand-plum flex justify-center mb-3">
        <SketchGarage width={340} color="currentColor" />
      </div>
      <h3 className="font-serif font-medium text-xl md:text-2xl tracking-[-0.015em] text-brand-charcoal m-0">
        Your policy is{" "}
        <span className="italic text-brand-plum">up on the lift.</span>
      </h3>
      <p className="mt-3 font-serif italic text-sm text-brand-slate max-w-md mx-auto">
        Optional alternate to the bouncing-car loader — softer, more
        editorial. Especially good for second-time customers who don't
        need the energy of the bouncing car.
      </p>
    </div>
  );
}

/* ═══ §20 Findings with traffic-light mock ═════════════════════ */
function MockFindingsWithTrafficLight() {
  const findings = [
    { sev: "high" as const, k: "GAP", label: "IDV undervalued", detail: "₹6.4L declared · market ~₹8.8L" },
    { sev: "high" as const, k: "GAP", label: "No Zero-Dep cover", detail: "Standard for cars under 5 yrs old" },
    { sev: "ok" as const, k: "OK", label: "Roadside assistance", detail: "Active until renewal" },
    { sev: "mid" as const, k: "WATCH", label: "NCB at 25%", detail: "Resets if you claim before January" },
    { sev: "ok" as const, k: "OK", label: "PA cover for owner", detail: "Mandatory · in place" },
  ];
  return (
    <div className="rounded-2xl bg-brand-offwhite border border-brand-charcoal/15 border-l-4 border-l-brand-plum p-6">
      <div className="grid gap-2">
        {findings.map((f, i) => (
          <div
            key={f.label}
            className={`grid grid-cols-[auto_64px_1fr] gap-3 items-center py-2 ${
              i < findings.length - 1
                ? "border-b border-dotted border-brand-charcoal/10"
                : ""
            }`}
          >
            <TrafficLightDot severity={f.sev} width={14} />
            <span
              className={`font-mono font-bold text-[10px] tracking-[0.12em] ${
                f.sev === "high"
                  ? "text-brand-sage"
                  : f.sev === "mid"
                    ? "text-brand-slate"
                    : "text-brand-plum"
              }`}
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
        ))}
      </div>
      <p className="mt-4 font-serif italic text-xs text-brand-slate">
        Red / yellow / green light sits inline with each finding row.
        Reads at a glance — even at scale-down it's still legible.
      </p>
    </div>
  );
}

/* ═══ §21 Speedometer score mock ═══════════════════════════════ */
function MockSpeedometer() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-8 text-center">
      <div className="text-brand-plum flex justify-center mb-3">
        <SketchSpeedometer
          width={240}
          color="currentColor"
         
          score={62}
        />
      </div>
      <p className="font-serif italic text-base text-brand-slate max-w-md mx-auto">
        Your review score. Where you are, where you could be — a
        vintage-dashboard feel that makes 62/100 land as a real number,
        not a generic progress bar.
      </p>
    </div>
  );
}

/* ═══ §22 Open road success mock ═══════════════════════════════ */
function MockOpenRoad() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-10 text-center">
      <div className="text-brand-plum flex justify-center mb-3">
        <SketchOpenRoad
          width={400}
          color="currentColor"
         
        />
      </div>
      <h3 className="font-serif font-medium text-3xl md:text-4xl tracking-[-0.02em] text-brand-charcoal m-0">
        You're{" "}
        <span className="italic text-brand-plum">set.</span>
      </h3>
      <p className="mt-3 font-serif italic text-base text-brand-slate max-w-md mx-auto">
        Verdict delivered. The recommendation is in your email and on
        WhatsApp. Drive on.
      </p>
    </div>
  );
}

/* ═══ §23 Roadside / safety-net mock ═══════════════════════════ */
function MockRoadside() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-10">
      <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-2">
            · WHAT ZERO-DEP ACTUALLY DOES ·
          </div>
          <h3 className="font-serif font-medium text-2xl md:text-[28px] tracking-[-0.015em] leading-tight text-brand-charcoal m-0">
            The flat tyre at{" "}
            <span className="italic text-brand-plum">11pm.</span>
          </h3>
          <p className="mt-3 font-serif italic text-base text-brand-slate max-w-md">
            Add-ons sound abstract until the moment they aren't. This
            illustration explains what your ₹2,400/yr Zero-Dep + RSA
            cover actually means — without a single insurance term.
          </p>
        </div>
        <div className="text-brand-plum">
          <SketchRoadside
            width={320}
            color="currentColor"
           
          />
        </div>
      </div>
    </div>
  );
}

/* ═══ §24 Exit sign / switch-insurer mock ══════════════════════ */
function MockExitSign() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-10 text-center">
      <div className="text-brand-plum flex justify-center mb-3">
        <SketchExitSign
          width={240}
          color="currentColor"
         
        />
      </div>
      <h3 className="font-serif font-medium text-2xl md:text-[28px] tracking-[-0.015em] leading-tight text-brand-charcoal m-0">
        Next exit:{" "}
        <span className="italic text-brand-plum">a better-priced policy.</span>
      </h3>
      <p className="mt-3 font-serif italic text-base text-brand-slate max-w-md mx-auto">
        Turns the cold "switch insurer" CTA into a friendly direction
        cue. Less push, more nudge.
      </p>
    </div>
  );
}

/* ═══ §14 Onboarding step markers mock ══════════════════════════ */
function MockOnboardingSteps() {
  const steps = [
    { label: "Upload", active: false, done: true },
    { label: "Parsing", active: true, done: false },
    { label: "Reviewing", active: false, done: false },
    { label: "Verdict", active: false, done: false },
    { label: "Share", active: false, done: false },
  ];
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-6 md:px-10 py-8">
      <div className="flex items-center justify-between gap-3 md:gap-4">
        {steps.map((step, i) => {
          const color = step.done
            ? "text-brand-sage"
            : step.active
              ? "text-brand-plum"
              : "text-brand-charcoal/25";
          const labelColor = step.done
            ? "text-brand-sage"
            : step.active
              ? "text-brand-plum"
              : "text-brand-charcoal/40";
          return (
            <div
              key={step.label}
              className="flex flex-col items-center gap-2 flex-1 text-center"
            >
              <div className={color}>
                <SketchCar width={50} color="currentColor" />
              </div>
              <div
                className={`font-mono text-[9px] uppercase tracking-[0.12em] ${labelColor}`}
              >
                {step.done && "✓ "}
                {step.label}
              </div>
              {i < steps.length - 1 && (
                <div className="absolute" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-5 font-serif italic text-sm text-brand-slate text-center">
        Step indicators replace the abstract dot row across the upload →
        report → share flow. Done steps in sage, current in plum, pending
        in muted charcoal.
      </p>
    </div>
  );
}
