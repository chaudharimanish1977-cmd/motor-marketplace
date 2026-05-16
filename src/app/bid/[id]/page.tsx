import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { findById, findOne, findMany, Tables } from "@/lib/db";
import type { ParsedPolicy, PolicyReport, RFQ } from "@/lib/types";
import { BundleBuilder } from "@/components/bundle-builder";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BidPage({ params }: PageProps) {
  const { id } = await params;

  const parsedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    id
  );
  if (!parsedPolicy) notFound();

  const report = await findOne<PolicyReport>(
    Tables.REPORTS,
    (r) => r.parsedPolicyId === id
  );
  if (!report) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="space-y-3 max-w-md">
          <h1 className="text-xl font-bold">Report not ready</h1>
          <p className="text-slate-600">
            We need to generate your policy review first.
          </p>
          <Link
            href={`/report/${id}`}
            className="inline-block px-6 py-2 bg-brand-navy text-white rounded-lg"
          >
            Go to Report
          </Link>
        </div>
      </main>
    );
  }

  // Look up the latest RFQ for this policy so the bundle builder can
  // pre-populate the customer's previous selections (when they came back
  // to customize). If no prior RFQ exists, BundleBuilder uses recommendation
  // defaults.
  const priorRfqs = await findMany<RFQ>(
    Tables.RFQS,
    (r) => r.parsedPolicyId === id
  );
  const latestRfq = priorRfqs.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )[0];
  const previousSelections = latestRfq?.desiredAddOns;

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <Link
        href={`/report/${id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-navy mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to report
      </Link>

      <div className="space-y-3 mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-navy bg-brand-navy/15 rounded-full">
          <Sparkles className="w-3 h-3" />
          Step 2 of 3 · Build Your Bundle
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-ink">
          {previousSelections ? "Customize Your Cover" : "Curate Your Cover"}
        </h1>
        <p className="text-slate-600 text-lg">
          {previousSelections
            ? "Adjust your add-ons and we'll re-quote across all 3 tiers (Basic / Recommended / Super)."
            : `We've pre-selected the right add-ons for your ${new Date().getFullYear() - parsedPolicy.vehicle.yearOfManufacture}-year-old ${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}. Toggle anything you want, then we'll get 3 tiers of offers from 3 insurers.`}
        </p>
      </div>

      <BundleBuilder
        parsedPolicy={parsedPolicy}
        report={report}
        initialSelectedAddOns={previousSelections}
      />
    </main>
  );
}
