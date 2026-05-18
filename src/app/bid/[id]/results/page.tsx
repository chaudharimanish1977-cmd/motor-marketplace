import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { findById, findOne, findMany, Tables } from "@/lib/db";
import type {
  ParsedPolicy,
  RFQ,
  Bid,
  PolicyReport,
  TierSummary,
  BidTier,
} from "@/lib/types";
import { BidResults } from "@/components/bid-results";
import { isMarketplaceEnabled } from "@/lib/feature-flags";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rfq?: string }>;
}

const TIER_LABELS: Record<BidTier, string> = {
  1: "Same-Price",
  2: "Comfort+",
  3: "Super Cover",
};

export default async function ResultsPage({
  params,
  searchParams,
}: PageProps) {
  // Phase 1 segregation: marketplace UI hidden in production until V2.
  if (!isMarketplaceEnabled()) notFound();

  const { id } = await params;
  const { rfq: rfqQueryId } = await searchParams;

  const parsedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    id
  );
  if (!parsedPolicy) notFound();

  const report = await findOne<PolicyReport>(
    Tables.REPORTS,
    (r) => r.parsedPolicyId === id
  );

  // Locate the RFQ (explicit query param wins; otherwise latest for this policy)
  let rfq: RFQ | null = null;
  if (rfqQueryId) {
    rfq = await findById<RFQ>(Tables.RFQS, rfqQueryId);
  }
  if (!rfq) {
    const allRfqs = await findMany<RFQ>(
      Tables.RFQS,
      (r) => r.parsedPolicyId === id
    );
    rfq = allRfqs.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )[0];
  }

  if (!rfq) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="space-y-3 max-w-md">
          <h1 className="text-xl font-bold">No bids requested yet</h1>
          <p className="text-slate-600">
            Curate your bundle first to receive offers.
          </p>
          <Link
            href={`/bid/${id}`}
            className="inline-block px-6 py-2 bg-brand-navy text-white rounded-lg"
          >
            Curate My Bundle
          </Link>
        </div>
      </main>
    );
  }

  const allBids = await findMany<Bid>(
    Tables.BIDS,
    (b) => b.rfqId === rfq.id
  );

  if (allBids.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="space-y-3 max-w-md">
          <h1 className="text-xl font-bold">No bids found</h1>
          <p className="text-slate-600">
            Something went wrong with the auction. Please try again.
          </p>
          <Link
            href={`/bid/${id}`}
            className="inline-block px-6 py-2 bg-brand-navy text-white rounded-lg"
          >
            Re-curate
          </Link>
        </div>
      </main>
    );
  }

  // Group bids by tier and rebuild TierSummary objects.
  const tiers: TierSummary[] = ([1, 2, 3] as BidTier[]).map((tierNum) => {
    const tierBids = allBids
      .filter((b) => b.tier === tierNum)
      .sort((a, b) => a.rank - b.rank);

    if (tierBids.length === 0) {
      return {
        tier: tierNum,
        label: TIER_LABELS[tierNum],
        tagline: "",
        available: false,
        unavailableReason:
          "This tier was not generated for your profile. Your current cover may already be at the price floor.",
        includedAddOns: [],
        bids: [],
      };
    }

    return {
      tier: tierNum,
      label: tierBids[0].tierLabel || TIER_LABELS[tierNum],
      tagline: tierBids[0].tierTagline || "",
      available: true,
      includedAddOns: tierBids[0].tierIncludedAddOns ?? [],
      bids: tierBids,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href={`/bid/${id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-navy"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to bundle
          </Link>
        </div>
      </header>

      <BidResults
        parsedPolicy={parsedPolicy}
        tiers={tiers}
        rfq={rfq}
        report={report ?? undefined}
      />
    </div>
  );
}
