import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, CalendarClock, Home, Plus } from "lucide-react";
import { findById, findOne, Tables } from "@/lib/db";
import { PrintButton } from "@/components/print-button";
import { Confetti } from "@/components/confetti";
import { NumberPlate } from "@/components/number-plate";
import type {
  Transaction,
  Bid,
  RFQ,
  ParsedPolicy,
  RenewalSchedule,
} from "@/lib/types";
import { formatINR, formatDateRange } from "@/lib/format";
import { isMarketplaceEnabled } from "@/lib/feature-flags";

function firstName(fullName: string | undefined | null): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] || "there";
}

interface PageProps {
  params: Promise<{ transactionId: string }>;
}

export default async function PolicyPage({ params }: PageProps) {
  // Phase 1 segregation: marketplace UI hidden in production until V2.
  if (!(await isMarketplaceEnabled())) notFound();

  const { transactionId } = await params;

  const transaction = await findById<Transaction>(
    Tables.TRANSACTIONS,
    transactionId
  );
  if (!transaction) notFound();

  const bid = await findById<Bid>(Tables.BIDS, transaction.bidId);
  if (!bid) notFound();
  const rfq = await findById<RFQ>(Tables.RFQS, bid.rfqId);
  if (!rfq) notFound();
  const parsedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    rfq.parsedPolicyId
  );
  if (!parsedPolicy) notFound();

  const schedule = await findOne<RenewalSchedule>(
    Tables.RENEWAL_SCHEDULES,
    (s) => s.parsedPolicyId === parsedPolicy.id
  );

  const issuedAt = new Date(transaction.issuedAt!);
  const expiry = new Date(issuedAt);
  expiry.setFullYear(expiry.getFullYear() + 1);
  expiry.setHours(23, 59, 59);

  const policyNumber = `MM-${transaction.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-brand-offwhite print:bg-white py-8">
      <Confetti />
      {/* Top action bar (hidden on print) */}
      <div className="max-w-4xl mx-auto px-4 mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-brand-slate hover:text-brand-navy"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
        <div className="flex items-center gap-3">
          {schedule && (
            <Link
              href={`/renewals/${transaction.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy hover:text-brand-navy px-3 py-2 rounded-lg hover:bg-brand-navy/10"
            >
              <CalendarClock className="w-4 h-4" />
              View Renewal Calendar
            </Link>
          )}
          <PrintButton />

        </div>
      </div>

      {/* Success banner (hidden on print) */}
      <div className="max-w-4xl mx-auto px-4 mb-4 print:hidden">
        <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-4 flex items-center gap-4 flex-wrap">
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-bold text-emerald-900">
              You&apos;re covered, {firstName(parsedPolicy.owner.name)}!
            </div>
            <div className="text-sm text-emerald-800">
              Policy doc emailed to{" "}
              {parsedPolicy.owner.email ?? "your registered email"} · SMS sent
              to {parsedPolicy.owner.mobile} · Issued in 4 min 32 sec
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 px-3 py-2 rounded-full hover:bg-emerald-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add another vehicle
          </Link>
        </div>
      </div>

      {/* Policy document */}
      <div className="max-w-4xl mx-auto px-4">
        <article className="bg-white rounded-2xl shadow-lg print:shadow-none print:rounded-none overflow-hidden">
          {/* Insurer letterhead */}
          <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-8 py-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Issued via RightOffer
              </div>
              <div className="text-2xl font-bold mt-0.5">
                {bid.insurerName}
              </div>
              <div className="text-xs text-slate-300 italic">
                {bid.insurerTagline}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Policy Type
              </div>
              <div className="font-semibold mt-0.5">
                Private Car Comprehensive
              </div>
              <div className="text-xs text-slate-300 mt-1">
                IRDAI Reg: DEMO/2026
              </div>
            </div>
          </header>

          {/* Title */}
          <div className="px-8 py-4 bg-brand-offwhite border-b border-brand-light-gray">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-brand-slate">
                Certificate of Insurance Cum Schedule
              </div>
              <div className="text-lg font-bold text-brand-charcoal mt-1">
                Policy No. {policyNumber}
              </div>
            </div>
          </div>

          {/* Insured & Vehicle Details */}
          <section className="px-8 py-6 grid md:grid-cols-2 gap-6 border-b border-brand-light-gray">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-brand-slate font-bold mb-3">
                Insured
              </h3>
              <div className="space-y-1.5 text-sm">
                <FieldRow label="Name" value={parsedPolicy.owner.name} />
                <FieldRow label="Mobile" value={parsedPolicy.owner.mobile} />
                {parsedPolicy.owner.email && (
                  <FieldRow label="Email" value={parsedPolicy.owner.email} />
                )}
                <FieldRow
                  label="Address"
                  value={parsedPolicy.owner.address}
                  multiline
                />
              </div>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider text-brand-slate font-bold mb-3">
                Vehicle
              </h3>
              <div className="mb-3">
                <NumberPlate
                  value={parsedPolicy.vehicle.registrationNumber}
                  size="md"
                />
              </div>
              <div className="space-y-1.5 text-sm">
                <FieldRow
                  label="Make / Model"
                  value={`${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`}
                />
                <FieldRow
                  label="Variant"
                  value={parsedPolicy.vehicle.variant}
                />
                <FieldRow
                  label="Year"
                  value={String(parsedPolicy.vehicle.yearOfManufacture)}
                />
                <FieldRow label="RTO" value={parsedPolicy.vehicle.rto} />
                <FieldRow
                  label="Fuel"
                  value={parsedPolicy.vehicle.fuelType}
                />
                {parsedPolicy.vehicle.engineNumber && (
                  <FieldRow
                    label="Engine No"
                    value={parsedPolicy.vehicle.engineNumber}
                  />
                )}
              </div>
            </div>
          </section>

          {/* Policy Period & IDV */}
          <section className="px-8 py-5 border-b border-brand-light-gray grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-brand-slate font-bold mb-1">
                Period of Insurance
              </div>
              <div className="text-sm font-semibold">
                {formatDateRange(
                  issuedAt.toISOString(),
                  expiry.toISOString()
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-brand-slate font-bold mb-1">
                IDV
              </div>
              <div className="text-lg font-bold text-emerald-700">
                {formatINR(rfq.desiredIdv)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-brand-slate font-bold mb-1">
                NCB
              </div>
              <div className="text-lg font-bold text-emerald-700">
                {parsedPolicy.ncbPercent}%
              </div>
            </div>
          </section>

          {/* Premium Computation */}
          <section className="px-8 py-6 border-b border-brand-light-gray">
            <h3 className="text-xs uppercase tracking-wider text-brand-slate font-bold mb-3">
              Premium Computation
            </h3>
            <div className="border border-brand-light-gray rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-brand-light-gray">
                  <PremiumRow
                    label="Basic Own Damage (after NCB)"
                    value={bid.basicOd}
                  />
                  <PremiumRow label="Basic Third Party" value={bid.basicTp} />
                  <PremiumRow
                    label="Add-ons selected"
                    value={bid.addOnPremium}
                    sub={rfq.desiredAddOns.join(", ") || "None"}
                  />
                  <PremiumRow
                    label="Total Package Premium"
                    value={bid.totalPackage}
                    bold
                  />
                  <PremiumRow label="CGST @ 9%" value={bid.cgst} />
                  <PremiumRow label="SGST @ 9%" value={bid.sgst} />
                  <PremiumRow
                    label="GRAND TOTAL"
                    value={bid.grandTotal}
                    bold
                    highlight
                  />
                </tbody>
              </table>
            </div>
          </section>

          {/* Add-ons covered */}
          {rfq.desiredAddOns.length > 0 && (
            <section className="px-8 py-5 border-b border-brand-light-gray">
              <h3 className="text-xs uppercase tracking-wider text-brand-slate font-bold mb-3">
                Add-ons Included
              </h3>
              <div className="flex flex-wrap gap-2">
                {rfq.desiredAddOns.map((a) => (
                  <span
                    key={a}
                    className="px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="px-8 py-6 bg-brand-offwhite text-xs text-brand-slate space-y-2">
            <p>
              <strong>Issued via RightOffer</strong> on behalf of{" "}
              {bid.insurerName}, an IRDAI-licensed general insurer.
            </p>
            <p>
              For claims: contact {bid.insurerName} directly at their
              published claims helpline. RightOffer provides claim
              tracking dashboard and escalation support.
            </p>
            <p>
              <strong>Disclaimer (Demo):</strong> This is a prototype
              policy document for demonstration purposes only and does NOT
              constitute an actual insurance contract. No real coverage is in
              force.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "" : "flex gap-2"}>
      <span className="text-brand-slate shrink-0">{label}:</span>
      <span className="text-brand-charcoal font-medium">{value}</span>
    </div>
  );
}

function PremiumRow({
  label,
  value,
  sub,
  bold = false,
  highlight = false,
}: {
  label: string;
  value: number;
  sub?: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? "bg-emerald-50" : ""}>
      <td className="px-4 py-2.5">
        <div className={bold ? "font-bold" : ""}>{label}</div>
        {sub && (
          <div className="text-xs text-brand-slate mt-0.5">{sub}</div>
        )}
      </td>
      <td
        className={`px-4 py-2.5 text-right ${
          bold ? "font-bold" : ""
        } ${highlight ? "text-emerald-700 text-base" : ""}`}
      >
        {formatINR(value)}
      </td>
    </tr>
  );
}
