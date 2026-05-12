import Link from "next/link";
import {
  ShieldCheck,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  Truck,
  Award,
  Key,
  Droplet,
  FileText,
  Briefcase,
  TrendingUp,
  Lightbulb,
  MapPin,
  ThumbsUp,
  IndianRupee,
  Target,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { ReportDownloadGate } from "@/components/report-download-gate";
import { CoverageScoreCard } from "@/components/coverage-score";
import { computeCoverageScore } from "@/lib/coverage-score";
import { ClaimSimulator } from "@/components/claim-simulator";
import { totalMoneyAtRisk } from "@/lib/claim-scenarios";
import { NumberPlate } from "@/components/number-plate";
import { ScrollProgress } from "@/components/scroll-progress";
import { ReportGuard } from "@/components/report-guard";
import { Typewriter } from "@/components/typewriter";
import { VehicleWatermark } from "@/components/vehicle-watermark";
import { SimplifyToggle } from "@/components/simplify-toggle";
import { ElapsedTimer } from "@/components/elapsed-timer";
import { getBodyType } from "@/lib/vehicle-classifier";

function iconForHint(hint?: string): LucideIcon {
  switch (hint) {
    case "shield":
    case "shield-check":
      return ShieldCheck;
    case "check":
      return CheckCircle2;
    case "badge":
      return Award;
    case "cng":
      return Droplet;
    case "pa":
      return Shield;
    case "deductible":
      return ThumbsUp;
    case "addon":
      return Sparkles;
    case "engine":
      return Wrench;
    case "consumables":
      return Briefcase;
    case "rsa":
      return Truck;
    case "ncb":
      return Award;
    case "key":
      return Key;
    case "zerodep":
      return ShieldCheck;
    case "rti":
      return FileText;
    case "personal-belongings":
      return Briefcase;
    case "garage":
      return MapPin;
    case "service":
      return ShieldCheck;
    case "wisely":
      return Lightbulb;
    default:
      return Sparkles;
  }
}

interface DrivingProfile {
  annualKm?: string;
  drivenBy?: string;
  otherCars?: string;
  priority?: string;
}

interface Props {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
  /** Total ms from upload click → report ready. When present, shown in the header. */
  totalElapsedMs?: number;
  /** Drives CTA behaviour. Customer view ends here (no bid link). Investor sees full flow. */
  view?: "customer" | "investor";
  /** Optional answers captured during the mid-load survey on /upload. */
  drivingProfile?: DrivingProfile;
}

export function ReportDisplay({
  parsedPolicy,
  report,
  totalElapsedMs,
  view = "customer",
  drivingProfile,
}: Props) {
  const {
    atAGlance,
    whatCoversWell,
    keyGaps,
    idvCheck,
    renewalTips,
    pricingSnapshot,
    idealInsurerProfile,
    keyTakeaway,
  } = report;

  const bodyType = getBodyType(
    parsedPolicy.vehicle.make,
    parsedPolicy.vehicle.model
  );
  const ownerFirstName =
    parsedPolicy.owner.name.trim().split(/\s+/)[0] ?? parsedPolicy.owner.name;

  const vehicleAge =
    new Date().getFullYear() - parsedPolicy.vehicle.yearOfManufacture;
  const moneyAtRisk = totalMoneyAtRisk(
    keyGaps.items.map((g) => g.title),
    parsedPolicy.idv,
    vehicleAge
  );

  return (
    <div className="min-h-screen bg-brand-offwhite pb-12">
      <ScrollProgress />
      {view === "customer" && <ReportGuard />}
      {/* Header bar */}
      <header className="relative bg-gradient-to-r from-brand-deepblue to-brand-electricblue text-white shadow-elevated overflow-hidden">
        {/* Decorative body-type watermark */}
        <div
          className="absolute right-0 bottom-0 w-[420px] max-w-[55%] text-white pointer-events-none print:hidden"
          aria-hidden
        >
          <VehicleWatermark bodyType={bodyType} className="w-full h-auto" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-brand-gold" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-gold mb-0.5">
                  Hi, {ownerFirstName}
                </div>
                <h1 className="text-xl md:text-2xl font-bold">
                  Your Motor Insurance{" "}
                  <span className="text-brand-gold">at a Glance</span>
                </h1>
                <p className="text-sm text-blue-100 mt-0.5">
                  Smart Review Today. Stronger Protection Tomorrow.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {totalElapsedMs !== undefined && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-gold/95 text-brand-charcoal rounded-full shadow-soft print:hidden">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                    Ready in
                  </span>
                  <ElapsedTimer
                    frozenAtMs={totalElapsedMs}
                    size="md"
                    showIcon={false}
                    className="!font-bold !text-sm"
                  />
                </div>
              )}
              <div className="text-xs text-blue-200 print:hidden">
                Generated{" "}
                {new Date(report.generatedAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                })}{" "}
                IST
              </div>
              <SimplifyToggle />
              <ReportDownloadGate />
            </div>
          </div>
        </div>
      </header>

      {/* At a glance — 5-fact strip */}
      <section className="bg-white border-b border-brand-light-gray shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <Fact label="Policy Period" value={atAGlance.policyPeriodLabel} />
            <Fact
              label="Vehicle"
              value={atAGlance.vehicleLabel}
              valueClassName="text-sm"
            />
            <Fact
              label="IDV"
              value={formatINR(atAGlance.idv)}
              valueClassName="text-emerald-700"
            />
            <Fact
              label="NCB"
              value={`${atAGlance.ncbPercent}%`}
              valueClassName="text-emerald-700"
            />
            <Fact
              label="Policy Type"
              value={atAGlance.policyTypeLabel}
              valueClassName="text-sm"
            />
          </div>
        </div>
      </section>

      {/* Content body — narrative order:
       *   1. Vehicle plate hero + money-at-risk callout
       *   2. Coverage Score (anchor)
       *   3. Driving profile (personalisation chips)
       *   4. KEY GAPS (full-width, prominent — this is "what's at risk")
       *   5. What Covers Well (smaller, reassurance)
       *   6. Renewal action panel (IDV check + tips combined)
       *   7. Pricing snapshot (investor only — implies bid flow)
       *   8. Ideal Insurer Profile (investor only — admin)
       *   9. Key Takeaway with CTA
       */}
      <main
        className={clsx(
          "max-w-5xl mx-auto px-4 py-8 space-y-6",
          view === "customer" && "report-protected"
        )}
      >
        {/* §0a Vehicle hero — big plate + money-at-risk callout */}
        <VehicleHero
          vehicleLabel={`${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`}
          variant={parsedPolicy.vehicle.variant}
          registrationNumber={parsedPolicy.vehicle.registrationNumber}
          yearOfManufacture={parsedPolicy.vehicle.yearOfManufacture}
          moneyAtRisk={moneyAtRisk.total}
          riskGapCount={moneyAtRisk.count}
        />

        {/* §0 Coverage Score — hero metric */}
        <CoverageScoreCard score={computeCoverageScore(parsedPolicy, report)} />

        {/* Driving profile chips — only when the user answered the mid-load survey */}
        {drivingProfile && <DrivingProfileCard profile={drivingProfile} />}

        {/* §1 KEY GAPS — full width, hero card. This is "what's at risk" and
         *  matches the customer's emotional reason for reading the report. */}
        <div id="gaps">
          <SectionCard
            number="1"
            title="Where you're at risk today"
            color="rose"
            items={keyGaps.items}
            isGap
            vehicleIdv={parsedPolicy.idv}
            vehicleAge={
              new Date().getFullYear() -
              parsedPolicy.vehicle.yearOfManufacture
            }
          />
        </div>

        {/* §2 What Covers Well — reassurance, smaller weight (after the urgent stuff) */}
        <SectionCard
          number="2"
          title="What's working in your favour"
          color="emerald"
          items={whatCoversWell.items}
        />

        {/* §3 Renewal action panel — IDV + renewal tips combined */}
        <div className="grid md:grid-cols-2 gap-6">
          <IdvCheckCard idvCheck={idvCheck} />
          <SectionCard
            number="3"
            title="Look out for at renewal"
            color="amber"
            items={renewalTips.items}
          />
        </div>

        {/* §4 Pricing snapshot — investor only (implies a bid flow we don't expose to customers yet) */}
        {view === "investor" && (
          <PricingSnapshotCard snapshot={pricingSnapshot} />
        )}

        {/* §5 Ideal Insurer Profile — investor admin reveal */}
        {view === "investor" && (
          <IdealInsurerProfileToggle profile={idealInsurerProfile} />
        )}

        {/* §6 Key Takeaway with CTA */}
        <KeyTakeawayCard
          takeaway={keyTakeaway}
          parsedPolicyId={parsedPolicy.id}
          view={view}
        />

        {/* Disclaimer */}
        <div className="text-xs text-slate-400 text-center pt-4">
          Disclaimer: This is a general information guide. Please refer to
          policy wordings for exact terms, conditions, limits & exclusions.
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function VehicleHero({
  vehicleLabel,
  variant,
  registrationNumber,
  yearOfManufacture,
  moneyAtRisk,
  riskGapCount,
}: {
  vehicleLabel: string;
  variant: string;
  registrationNumber: string;
  yearOfManufacture: number;
  moneyAtRisk: number;
  riskGapCount: number;
}) {
  const hasRisk = moneyAtRisk > 0 && riskGapCount > 0;
  return (
    <div className="rounded-3xl bg-white border border-brand-light-gray shadow-soft overflow-hidden">
      <div className="p-6 md:p-8 grid md:grid-cols-2 gap-6 items-center">
        {/* Left: huge plate + vehicle name */}
        <div className="text-center md:text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-slate mb-2">
            Your vehicle
          </div>
          <div className="flex justify-center md:justify-start mb-3">
            <NumberPlate value={registrationNumber} size="lg" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-brand-charcoal leading-tight">
            {vehicleLabel}
          </h2>
          <div className="text-sm text-brand-slate mt-0.5">
            {variant} · {yearOfManufacture}
          </div>
        </div>

        {/* Right: money-at-risk hero */}
        {hasRisk ? (
          <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-white to-rose-50 border-2 border-brand-orange/30 p-5 md:p-6 text-center md:text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange mb-1.5">
              At risk today, if a claim happens
            </div>
            <div className="text-4xl md:text-5xl font-bold tabular-nums text-brand-orange leading-none">
              {formatINR(moneyAtRisk)}
            </div>
            <div className="text-xs text-brand-slate mt-2 leading-snug">
              Estimated out-of-pocket across {riskGapCount}{" "}
              {riskGapCount === 1 ? "gap" : "gaps"} we found in your policy.
              Detail below.
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 border-2 border-emerald-200 p-5 md:p-6 text-center md:text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700 mb-1.5">
              Your policy looks strong
            </div>
            <div className="text-2xl md:text-3xl font-bold text-emerald-800 leading-tight">
              No critical gaps detected
            </div>
            <div className="text-xs text-brand-slate mt-2 leading-snug">
              Detail below — review at-renewal action items.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DrivingProfileCard({ profile }: { profile: DrivingProfile }) {
  const chips: { label: string; value: string }[] = [];
  if (profile.annualKm)
    chips.push({ label: "You drive", value: profile.annualKm });
  if (profile.drivenBy)
    chips.push({ label: "Driven by", value: profile.drivenBy });
  if (profile.otherCars)
    chips.push({ label: "Other cars", value: profile.otherCars });
  if (profile.priority)
    chips.push({ label: "Matters most", value: profile.priority });

  if (chips.length === 0) return null;

  return (
    <div className="rounded-2xl border border-brand-light-gray bg-white shadow-sm overflow-hidden">
      <div className="bg-brand-deepblue/5 px-5 py-2.5 border-b border-brand-light-gray">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-deepblue">
          Tailored to your driving profile
        </div>
      </div>
      <div className="px-5 py-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <div
            key={c.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-offwhite border border-brand-light-gray px-3 py-1.5"
          >
            <span className="text-[10px] uppercase tracking-wider text-brand-slate font-semibold">
              {c.label}
            </span>
            <span className="text-xs font-bold text-brand-charcoal">
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <div className="text-[10px] text-brand-slate uppercase tracking-wider font-semibold mb-1">
        {label}
      </div>
      <div className={clsx("font-bold text-brand-charcoal", valueClassName)}>
        {value}
      </div>
    </div>
  );
}

function SectionCard({
  number,
  title,
  color,
  items,
  isGap = false,
  vehicleIdv,
  vehicleAge,
}: {
  number: string;
  title: string;
  color: "emerald" | "rose" | "amber" | "sky";
  items: { title: string; description: string; iconHint?: string }[];
  isGap?: boolean;
  vehicleIdv?: number;
  vehicleAge?: number;
}) {
  const palette = {
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      ring: "ring-emerald-200",
      header: "bg-emerald-600",
      icon: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    rose: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      ring: "ring-rose-200",
      header: "bg-rose-600",
      icon: "text-rose-600",
      iconBg: "bg-rose-100",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      ring: "ring-amber-200",
      header: "bg-amber-600",
      icon: "text-amber-600",
      iconBg: "bg-amber-100",
    },
    sky: {
      bg: "bg-sky-50",
      border: "border-sky-200",
      ring: "ring-sky-200",
      header: "bg-sky-600",
      icon: "text-sky-600",
      iconBg: "bg-sky-100",
    },
  }[color];

  return (
    <div
      className={clsx(
        "rounded-2xl border bg-white shadow-sm overflow-hidden",
        palette.border
      )}
    >
      <div
        className={clsx(
          "px-5 py-3 text-white font-bold flex items-center gap-3",
          palette.header
        )}
      >
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
          {number}
        </div>
        <span className="text-sm md:text-base uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className={clsx("px-5 py-5 space-y-4", palette.bg)}>
        {items.map((item, i) => {
          const Icon = isGap
            ? XCircle
            : iconForHint(item.iconHint);
          return (
            <div key={i} className="flex gap-3">
              <div
                className={clsx(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  palette.iconBg
                )}
              >
                <Icon className={clsx("w-5 h-5", palette.icon)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-brand-charcoal leading-tight">
                  {item.title}
                </div>
                <div className="report-detail text-sm text-brand-slate mt-0.5">
                  {item.description}
                </div>
                {/* Claim simulator — only on gap cards */}
                {isGap && vehicleIdv && vehicleAge !== undefined && (
                  <ClaimSimulator
                    gapTitle={item.title}
                    idv={vehicleIdv}
                    vehicleAge={vehicleAge}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IdvCheckCard({
  idvCheck,
}: {
  idvCheck: PolicyReport["idvCheck"];
}) {
  const assessmentLabel = {
    appropriate: { text: "Appropriate", color: "text-emerald-700" },
    low: { text: "Looks Low", color: "text-amber-700" },
    high: { text: "Looks High", color: "text-amber-700" },
  }[idvCheck.assessment];

  return (
    <div className="rounded-2xl border border-sky-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-sky-600 text-white font-bold px-5 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
          3
        </div>
        <span className="text-sm md:text-base uppercase tracking-wide">
          IDV Check
        </span>
      </div>
      <div className="bg-sky-50 px-5 py-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6 text-sky-700" />
          </div>
          <div>
            <div className="text-xs text-brand-slate uppercase tracking-wider">
              Current IDV
            </div>
            <div className="text-2xl font-bold text-brand-charcoal">
              {formatINR(idvCheck.currentIdv)}
            </div>
            <div
              className={clsx(
                "text-xs font-semibold mt-1",
                assessmentLabel.color
              )}
            >
              {assessmentLabel.text}
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-brand-slate uppercase mb-2">
            What to do
          </div>
          <ul className="space-y-1.5">
            {idvCheck.whatToDo.map((item, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm text-brand-charcoal"
              >
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="report-detail bg-white border border-sky-200 rounded-lg p-3 text-sm flex gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Tip: </span>
            {idvCheck.tip}
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingSnapshotCard({
  snapshot,
}: {
  snapshot: PolicyReport["pricingSnapshot"];
}) {
  return (
    <div className="rounded-2xl border-2 border-blue-300 bg-white shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-brand-navy to-blue-700 text-white font-bold px-5 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
          5.5
        </div>
        <span className="text-sm md:text-base uppercase tracking-wide">
          Pricing &amp; Savings Snapshot
        </span>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 bg-brand-gold text-brand-ink rounded">
          NEW
        </span>
      </div>
      <div className="bg-gradient-to-br from-white to-blue-50 p-6 space-y-5">
        <div className="grid md:grid-cols-3 gap-4">
          <PricingCell
            label="Your Current Premium"
            value={formatINR(snapshot.currentPremium)}
            sub="What you paid"
          />
          <PricingCell
            label="Recommended Range"
            value={`${formatINR(snapshot.recommendedRangeMin)} – ${formatINR(snapshot.recommendedRangeMax)}`}
            sub="Optimal coverage estimate"
            highlight
          />
          {snapshot.hasPremiumSavings && snapshot.estimatedSavings ? (
            <PricingCell
              label="Estimated Savings"
              value={formatINR(snapshot.estimatedSavings)}
              sub="If you switch with curation"
              positive
            />
          ) : (
            <PricingCell
              label="Better Value"
              value="Right Cover"
              sub="At the right price"
              positive
            />
          )}
        </div>

        <p className="report-detail text-brand-charcoal leading-relaxed">{snapshot.narrative}</p>

        <div className="report-detail bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="font-semibold text-amber-900 text-sm mb-1">
              Real-world example
            </div>
            <p className="text-sm text-amber-900">{snapshot.claimTimeExample}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCell({
  label,
  value,
  sub,
  highlight = false,
  positive = false,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-4",
        highlight
          ? "border-blue-300 bg-blue-50"
          : positive
            ? "border-emerald-300 bg-emerald-50"
            : "border-brand-light-gray bg-white"
      )}
    >
      <div className="text-[10px] text-brand-slate uppercase tracking-wider font-semibold mb-1">
        {label}
      </div>
      <div
        className={clsx(
          "font-bold",
          positive ? "text-emerald-700" : "text-brand-charcoal",
          value.length > 12 ? "text-lg" : "text-2xl"
        )}
      >
        {value}
      </div>
      <div className="text-xs text-brand-slate mt-1">{sub}</div>
    </div>
  );
}

function IdealInsurerProfileToggle({
  profile,
}: {
  profile: PolicyReport["idealInsurerProfile"];
}) {
  return (
    <details className="rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 group">
      <summary className="cursor-pointer flex items-center gap-3 list-none">
        <div className="w-9 h-9 rounded-lg bg-purple-200 flex items-center justify-center">
          <Lock className="w-5 h-5 text-purple-700" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-purple-900 flex items-center gap-2">
            Behind the Scenes: Ideal Insurer Profile
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-purple-200 text-purple-900 rounded">
              Admin View
            </span>
          </div>
          <div className="text-xs text-purple-700 mt-0.5">
            Customer never sees this. Reveals the platform&apos;s matching logic
            for the pitch demo.
          </div>
        </div>
        <Eye className="w-5 h-5 text-purple-600 group-open:hidden" />
        <EyeOff className="w-5 h-5 text-purple-600 hidden group-open:block" />
      </summary>

      <div className="mt-5 space-y-4">
        <div className="text-sm text-purple-900 bg-white border border-purple-200 rounded-lg p-3">
          The platform&apos;s matching engine pre-selects insurers most likely
          to bid competitively for this customer. The actual{" "}
          <strong>winning bid</strong> is determined by the marketplace&apos;s
          3-tier reverse auction (insurer preferences → real-time API → manual
          underwriter pool), not by these recommendations.
        </div>

        <div>
          <div className="text-xs font-semibold text-purple-700 uppercase mb-2">
            Recommended insurers for this customer profile
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {profile.recommendedInsurers.map((ins) => (
              <div
                key={ins.name}
                className="bg-white border border-purple-200 rounded-lg p-3"
              >
                <div className="font-semibold text-brand-charcoal text-sm">
                  {ins.name}
                </div>
                <div className="text-xs text-brand-slate mt-0.5">
                  {ins.reasoning}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-purple-700 uppercase mb-2">
            Selection criteria
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.selectionCriteria.map((c) => (
              <span
                key={c}
                className="text-xs bg-white border border-purple-200 px-2.5 py-1 rounded-full text-purple-900"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}

function KeyTakeawayCard({
  takeaway,
  parsedPolicyId,
  view,
}: {
  takeaway: PolicyReport["keyTakeaway"];
  parsedPolicyId: string;
  view: "customer" | "investor";
}) {
  const isInvestor = view === "investor";

  return (
    <div className="rounded-3xl bg-gradient-to-br from-brand-deepblue via-brand-deepblue to-brand-electricblue text-white p-8 md:p-10 text-center shadow-elevated">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-5">
        <Target className="w-3.5 h-3.5" /> Key Takeaway
      </div>
      <h2 className="text-2xl md:text-4xl font-bold mb-4 max-w-3xl mx-auto leading-tight">
        <Typewriter
          text={takeaway.headline}
          speed={22}
          startDelay={300}
          caretClassName="bg-brand-gold"
        />
      </h2>
      <p className="report-detail text-blue-100 max-w-2xl mx-auto mb-7 text-lg">
        {takeaway.body}
      </p>
      {isInvestor ? (
        <>
          <Link
            href={`/bid/${parsedPolicyId}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-orange text-white font-bold rounded-2xl shadow-glow hover:scale-105 hover:brightness-110 transition-all"
          >
            {takeaway.cta}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-blue-200 text-xs mt-4">
            Free to see your offers · Insurers compete for your renewal · No
            spam
          </p>
        </>
      ) : (
        <>
          <ReportDownloadGate variant="hero" label="Get the full report by email" />
          <p className="text-blue-200 text-xs mt-4 max-w-md mx-auto">
            We&apos;ll email this report to you so you have it on hand at
            renewal — and send a reminder before your policy expires. No spam.
          </p>
        </>
      )}
    </div>
  );
}

// Suppress unused warning for AlertTriangle (reserved for future use in IDV warnings)
void AlertTriangle;
