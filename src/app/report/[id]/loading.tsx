"use client";

import { useSearchParams } from "next/navigation";
import { TypewriterCycle } from "@/components/typewriter";
import { StopwatchChip } from "@/components/stopwatch-chip";
import { BrandBlobs } from "@/components/brand-blobs";

/**
 * Report loading screen — editorial vocab.
 *
 * The customer has just clicked through Stop 6 of the upload journey
 * and is waiting for the report to bake. Previously this screen
 * mounted MidLoadQuestions to fill any unanswered carousel slots,
 * but the questions surface here read as a "second round of forms"
 * after the customer thought they were done — a UX break.
 *
 * As of this revision the screen is a calm, editorial "we're
 * personalising your review" beat: typewriter cycle narrating what
 * the parser is doing, a small stopwatch in the corner, no second
 * questionnaire. The customer's mid-load answers were already
 * captured during Stop 3 of the upload journey.
 */
const REPORT_MESSAGES = [
  "Personalising your review",
  "Reading every line of your policy",
  "Identifying coverage and add-ons",
  "Verifying IDV and No-Claim Bonus",
  "Looking for gaps in your protection",
  "Folding in your driving profile",
  "Curating insights for your car",
];

export default function Loading() {
  const params = useSearchParams();
  const fromParam = params?.get("from");
  const startedAt = fromParam ? parseInt(fromParam, 10) : NaN;
  const validStart =
    Number.isFinite(startedAt) && startedAt > 0 ? startedAt : undefined;

  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-screen px-5 md:px-6 py-12 md:py-20">
        <article className="max-w-2xl mx-auto font-serif text-brand-charcoal">
          {validStart !== undefined && (
            <div className="absolute top-5 right-5 md:top-8 md:right-8 z-10">
              <StopwatchChip startedAt={validStart} size={54} />
            </div>
          )}

          {/* Editorial masthead */}
          <header className="border-b border-brand-charcoal/15 pb-5 mb-10">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold">
              · Reading Room · Personalising your review ·
            </div>
            <h1 className="mt-3 font-serif font-medium text-[28px] md:text-[40px] leading-[1.1] tracking-[-0.02em] text-brand-charcoal m-0 min-h-[2.2em]">
              <TypewriterCycle
                messages={REPORT_MESSAGES}
                typeSpeed={38}
                eraseSpeed={22}
                holdMs={1500}
                caretClassName="bg-brand-plum"
              />
            </h1>
          </header>

          {/* Quiet reassurance — explains what's happening + sets the
              "personalised, not generic" expectation. No questions, no
              forms, no second-round friction. */}
          <section className="space-y-6">
            <p className="font-serif italic text-[16px] md:text-[18px] leading-[1.6] text-brand-slate max-w-xl">
              We&rsquo;re reading your policy line by line and folding
              in what you told us about your driving — so the review
              that lands here is built for{" "}
              <span className="not-italic text-brand-charcoal font-medium">
                your car
              </span>
              , not a generic template.
            </p>

            <div className="pl-4 border-l-2 border-brand-plum/60">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] font-bold text-brand-plum">
                · What we&rsquo;re weighing ·
              </div>
              <ul className="mt-2 space-y-1 font-serif text-[14.5px] md:text-[15px] text-brand-charcoal leading-[1.6]">
                <li>· Coverage you&rsquo;re already paying for</li>
                <li>· Gaps a claim would expose</li>
                <li>· IDV vs. current market value of your car</li>
                <li>· City-specific renewal notes</li>
                <li>· How insights for your profile fit</li>
              </ul>
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
              · Sit tight · Usually under 30 seconds ·
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
