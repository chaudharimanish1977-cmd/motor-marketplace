/**
 * /insurance/city/[slug] — templated SEO landing page, one per city.
 *
 * Editorial vocabulary mirrors /about and /sample-review: serif
 * masthead with italic-plum highlight, mono kicker, three-finding
 * editorial block, italic verdict pull-quote, plum pill CTA.
 *
 * Data lives in src/lib/cities.ts. Append a CityProfile to that
 * array and a new static page goes live at the next deploy — sitemap
 * picks up the slug automatically.
 *
 * Three SEO jobs this page does:
 *   1. Indexable for "car insurance Mumbai" / "Delhi NCR motor
 *      insurance" / similar high-intent queries.
 *   2. Editorial proof — visitor sees the kind of locally credible
 *      thinking that goes into an actual audit, before uploading.
 *   3. Funnel to /upload — the primary CTA at the bottom of every
 *      city page.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoadingLink } from "@/components/loading-link";
import { SketchCarStatic } from "@/components/sketches";
import { CITIES, getCity, getRelatedCities } from "@/lib/cities";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) return {};
  return {
    title: city.seoTitle,
    description: city.seoDescription,
    alternates: {
      canonical: `https://rightoffer.in/insurance/city/${city.slug}`,
    },
    openGraph: {
      title: city.seoTitle,
      description: city.seoDescription,
      type: "article",
      url: `https://rightoffer.in/insurance/city/${city.slug}`,
    },
  };
}

export default async function CityInsurancePage({ params }: PageProps) {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();

  const related = getRelatedCities(slug);

  return (
    <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      {/* Masthead */}
      <header className="border-b border-brand-charcoal/15 pb-5 mb-10">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
          · {city.kicker} ·
        </div>
        <h1 className="font-serif font-medium text-4xl md:text-[44px] leading-[1.08] tracking-[-0.02em] text-balance text-brand-charcoal m-0">
          {renderWithHighlight(city.masthead, city.mastheadHighlight)}
        </h1>
        <p className="mt-4 font-serif italic text-[16px] md:text-[18px] leading-[1.55] text-brand-slate max-w-xl text-balance">
          {city.lede}
        </p>
      </header>

      {/* Decorative mark */}
      <div className="text-brand-plum mb-10 flex justify-center md:justify-start">
        <SketchCarStatic width={120} color="currentColor" />
      </div>

      {/* Three findings */}
      <section className="pl-5 border-l-2 border-brand-plum max-w-xl">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-plum">
          · Three things worth checking ·
        </div>
        <ol className="mt-5 space-y-6 font-serif text-[15.5px] md:text-[16px] leading-[1.65] text-brand-charcoal">
          {city.findings.map((finding, i) => (
            <li key={finding.title} className="flex gap-3">
              <span className="font-mono text-[12px] font-bold text-brand-plum shrink-0 pt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="font-serif font-semibold text-brand-charcoal leading-snug">
                  {finding.title}
                </div>
                <p className="mt-1.5 font-serif text-[15px] leading-[1.6] text-brand-slate">
                  {finding.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Verdict pull-quote */}
      <section className="mt-12 max-w-xl">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] font-bold text-brand-sage mb-3">
          · The verdict ·
        </div>
        <p className="font-serif italic text-[18px] md:text-[20px] leading-[1.5] text-brand-plum text-balance">
          {city.verdict}
        </p>
      </section>

      {/* CTA */}
      <section className="mt-12 pt-10 border-t border-brand-charcoal/15 text-center">
        <p className="font-serif italic text-[17px] text-brand-slate max-w-md mx-auto mb-5">
          Drop your {city.name} policy. We&rsquo;ll read every line and
          come back with what to ask your insurer for at renewal.
        </p>
        <LoadingLink
          href="/upload"
          className="inline-flex items-center gap-1 bg-brand-plum text-brand-offwhite px-6 py-3.5 rounded-full font-serif italic font-medium text-[17px] hover:opacity-90 transition-opacity"
        >
          Get my free 2-minute review <span aria-hidden>→</span>
        </LoadingLink>
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage">
          · Free · Independent · No sales calls ·
        </p>
      </section>

      {/* Related cities (only renders if any) */}
      {related.length > 0 && (
        <section className="mt-14 pt-8 border-t border-brand-charcoal/15">
          <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-5">
            · Other city briefs ·
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map((other) => (
              <Link
                key={other.slug}
                href={`/insurance/city/${other.slug}`}
                className="group block rounded-xl border border-brand-charcoal/15 hover:border-brand-plum/40 transition-colors px-5 py-4 bg-brand-surface"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-sage mb-2">
                  · {other.kicker} ·
                </div>
                <div className="font-serif font-semibold text-lg leading-[1.2] tracking-[-0.015em] text-brand-charcoal group-hover:text-brand-plum transition-colors">
                  {other.name}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-slate">
                  {other.state}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-12 pt-6 border-t border-brand-charcoal/15 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
        <Link href="/" className="text-brand-plum hover:underline">
          ← Back to RightOffer
        </Link>
      </footer>
    </article>
  );
}

/** Wrap a verbatim phrase inside a headline in italic-plum.
 *  Falls back to plain headline if the phrase isn't present
 *  (defensive — keeps the page rendering even if content drifts). */
function renderWithHighlight(
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
