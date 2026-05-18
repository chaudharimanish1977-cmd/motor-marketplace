/**
 * /insurance/car/[slug] — templated SEO landing page, one per model.
 *
 * Same editorial vocabulary as the city page (/insurance/city/[slug]):
 * serif masthead, mono kicker, three-finding block, italic verdict,
 * plum pill CTA. Different body-type sketch per model.
 *
 * Data lives in src/lib/vehicles.ts. Append a VehicleProfile and the
 * route + sitemap entry come for free at next deploy.
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
  VEHICLES,
  getVehicle,
  getRelatedVehicles,
  type VehicleBody,
} from "@/lib/vehicles";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Map our richer body-type vocabulary onto the three sketch primitives
 *  the brand already ships (hatchback / sedan / SUV). Tall-hatch falls
 *  to hatchback, micro/compact SUV falls to SUV, MPV falls to SUV. */
function sketchFor(bodyType: VehicleBody) {
  switch (bodyType) {
    case "hatchback":
    case "tall-hatchback":
      return SketchHatchback;
    case "compact-suv":
    case "micro-suv":
    case "suv":
    case "mpv":
      return SketchSUV;
    case "sedan":
    default:
      return SketchSedan;
  }
}

export async function generateStaticParams() {
  return VEHICLES.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicle(slug);
  if (!vehicle) return {};
  return {
    title: vehicle.seoTitle,
    description: vehicle.seoDescription,
    alternates: {
      canonical: `https://rightoffer.in/insurance/car/${vehicle.slug}`,
    },
    openGraph: {
      title: vehicle.seoTitle,
      description: vehicle.seoDescription,
      type: "article",
      url: `https://rightoffer.in/insurance/car/${vehicle.slug}`,
    },
  };
}

export default async function VehicleInsurancePage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = getVehicle(slug);
  if (!vehicle) notFound();

  const related = getRelatedVehicles(slug);
  const Sketch = sketchFor(vehicle.bodyType);

  return (
    <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      {/* Masthead */}
      <header className="border-b border-brand-charcoal/15 pb-5 mb-10">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
          · {vehicle.kicker} ·
        </div>
        <h1 className="font-serif font-medium text-4xl md:text-[44px] leading-[1.08] tracking-[-0.02em] text-balance text-brand-charcoal m-0">
          {renderWithHighlight(vehicle.masthead, vehicle.mastheadHighlight)}
        </h1>
        <p className="mt-4 font-serif italic text-[16px] md:text-[18px] leading-[1.55] text-brand-slate max-w-xl text-balance">
          {vehicle.lede}
        </p>
      </header>

      {/* Body-type sketch */}
      <div className="mt-2 mb-10 flex justify-center text-brand-sage">
        <Sketch width={260} color="currentColor" />
      </div>

      {/* Three findings */}
      <section className="pl-5 border-l-2 border-brand-plum max-w-xl">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-plum">
          · Three things most owners overlook ·
        </div>
        <ol className="mt-5 space-y-6 font-serif text-[15.5px] md:text-[16px] leading-[1.65] text-brand-charcoal">
          {vehicle.findings.map((finding, i) => (
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
          {vehicle.verdict}
        </p>
      </section>

      {/* CTA */}
      <section className="mt-12 pt-10 border-t border-brand-charcoal/15 text-center">
        <p className="font-serif italic text-[17px] text-brand-slate max-w-md mx-auto mb-5">
          Drop your {vehicle.make} {vehicle.model} policy. We&rsquo;ll
          read every line and tell you exactly what to ask your insurer
          for at renewal.
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

      {/* Related vehicles (only renders if any) */}
      {related.length > 0 && (
        <section className="mt-14 pt-8 border-t border-brand-charcoal/15">
          <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage mb-5">
            · Other vehicle briefs ·
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map((other) => (
              <Link
                key={other.slug}
                href={`/insurance/car/${other.slug}`}
                className="group block rounded-xl border border-brand-charcoal/15 hover:border-brand-plum/40 transition-colors px-5 py-4 bg-brand-surface"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-sage mb-2">
                  · {other.kicker} ·
                </div>
                <div className="font-serif font-semibold text-lg leading-[1.2] tracking-[-0.015em] text-brand-charcoal group-hover:text-brand-plum transition-colors">
                  {other.make} {other.model}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-slate">
                  {other.bodyType.replace(/-/g, " ")}
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
 *  Falls back to plain headline if the phrase isn't present. */
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
