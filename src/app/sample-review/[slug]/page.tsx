/**
 * /sample-review/[slug] — a single anonymised sample review.
 *
 * Editorial layout, mirrors the V7CaseStudy block on the
 * home page but expanded into a full-page reading experience. Each
 * sample serves three jobs:
 *
 *   · Public proof — visitors see exactly what they're about to get
 *   · SEO discovery — indexable for queries like "honda city insurance
 *     review India"
 *   · Return-visit hook — bookmark / share / come back later
 *
 * Three samples are hard-coded in src/lib/sample-reviews.ts; this page
 * resolves the slug, renders the review, and surfaces the other two
 * at the bottom as related reading.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoadingLink } from "@/components/loading-link";
import {
  SketchHatchback,
  SketchSedan,
  SketchSUV,
} from "@/components/sketches";
import {
  SAMPLE_REVIEWS,
  getRelatedSamples,
  getSampleReview,
  type BodyType,
} from "@/lib/sample-reviews";

/** Pick the right ink-line sketch component for a vehicle body type. */
function sketchForBodyType(bodyType: BodyType) {
  switch (bodyType) {
    case "hatchback":
      return SketchHatchback;
    case "suv":
      return SketchSUV;
    case "sedan":
    default:
      return SketchSedan;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SAMPLE_REVIEWS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sample = getSampleReview(slug);
  if (!sample) return {};
  return {
    title: `${sample.vehicle} review · sample`,
    description: sample.seoDescription,
  };
}

export default async function SampleReviewPage({ params }: PageProps) {
  const { slug } = await params;
  const sample = getSampleReview(slug);
  if (!sample) notFound();

  const related = getRelatedSamples(slug);

  return (
    <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      {/* Masthead */}
      <header className="border-b border-brand-charcoal/15 pb-5 mb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3 font-mono text-[10.5px] uppercase tracking-[0.16em] font-bold">
          <Link
            href="/sample-review"
            className="text-brand-sage hover:text-brand-plum transition-colors"
          >
            · All samples ·
          </Link>
          <span className="text-brand-slate">
            Sample № {sample.issueNumber} ·{" "}
            <span className="text-brand-plum">Lens · {sample.profileLabel}</span>
          </span>
        </div>
      </header>

      {/* Audit duration kicker */}
      <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-4">
        · The audit took {sample.auditTime} ·
      </p>

      {/* Headline */}
      <h1 className="font-serif font-medium text-3xl md:text-[44px] leading-[1.08] tracking-[-0.02em] text-balance text-brand-charcoal m-0">
        {renderHeadlineWithHighlight(sample.headline, sample.headlineHighlight)}
      </h1>

      {/* Lede */}
      <p className="mt-5 font-serif italic text-lg md:text-xl leading-[1.55] text-brand-slate max-w-2xl text-balance">
        {sample.lede}
      </p>

      {/* Vehicle illustration — deliberate hero slot, centred above the
       *  findings card. Picks the right body-type sketch (hatchback /
       *  sedan / SUV) so the image matches the car under review.
       *  Previously sat as an absolute-positioned watermark in the
       *  top-right of the findings card, where it collided with the
       *  score badge on narrower widths — the hero slot solves both
       *  the tangle and gives the illustration the visual weight it
       *  deserves as an editorial flourish. */}
      <div className="mt-10 mb-2 flex justify-center text-brand-sage">
        {(() => {
          const Sketch = sketchForBodyType(sample.bodyType);
          return <Sketch width={260} color="currentColor" />;
        })()}
      </div>

      {/* Findings card */}
      <section className="mt-4 bg-brand-surface border-l-4 border-brand-sage px-6 py-7 md:px-8 md:py-9">
        {/* (Previous absolute-positioned sedan watermark removed — see
         *  the hero slot above. The card is now uncluttered.) */}
        <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-3">
          Anonymised findings
        </div>
        <div className="bg-brand-offwhite border border-brand-charcoal/10 border-l-4 border-l-brand-plum p-5">
          <div className="flex justify-between pb-3.5 border-b border-brand-charcoal/10 mb-3.5">
            <div>
              <div className="font-serif font-semibold text-xl md:text-[22px] tracking-[-0.01em] text-brand-charcoal">
                {sample.vehicle} · {sample.year}
              </div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-slate mt-1">
                {sample.city} · {sample.insurer} · {sample.premium}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-slate">
                Score
              </div>
              <div className="font-serif font-semibold text-4xl text-brand-sage leading-[0.9] mt-0.5">
                {sample.score}
                <span className="text-brand-slate text-sm italic font-normal">
                  /100
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-1.5">
            {sample.findings.map((f, i) => {
              const colorClass =
                f.sev === "high"
                  ? "text-brand-sage"
                  : f.sev === "mid"
                    ? "text-brand-slate"
                    : "text-brand-plum";
              return (
                <div
                  key={f.label}
                  className={`grid grid-cols-[64px_1fr] gap-3 items-baseline py-1.5 ${
                    i < sample.findings.length - 1
                      ? "border-b border-dotted border-brand-charcoal/10"
                      : ""
                  }`}
                >
                  <span
                    className={`font-mono font-bold text-[9.5px] tracking-[0.12em] ${colorClass}`}
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
      </section>

      {/* Verdict */}
      <section className="mt-10">
        <h2 className="font-serif font-medium text-2xl md:text-[28px] leading-[1.25] tracking-[-0.015em] text-brand-charcoal m-0">
          The recommendation:{" "}
          <span className="italic text-brand-plum">
            {sample.verdict.headlineHighlight}.
          </span>
        </h2>
        <p className="mt-4 font-serif text-[16px] md:text-[17px] leading-[1.65] text-brand-slate text-balance">
          {sample.verdict.body}
        </p>
      </section>

      {/* CTA */}
      <section className="mt-12 pt-10 border-t border-brand-charcoal/15 text-center">
        <p className="font-serif italic text-[17px] text-brand-slate max-w-md mx-auto mb-5">
          Want this for your own policy? It takes two minutes, costs
          nothing, and you&apos;ll never hear from a sales caller.
        </p>
        <LoadingLink
          href="/upload"
          className="inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-6 py-3.5 rounded-full font-serif italic font-medium text-[17px] hover:opacity-90 transition-opacity"
        >
          Get my free 2-minute review <span aria-hidden>→</span>
        </LoadingLink>
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage">
          · Trusted by 1,000+ Indian car owners ·
        </p>
      </section>

      {/* Other samples */}
      <section className="mt-14 pt-8 border-t border-brand-charcoal/15">
        <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-5">
          Other sample reviews
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {related.map((other) => (
            <Link
              key={other.slug}
              href={`/sample-review/${other.slug}`}
              className="group block rounded-xl border border-brand-charcoal/15 hover:border-brand-plum/40 transition-colors px-5 py-4 bg-brand-surface"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-sage mb-2">
                Lens · {other.profileLabel}
              </div>
              <div className="font-serif font-semibold text-lg leading-[1.2] tracking-[-0.015em] text-brand-charcoal group-hover:text-brand-plum transition-colors">
                {other.vehicle} · {other.year}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-slate">
                {other.city}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-12 pt-6 border-t border-brand-charcoal/15 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
        <Link href="/" className="text-brand-plum hover:underline">
          ← Back to RightOffer
        </Link>
      </footer>
    </article>
  );
}

/**
 * Render a headline string with one phrase wrapped in italic-plum. We
 * locate the highlight phrase inside the full headline (case-sensitive)
 * and split around it. Falls back to plain text if the phrase isn't
 * present (defensive).
 */
function renderHeadlineWithHighlight(
  headline: string,
  highlight: string
): React.ReactNode {
  const index = headline.indexOf(highlight);
  if (index === -1) return headline;
  return (
    <>
      {headline.slice(0, index)}
      <span className="italic text-brand-plum">{highlight}</span>
      {headline.slice(index + highlight.length)}
    </>
  );
}
