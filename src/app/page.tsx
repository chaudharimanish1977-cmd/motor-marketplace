import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  TrendingDown,
  ArrowRight,
  Zap,
} from "lucide-react";
import { readTable, findOne, Tables } from "@/lib/db";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { RenewalPreview } from "@/components/renewal-preview";

// Always re-fetch demo personas at request time so newly-uploaded policies appear
// immediately. Without this, the landing page would snapshot the DB at build time.
export const dynamic = "force-dynamic";

interface DemoPersona {
  parsed: ParsedPolicy;
  report: PolicyReport;
}

async function loadDemoPersonas(): Promise<DemoPersona[]> {
  const all = await readTable<ParsedPolicy>(Tables.PARSED_POLICIES);
  // Only show personas that have a generated report (link will be instant)
  const withReports: DemoPersona[] = [];
  for (const parsed of all) {
    const report = await findOne<PolicyReport>(
      Tables.REPORTS,
      (r) => r.parsedPolicyId === parsed.id
    );
    if (report) {
      withReports.push({ parsed, report });
    }
  }
  // Sort: newest vehicle first (gives natural year progression in cards)
  return withReports.sort(
    (a, b) =>
      b.parsed.vehicle.yearOfManufacture -
      a.parsed.vehicle.yearOfManufacture
  );
}

export default async function Home() {
  const personas = await loadDemoPersonas();

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Eyebrow */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-deepblue bg-blue-50 border border-blue-100 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Policy Review
          </span>
        </div>

        {/* Hero */}
        <div className="space-y-5">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-brand-charcoal leading-[1.05]">
            Smart Review Today.
            <br />
            <span className="bg-gradient-to-r from-brand-deepblue to-brand-electricblue bg-clip-text text-transparent">
              Stronger Protection Tomorrow.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-brand-slate max-w-2xl mx-auto leading-relaxed">
            Upload your existing motor insurance policy. Get an AI-powered
            review of coverage gaps, the right add-ons for your car, and the
            best curated renewal offers from leading insurers —{" "}
            <span className="font-semibold text-brand-deepblue">
              the right insurance in 60 seconds
            </span>
            .
          </p>
        </div>

        {/* Primary CTA — Orange per brand book */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center px-9 py-4 bg-brand-orange hover:brightness-110 text-white font-semibold text-lg rounded-2xl shadow-glow transition-all hover:scale-[1.03]"
          >
            Get My Free Policy Review
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <p className="text-sm text-brand-slate">
            Free • No spam • Your policy data stays private
          </p>
        </div>

        {/* Value props strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto">
          <ValueProp
            icon={ShieldCheck}
            title="Right Coverage"
            description="Know what's missing in your current policy before it's too late."
          />
          <ValueProp
            icon={TrendingDown}
            title="Best Price"
            description="Insurers compete for your business. You get the best curated offer."
          />
          <ValueProp
            icon={Sparkles}
            title="AI-Powered"
            description="30-second analysis of your policy with personalised recommendations."
          />
        </div>
      </div>

      {/* Renewal flywheel teaser */}
      <RenewalPreview />

      {/* Demo personas section — only renders if there are pre-parsed policies */}
      {personas.length > 0 && (
        <section className="mt-24 max-w-5xl w-full">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-orange bg-orange-50 border border-orange-100 rounded-full mb-4">
              <Zap className="w-3 h-3" />
              Quick Demo · Skip Upload
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-charcoal tracking-tight">
              See sample reports
            </h2>
            <p className="text-brand-slate mt-3 max-w-xl mx-auto">
              Click any pre-parsed real policy below to jump straight into the
              full report → bidding → checkout → renewal flow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {personas.slice(0, 3).map(({ parsed, report }) => (
              <PersonaCard
                key={parsed.id}
                parsed={parsed}
                report={report}
              />
            ))}
          </div>
        </section>
      )}

      {/* Footer note */}
      <p className="text-xs text-brand-slate/70 pt-16 text-center max-w-md">
        Motor Marketplace — Private Car Insurance Renewals · Powered by AI ·
        Made for India
      </p>
    </main>
  );
}

// ============================================================================
// Value prop
// ============================================================================

function ValueProp({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-brand-deepblue to-brand-electricblue flex items-center justify-center shadow-soft">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-brand-charcoal">{title}</h3>
      <p className="text-sm text-brand-slate leading-relaxed">{description}</p>
    </div>
  );
}

// ============================================================================
// Persona card
// ============================================================================

function PersonaCard({ parsed, report }: DemoPersona) {
  const age = new Date().getFullYear() - parsed.vehicle.yearOfManufacture;
  const ageLabel =
    age <= 0
      ? "Brand new"
      : age === 1
        ? "1 year old"
        : `${age} years old`;

  const isWellCovered = parsed.addOns.length >= 5;
  const isHighIdv = parsed.idv >= 500000;

  // Brand-aligned accent strips per profile type
  const accentBar = isWellCovered
    ? "bg-brand-success"
    : isHighIdv
      ? "bg-brand-purple"
      : "bg-brand-orange";

  const profileTag = isWellCovered
    ? "Well-covered profile"
    : isHighIdv
      ? "Premium vehicle"
      : "Gap-rich profile";

  return (
    <Link
      href={`/report/${parsed.id}`}
      className="block rounded-2xl bg-white border border-brand-light-gray hover:border-brand-electricblue/40 shadow-soft hover:shadow-elevated transition-all group overflow-hidden"
    >
      {/* Coloured accent bar */}
      <div className={`h-1.5 ${accentBar}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-slate">
              {profileTag} · {ageLabel}
            </div>
            <div className="font-bold text-brand-charcoal mt-1 leading-tight">
              {parsed.vehicle.make} {parsed.vehicle.model}
            </div>
            <div className="text-xs text-brand-slate">
              {parsed.vehicle.variant}
            </div>
          </div>
        </div>

        {/* Facts row */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-brand-light-gray my-3">
          <Fact label="IDV" value={formatINR(parsed.idv)} compact />
          <Fact label="NCB" value={`${parsed.ncbPercent}%`} compact />
          <Fact
            label="Add-ons"
            value={String(parsed.addOns.length)}
            compact
          />
        </div>

        {/* AI-generated tagline from the report */}
        <p className="text-xs text-brand-charcoal italic leading-relaxed mb-3 line-clamp-2">
          &ldquo;{report.keyTakeaway.headline}&rdquo;
        </p>

        <div className="flex items-center justify-between">
          <div className="text-xs text-brand-slate">
            {parsed.insurerName.split(" ").slice(0, 2).join(" ")}
          </div>
          <div className="text-sm font-semibold text-brand-deepblue flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            View Report
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function Fact({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-[0.12em] text-brand-slate font-semibold">
        {label}
      </div>
      <div
        className={`font-bold text-brand-charcoal tabular-nums ${compact ? "text-sm" : "text-base"}`}
      >
        {value}
      </div>
    </div>
  );
}
