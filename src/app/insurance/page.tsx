/**
 * /insurance — index/hub for all the editorial SEO landing pages.
 *
 * Two grids: one for city briefs (src/lib/cities.ts), one for vehicle
 * briefs (src/lib/vehicles.ts). Each card links into the relevant
 * /insurance/city/[slug] or /insurance/car/[slug] page.
 *
 * SEO function: hub-and-spoke internal linking. Google ranks pages
 * better when they're a click from a well-linked hub; this is that
 * hub. Adding a new entry to either lib file auto-shows it here.
 *
 * Visitor function: a discovery surface for the kind of locally-credible
 * thinking that goes into a RightOffer audit, before they upload.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import { CITIES } from "@/lib/cities";
import { VEHICLES } from "@/lib/vehicles";

export const metadata: Metadata = {
  title: "Motor insurance briefs — by city and by car",
  description:
    "Editorial guides to car insurance across India: ten city briefs (Mumbai to Lucknow) and five best-selling car briefs (Swift to Brezza). Free, independent, no sales calls.",
  alternates: { canonical: "https://rightoffer.in/insurance" },
  openGraph: {
    title: "Motor insurance briefs — by city and by car",
    description:
      "Editorial guides to car insurance across India: ten city briefs and five best-selling car briefs.",
    type: "website",
    url: "https://rightoffer.in/insurance",
  },
};

export default function InsuranceHubPage() {
  return (
    <article className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      {/* Masthead */}
      <header className="border-b border-brand-charcoal/15 pb-5 mb-10">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
          · The briefs ·
        </div>
        <h1 className="font-serif font-medium text-4xl md:text-[44px] leading-[1.08] tracking-[-0.02em] text-balance text-brand-charcoal m-0">
          Motor insurance, read{" "}
          <span className="italic text-brand-plum">city by city, car by car.</span>
        </h1>
        <p className="mt-4 font-serif italic text-[16px] md:text-[18px] leading-[1.55] text-brand-slate max-w-2xl text-balance">
          Short editorial briefs on what locally matters — the monsoon
          trap in Mumbai, the PUC trap in Delhi, the ADAS bumper trap
          on a Creta. Free to read; the audit itself takes two minutes.
        </p>
      </header>

      {/* City grid */}
      <section className="mb-14">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-plum mb-5">
          · By city · {CITIES.length} briefs ·
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/insurance/city/${city.slug}`}
              className="group block rounded-xl border border-brand-charcoal/15 hover:border-brand-plum/40 hover:bg-brand-surface transition-colors px-5 py-4"
            >
              <div className="font-serif font-semibold text-[18px] leading-[1.2] tracking-[-0.015em] text-brand-charcoal group-hover:text-brand-plum transition-colors">
                {city.name}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-slate">
                {city.state}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Vehicle grid */}
      <section className="mb-14">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-plum mb-5">
          · By car · {VEHICLES.length} briefs ·
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {VEHICLES.map((vehicle) => (
            <Link
              key={vehicle.slug}
              href={`/insurance/car/${vehicle.slug}`}
              className="group block rounded-xl border border-brand-charcoal/15 hover:border-brand-plum/40 hover:bg-brand-surface transition-colors px-5 py-4"
            >
              <div className="font-serif font-semibold text-[18px] leading-[1.2] tracking-[-0.015em] text-brand-charcoal group-hover:text-brand-plum transition-colors">
                {vehicle.make} {vehicle.model}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-slate">
                {vehicle.bodyType.replace(/-/g, " ")}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-4 pt-10 border-t border-brand-charcoal/15 text-center">
        <p className="font-serif italic text-[17px] text-brand-slate max-w-md mx-auto mb-5">
          The briefs cover what generally matters. The audit covers what
          matters in <em className="italic text-brand-plum">your</em>{" "}
          policy.
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

      <footer className="mt-12 pt-6 border-t border-brand-charcoal/15 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
        <Link href="/" className="text-brand-plum hover:underline">
          ← Back to RightOffer
        </Link>
      </footer>
    </article>
  );
}
