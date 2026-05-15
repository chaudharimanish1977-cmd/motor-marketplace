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
import { BrandBlobs } from "@/components/brand-blobs";
import { LoadingLink } from "@/components/loading-link";

// Always re-fetch personas at request time so newly-parsed policies appear
// immediately. Without this, the page would snapshot the DB at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "RightOffer — Investor Demo",
};

interface DemoPersona {
  parsed: ParsedPolicy;
  report: PolicyReport;
}

async function loadDemoPersonas(): Promise<DemoPersona[]> {
  const all = await readTable<ParsedPolicy>(Tables.PARSED_POLICIES);
  const withReports: DemoPersona[] = [];
  for (const parsed of all) {
    const report = await findOne<PolicyReport>(
      Tables.REPORTS,
      (r) => r.parsedPolicyId === parsed.id
    );
    if (report) withReports.push({ parsed, report });
  }
  return withReports.sort(
    (a, b) =>
      b.parsed.vehicle.yearOfManufacture -
      a.parsed.vehicle.yearOfManufacture
  );
}

export default async function InvestorHome() {
  const personas = await loadDemoPersonas();

  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-screen flex flex-col items-center px-4 py-12">
        <div className="max-w-3xl w-full text-center space-y-8">
        {/* Eyebrow */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-deepblue bg-blue-50 border border-blue-100 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            RightOffer AI Powered Policy Review
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
              in under 2 minutes
            </span>
            .
          </p>
        </div>

        {/* Primary CTA */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <LoadingLink
            href="/upload?demo=1"
            className="inline-flex items-center justify-center px-9 py-4 bg-brand-orange hover:brightness-110 text-white font-semibold text-lg rounded-2xl shadow-glow transition-all hover:scale-[1.03]"
          >
            Get My Free Policy Review
            <ArrowRight className="w-5 h-5 ml-2" />
          </LoadingLink>
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
            title="RightOffer AI Powered"
            description="Under-2-minute analysis with personalised recommendations for your vehicle."
          />
        </div>
      </div>

      {/* Renewal flywheel teaser */}
      <RenewalPreview />

      {/* Pre-parsed personas — investor-only shortcut into the full pitch flow */}
      {personas.length > 0 && (
        <section className="mt-24 max-w-5xl w-full">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-orange bg-orange-50 border border-orange-100 rounded-full mb-4">
              <Zap className="w-3 h-3" />
              Pre-parsed personas · Investor shortcut
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-charcoal tracking-tight">
              Jump into a sample journey
            </h2>
            <p className="text-brand-slate mt-3 max-w-xl mx-auto">
              Skip upload — these are real parsed policies. Click any to walk
              the full report → bidding → checkout → renewal flow exactly as a
              customer would.
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

      <p className="text-xs text-brand-slate/70 pt-16 text-center max-w-md">
        RightOffer · Independent motor insurance advisor for India · Investor
        demo build
      </p>
      </main>
    </>
  );
}

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

function PersonaCard({ parsed, report }: DemoPersona) {
  const age = new Date().getFullYear() - parsed.vehicle.yearOfManufacture;
  const ageLabel =
    age <= 0 ? "Brand new" : age === 1 ? "1 year old" : `${age} years old`;

  const isWellCovered = parsed.addOns.length >= 5;
  const isHighIdv = parsed.idv >= 500000;
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
    <LoadingLink
      href={`/report/${parsed.id}?demo=1`}
      className="block rounded-2xl bg-white border border-brand-light-gray hover:border-brand-electricblue/40 shadow-soft hover:shadow-elevated transition-all group overflow-hidden"
    >
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
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-brand-light-gray my-3">
          <Fact label="IDV" value={formatINR(parsed.idv)} compact />
          <Fact label="NCB" value={`${parsed.ncbPercent}%`} compact />
          <Fact
            label="Add-ons"
            value={String(parsed.addOns.length)}
            compact
          />
        </div>
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
    </LoadingLink>
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
