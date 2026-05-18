import { notFound } from "next/navigation";
import { findById, findOne, Tables } from "@/lib/db";
import type {
  Bid,
  RFQ,
  ParsedPolicy,
  PolicyReport,
} from "@/lib/types";
import { OfferDetail } from "@/components/offer-detail";
import { isMarketplaceEnabled } from "@/lib/feature-flags";

interface PageProps {
  params: Promise<{ bidId: string }>;
}

export default async function OfferPage({ params }: PageProps) {
  // Phase 1 segregation: marketplace UI hidden in production until V2.
  if (!isMarketplaceEnabled()) notFound();

  const { bidId } = await params;

  const bid = await findById<Bid>(Tables.BIDS, bidId);
  if (!bid) notFound();

  const rfq = await findById<RFQ>(Tables.RFQS, bid.rfqId);
  if (!rfq) notFound();

  const parsedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    rfq.parsedPolicyId
  );
  if (!parsedPolicy) notFound();

  const report = await findOne<PolicyReport>(
    Tables.REPORTS,
    (r) => r.parsedPolicyId === rfq.parsedPolicyId
  );

  return (
    <OfferDetail
      parsedPolicy={parsedPolicy}
      bid={bid}
      rfq={rfq}
      report={report ?? undefined}
    />
  );
}
