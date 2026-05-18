/**
 * /sample-review — index of the three published sample reviews.
 *
 * A magazine-style "back issues" page. Each sample is presented as a
 * compact editorial card with its issue number, profile lens, headline,
 * vehicle/insurer line, and a "Read this review →" link.
 *
 * Visitors land here from the home page's "or see a sample review"
 * link, from the SAMPLE footer link, or from organic search (each
 * sample page has SEO copy).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import { SAMPLE_REVIEWS } from "@/lib/sample-reviews";

export const metadata: Metadata = {
  title: "Sample reviews",
  description:
    "Three anonymised RightOffer reviews — Maruti Swift, Hyundai Creta, Honda City — covering the three customer profiles we see most often: premium-saving, coverage-improving, and balanced.",
};

export default function SampleReviewsIndexPage() {
  return (
    <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      {/* Masthead */}
      <header className="border-b border-brand-charcoal/15 pb-5 mb-8">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-3">
          · RightOffer · Sample reviews ·
        </div>
        <h1 className="font-serif font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
          Sample{" "}
          <span className="italic text-brand-plum">reviews.</span>
        </h1>
        <p className="mt-3 font-serif italic text-[15.5px] md:text-[17px] leading-[1.55] text-brand-slate max-w-xl">
          Three anonymised reviews from real Indian car owners. Each one
          shows what a RightOffer reading of your policy actually looks
          like — before you upload your own.
        </p>
      </header>

      {/* Cards */}
      <div className="space-y-7">
        {SAMPLE_REVIEWS.map((sample) => (
          <Link
            key={sample.slug}
            href={`/sample-review/${sample.slug}`}
            className="group block rounded-2xl border border-brand-charcoal/15 hover:border-brand-plum/40 transition-colors px-6 py-5 md:px-8 md:py-7 bg-brand-surface"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-plum font-bold">
                Review № {sample.issueNumber}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-sage">
                Lens · {sample.profileLabel}
              </span>
            </div>
            <h2 className="font-serif font-medium text-2xl md:text-[28px] leading-[1.15] tracking-[-0.015em] text-brand-charcoal m-0 mb-3 group-hover:text-brand-plum transition-colors">
              {sample.headline}
            </h2>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-brand-slate">
              {sample.vehicle} · {sample.year} · {sample.city} ·{" "}
              {sample.insurer}
            </p>
            <p className="mt-4 font-serif italic text-sm text-brand-plum">
              Read this review →
            </p>
          </Link>
        ))}
      </div>

      {/* Closing CTA */}
      <div className="mt-12 pt-8 border-t border-brand-charcoal/15 text-center">
        <p className="font-serif italic text-[17px] text-brand-slate max-w-md mx-auto mb-5">
          Ready for a review of your own policy? It takes two minutes,
          costs nothing, and won&apos;t put you on a sales-call list.
        </p>
        <LoadingLink
          href="/upload"
          className="inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-6 py-3.5 rounded-full font-serif italic font-medium text-[17px] hover:opacity-90 transition-opacity"
        >
          Get my free 2-minute review <span aria-hidden>→</span>
        </LoadingLink>
      </div>

      <footer className="mt-12 pt-6 border-t border-brand-charcoal/15 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
        <Link
          href="/"
          className="text-brand-plum hover:underline"
        >
          ← Back to RightOffer
        </Link>
      </footer>
    </article>
  );
}
