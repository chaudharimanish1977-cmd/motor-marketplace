/**
 * ShellQuotesOpen — returning visitor whose policy is in the renewal
 * window (State A, ≤60 days). The quote market is open.
 *
 * Phase 3 wires the marketplace panel and the quote stack:
 *   1. Hero: petrol-pump masthead with State-A copy.
 *   2. Current cover summary (vehicle/insurer/RTO).
 *   3. MarketplacePanel: three deterministic synthetic offers, anchored
 *      on the customer's policy.
 *   4. QuoteStack: where the customer's own collected quotes accumulate
 *      (up to 3), with "Run the review" CTA wiring the comparator.
 *   5. Footer escape: see existing report.
 *
 * Server-renderable — generates offers via pure transform, then renders.
 * Sub-components (LoadingLink, QuoteStack) handle their own client
 * interactivity.
 */

import { LoadingLink } from "@/components/loading-link";
import { SketchPetrolPump } from "@/components/sketches-scenes";
import type { ParsedPolicy } from "@/lib/types";
import type { LifecycleResult } from "@/lib/lifecycle-state";
import {
  generateMarketplaceOffers,
  type MarketplaceOffer,
} from "@/lib/marketplace-offers";
import { MarketplacePanel } from "./marketplace-panel";
import { QuoteStack } from "./quote-stack";

interface ShellQuotesOpenProps {
  policy: ParsedPolicy;
  lifecycle: LifecycleResult;
  /** Every parsed doc on this visitor's file. The shell filters to
   *  `documentType === "quote"` rows for the stack. Defaults to []. */
  visitorDocs?: ParsedPolicy[];
}

export function ShellQuotesOpen({
  policy,
  lifecycle,
  visitorDocs = [],
}: ShellQuotesOpenProps) {
  const vehicleLabel = `${policy.vehicle.make} ${policy.vehicle.model}`.trim();
  const daysUntil = lifecycle.daysUntilExpiry ?? 0;
  const reportHref = `/report/${policy.id}`;

  // Customer-supplied quotes only — exclude the policy itself and any
  // legacy rows that lack a documentType.
  const customerQuotes = visitorDocs.filter(
    (d) => d.documentType === "quote" && d.id !== policy.id
  );

  // Synthesise the marketplace panel server-side. Deterministic, so the
  // same customer sees the same 3 offers across refreshes.
  const offers = generateMarketplaceOffers(policy);

  // Reserve CTAs route through the report page, which is where checkout
  // intent is captured in V1. The offer ID rides along as a query param
  // so a future checkout / KYC page can preselect the chosen tier.
  const reserveHrefFor = (offer: MarketplaceOffer) =>
    `${reportHref}?offer=${offer.id}`;

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* Masthead — petrol-pump metaphor lives here per DESIGN-LANGUAGE.md */}
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-3">
        · Renewal window open · {daysUntil} day{daysUntil === 1 ? "" : "s"} ·
      </div>

      <h1 className="font-serif font-medium text-3xl md:text-5xl tracking-[-0.02em] leading-[1.08] text-brand-charcoal m-0">
        Time to{" "}
        <span className="italic text-brand-plum">top up your cover.</span>
      </h1>

      <p className="mt-3 font-serif italic text-[15px] md:text-lg text-brand-slate max-w-xl leading-[1.55]">
        Your {vehicleLabel} renews in {daysUntil} days. We&apos;ve pulled
        three fresh offers below — and if you&apos;ve collected quotes
        elsewhere, drop them in the stack so we can compare side-by-side.
      </p>

      {/* Petrol-pump scene — anchors the renewal moment */}
      <div className="mt-7 rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-5 md:px-7 py-6 flex justify-center text-brand-plum">
        <SketchPetrolPump width={360} color="currentColor" />
      </div>

      {/* Vehicle / insurer summary */}
      <section className="mt-6 rounded-2xl bg-brand-offwhite border border-brand-charcoal/15 px-5 py-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
          · Your current cover ·
        </div>
        <div className="mt-1 font-serif font-semibold text-lg tracking-[-0.015em] text-brand-charcoal">
          {vehicleLabel} · {policy.vehicle.yearOfManufacture}
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-slate">
          {policy.insurerName} · {policy.vehicle.rto}
        </div>
      </section>

      {/* Three RightOffer Picks */}
      <MarketplacePanel offers={offers} reserveHrefFor={reserveHrefFor} />

      {/* Customer-supplied quote stack */}
      <QuoteStack
        quotes={customerQuotes}
        anchorPolicyId={policy.id}
        maxQuotes={3}
      />

      {/* Footer: re-read existing review */}
      <div className="mt-9 text-center">
        <LoadingLink
          href={reportHref}
          className="inline-flex items-center justify-center gap-1 font-serif italic text-[14px] text-brand-slate hover:text-brand-charcoal transition-colors"
        >
          See your full review &amp; offers <span aria-hidden>→</span>
        </LoadingLink>
      </div>
    </main>
  );
}
