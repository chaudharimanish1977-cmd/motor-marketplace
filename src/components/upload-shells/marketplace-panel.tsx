/**
 * MarketplacePanel — the 3-offer card stack that appears in
 * ShellQuotesOpen during the renewal window.
 *
 * Pure render. Server-renderable. No interactivity beyond the
 * Reserve link, which lands on the comparator (a future Phase 4
 * destination will lift this into a checkout flow).
 *
 * Visual rhythm:
 *
 *   · Three offers from our partners ·            ← mono kicker
 *   ┌────────────┐ ┌────────────┐ ┌────────────┐
 *   │ Lean       │ │ Balanced   │ │ Premium    │  ← three cards
 *   │ Vahana     │ │ BharatSure │ │ Suraksha   │
 *   │ ₹X,XXX     │ │ ₹X,XXX     │ │ ₹X,XXX     │
 *   │ usp blurb  │ │ usp blurb  │ │ usp blurb  │
 *   │ [Reserve]  │ │ [Reserve]  │ │ [Reserve]  │
 *   └────────────┘ └────────────┘ └────────────┘
 *   · Indicative — final terms at purchase ·
 */

import { LoadingLink } from "@/components/loading-link";
import {
  formatINR,
  type MarketplaceOffer,
  type MarketplaceTier,
} from "@/lib/marketplace-offers";

interface MarketplacePanelProps {
  offers: MarketplaceOffer[];
  /** Where each Reserve CTA points — typically the report/comparator URL
   *  for the anchor policy, with the offer ID appended as a query param. */
  reserveHrefFor: (offer: MarketplaceOffer) => string;
}

/* ─── Tier ribbon colour map ────────────────────────────────────────── */

const TIER_RIBBON: Record<
  MarketplaceTier,
  { border: string; text: string }
> = {
  lean: {
    border: "border-brand-sage/40",
    text: "text-brand-sage",
  },
  balanced: {
    border: "border-brand-plum/40",
    text: "text-brand-plum",
  },
  premium: {
    border: "border-brand-coral/40",
    text: "text-brand-coral",
  },
};

export function MarketplacePanel({
  offers,
  reserveHrefFor,
}: MarketplacePanelProps) {
  if (offers.length === 0) return null;

  return (
    <section className="mt-9">
      {/* Kicker */}
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
        · Three offers from our partners ·
      </div>
      <h2 className="mt-1 font-serif font-medium text-xl md:text-3xl tracking-[-0.018em] leading-[1.12] text-brand-charcoal">
        Fresh quotes,{" "}
        <span className="italic text-brand-plum">stitched for your car.</span>
      </h2>
      <p className="mt-2 font-serif italic text-[14px] md:text-base text-brand-slate max-w-xl leading-[1.55]">
        Three tiers, three insurers — same IDV, different appetite for
        add-ons. Pick the one that matches yours.
      </p>

      {/* Card row */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            href={reserveHrefFor(offer)}
          />
        ))}
      </div>

      {/* Indicative disclosure */}
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate text-center">
        · Indicative offers · final terms at purchase ·
      </p>
    </section>
  );
}

/* ─── Single offer card ─────────────────────────────────────────────── */

interface OfferCardProps {
  offer: MarketplaceOffer;
  href: string;
}

function OfferCard({ offer, href }: OfferCardProps) {
  const ribbon = TIER_RIBBON[offer.tier];
  return (
    <article
      className={`rounded-2xl bg-brand-offwhite border ${ribbon.border} p-5 flex flex-col`}
    >
      {/* Tier ribbon */}
      <div
        className={`font-mono text-[9.5px] uppercase tracking-[0.18em] font-bold ${ribbon.text}`}
      >
        · {offer.tierLabel} ·
      </div>

      {/* Insurer */}
      <div className="mt-2 font-serif font-semibold text-lg tracking-[-0.015em] text-brand-charcoal">
        {offer.insurerName}
      </div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-slate">
        {offer.tagline}
      </div>

      {/* Price */}
      <div className="mt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
          · Annual premium ·
        </div>
        <div className="mt-1 font-serif font-semibold text-2xl tracking-[-0.02em] text-brand-charcoal">
          ₹{formatINR(offer.grandTotal)}
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-slate">
          IDV ₹{formatINR(offer.idv)} · incl. GST
        </div>
      </div>

      {/* Included add-ons */}
      <div className="mt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
          · Included ·
        </div>
        <ul className="mt-1.5 text-[13px] font-serif text-brand-charcoal leading-relaxed space-y-0.5">
          {offer.includedAddOns.slice(0, 5).map((a) => (
            <li key={a}>· {a}</li>
          ))}
          {offer.includedAddOns.length > 5 && (
            <li className="text-brand-slate italic">
              · +{offer.includedAddOns.length - 5} more
            </li>
          )}
        </ul>
      </div>

      {/* Trust metrics */}
      <div className="mt-4 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-slate">
        <div>
          <div className="text-brand-charcoal font-bold">
            {offer.claimSettlementRatio.toFixed(1)}%
          </div>
          claim settled
        </div>
        <div>
          <div className="text-brand-charcoal font-bold">
            {formatINR(offer.cashlessNetworkSize)}
          </div>
          cashless
        </div>
      </div>

      {/* USP */}
      <p className="mt-4 font-serif italic text-[13px] text-brand-slate leading-snug">
        {offer.usp}
      </p>

      {/* CTA */}
      <LoadingLink
        href={href}
        className="mt-5 inline-flex items-center justify-center gap-1 bg-brand-plum text-brand-offwhite px-4 py-3 rounded-full font-serif italic font-medium text-[14px] min-h-[44px] hover:opacity-90 transition-opacity"
      >
        Reserve this offer <span aria-hidden>→</span>
      </LoadingLink>
    </article>
  );
}
