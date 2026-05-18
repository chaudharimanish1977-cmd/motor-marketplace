import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Glossary — RightOffer",
  description:
    "Plain-English definitions of every motor-insurance term RightOffer uses — IDV, NCB, Own Damage, Third Party, Zero Depreciation, Engine Protection, and more.",
};

/**
 * /glossary — plain-English dictionary of every motor-insurance term
 * RightOffer uses. Linked from the small "Glossary" affordance on the
 * report footer, and from inline <GlossaryTerm> chips that customers
 * tap when they want the longer story.
 */
export default function GlossaryPage() {
  const entries = Object.entries(GLOSSARY).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      {/* Masthead */}
      <header className="border-b border-brand-charcoal/15 pb-5 mb-10">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
          · Glossary ·
        </div>
        <h1 className="font-serif font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
          Plain-English{" "}
          <span className="italic text-brand-plum">definitions</span>
        </h1>
        <p className="mt-3 font-serif italic text-[15px] md:text-[17px] leading-[1.55] text-brand-slate max-w-xl">
          Every motor-insurance term we use in your audit — explained
          without jargon. Most read in under a minute.
        </p>
      </header>

      {/* Terms */}
      <dl className="space-y-8">
        {entries.map(([term, entry]) => (
          <div
            key={term}
            id={term.toLowerCase().replace(/\s+/g, "-")}
            className="scroll-mt-12"
          >
            <dt>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-plum font-bold">
                · {entry.full} ·
              </div>
              <h2 className="mt-1 font-serif font-medium text-[24px] md:text-[28px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
                {term}
              </h2>
            </dt>
            <dd className="mt-3 font-serif text-[15px] md:text-[16px] leading-[1.65] text-brand-charcoal max-w-xl">
              {entry.long ?? entry.short}
            </dd>
          </div>
        ))}
      </dl>

      <footer className="mt-12 pt-6 border-t border-brand-charcoal/15 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
        <Link href="/" className="text-brand-plum hover:underline">
          ← Back to RightOffer
        </Link>
      </footer>
    </article>
  );
}
