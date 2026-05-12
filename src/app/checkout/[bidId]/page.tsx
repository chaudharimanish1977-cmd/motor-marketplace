import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { findById, Tables } from "@/lib/db";
import type { Bid, ParsedPolicy, RFQ } from "@/lib/types";
import { CheckoutFlow } from "@/components/checkout-flow";
import { NumberPlate } from "@/components/number-plate";

function firstName(fullName: string | undefined | null): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] || "there";
}

interface PageProps {
  params: Promise<{ bidId: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
          <Link
            href={`/bid/${parsedPolicy.id}/results?rfq=${rfq.id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-navy"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to offers
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {parsedPolicy.vehicle.make} {parsedPolicy.vehicle.model}
            </span>
            <NumberPlate
              value={parsedPolicy.vehicle.registrationNumber}
              size="sm"
            />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-brand-ink">
            Almost there, {firstName(parsedPolicy.owner.name)}
          </h1>
          <p className="text-slate-600">
            Quick KYC + payment, then your policy is issued in &lt; 5
            minutes.
          </p>
        </div>

        <CheckoutFlow parsedPolicy={parsedPolicy} bid={bid} />
      </div>
    </main>
  );
}
