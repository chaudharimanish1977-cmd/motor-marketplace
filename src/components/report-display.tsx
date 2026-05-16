import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import { RcpSection } from "@/components/rcp-section";
import { computeRCP } from "@/lib/recommended-coverage-profile";
import { ReportGate } from "@/components/report-gate";
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
import {
  DrivingProfileCard,
  type DrivingProfile,
} from "@/components/driving-profile-card";
import { Typewriter } from "@/components/typewriter";
import { VehicleWatermark } from "@/components/vehicle-watermark";
import { SimplifyToggle } from "@/components/simplify-toggle";
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

interface Props {
  parsedPolicy: ParsedPolicy;
  report: PolicyReport;
  /** Drives CTA behaviour. Customer view ends here (no bid link). Investor sees full flow. */
  view?: "customer" | "investor";
  /**
   * When true, the customer has NOT verified their email at the gate
   * yet. We render the gate after the "what's missing" section and
   * hide everything below it. Server-resolved by /report/[id].
   */
  showGate?: boolean;
  /** Optional answers captured during the mid-load survey on /upload. */
  drivingProfile?: DrivingProfile;
  /** When true, hide all interactive chrome (CTAs, toggles, guard) so the
   *  page renders cleanly for PDF generation via puppeteer. */
  printMode?: boolean;
}

export function ReportDisplay({
  parsedPolicy,
  report,
  view = "customer",
  showGate = false,
  drivingProfile,
  printMode = false,
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
  // Greeting is intentionally generic — the LLM extractor isn't reliable
  // enough to surface a clean first name from every policy PDF, and a wrong
  // name reads worse than a friendly placeholder.
  const greetingName = "Buddy";

  // RCP — derived from the report's per-add-on relevance tagging.
  // First-class benchmark for the comparator/auction flows downstream
  // (Right Offer rule). Surface it as a dedicated section so customers
  // see the reasoning, not just the verdict.
  const rcp = computeRCP(parsedPolicy, report);
  const rcpVehicleLabel =
    `${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`.trim() ||
    "your car";

  const vehicleAge =
    new Date().getFullYear() - parsedPolicy.vehicle.yearOfManufacture;
  const moneyAtRisk = totalMoneyAtRisk(
    keyGaps.items.map((g) => g.title),
    parsedPolicy.idv,
    vehicleAge
  );

  return (
    <div className="min-h-screen bg-brand-offwhite pb-12">
      {!printMode && <ScrollProgress />}
      {view === "customer" && !printMode && <ReportGuard />}
      {/* Header bar — mobile-first redesign:
       *  Row 1: "Hey Buddy" left, Shield icon right
       *  Row 2: "Your Motor Insurance at a Glance" centred
       *  Row 3: tagline split into two centred lines
       *  Secondary controls (SimplifyToggle + Generated date) are hidden on
       *  small screens to keep the header airy. */}
      <header className="relative bg-gradient-to-r from-brand-navy to-brand-plum text-white shadow-elevated overflow-hidden">
        <div
          className="absolute right-0 bottom-0 w-[420px] max-w-[55%] text-white pointer-events-none print:hidden"
          aria-hidden
        >
          <VehicleWatermark bodyType={bodyType} className="w-full h-auto" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-5 space-y-3">
          {/* Top row */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-brand-olive leading-tight">
              Hey {greetingName}
            </h2>
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-brand-olive" />
            </div>
          </div>

          {/* Title + 2-line tagline, centred */}
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-bold leading-tight">
              Your Motor Insurance{" "}
              <span className="text-brand-olive">at a Glance</span>
            </h1>
            <p className="text-sm text-white/85 mt-1.5 leading-snug">
              Smart Review Today.
              <br />
              Stronger Protection Tomorrow.
            </p>
          </div>

          {/* Secondary controls — desktop only, suppressed in print-mode */}
          {!printMode && (
            <div className="hidden md:flex items-center justify-end gap-3 print:hidden">
              <div className="text-xs text-white/70">
                Generated{" "}
                {new Date(report.generatedAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                })}{" "}
                IST
              </div>
              <SimplifyToggle />
            </div>
          )}
        </div>
      </header>

      {/* At a glance — compact 5-fact strip, DD/MM/YY policy period */}
      <section className="bg-white border-b border-brand-light-gray shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Fact
              label="Policy Period"
              value={formatPolicyPeriodShort(
                parsedPolicy.odPeriodStart,
                parsedPolicy.odPeriodEnd
              )}
              valueClassName="text-xs sm:text-sm tabular-nums"
            />
            <Fact
              label="Vehicle"
              value={atAGlance.vehicleLabel}
              valueClassName="text-xs sm:text-sm"
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
              valueClassName="text-xs sm:text-sm"
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
          view === "customer" && !printMode && "report-protected"
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
        <DrivingProfileCard
          initialProfile={drivingProfile}
          reportId={parsedPolicy.id}
        />

        {/* RCP — The Right Offer profile for this car. Sets the
         *  recommendation framework that the gaps + comparator are
         *  measured against. Lives right after the verdict (score) so
         *  the customer reads "score → why → what to fix" in order. */}
        <RcpSection rcp={rcp} vehicleLabel={rcpVehicleLabel} />

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

        {/* THE GATE — appears right after the gaps section (highest-
         *  emotion content). When showGate is true, the customer hasn't
         *  verified their email yet — gate is rendered and EVERY
         *  section below this point is hidden until they do.
         *  Customer view only — investors / print-mode never see it. */}
        {showGate && view === "customer" && !printMode && (
          <>
            <ReportGate reportId={parsedPolicy.id} />
            {/* Skip rest of report until verified. The customer's report
             *  data is already loaded server-side; they're not waiting
             *  on anything other than the OTP exchange. */}
            <p className="text-center text-xs text-brand-slate/70 italic">
              The Right Offer Recommendation, your quote comparison, and
              the PDF unlock once you verify your email above.
            </p>
          </>
        )}

        {/* Everything below this point is hidden when the gate is
         *  active (anonymous customer view, not yet OTP-verified).
         *  Investor + print-mode views always see everything. */}
        {(!showGate || view === "investor" || printMode) && (
          <>
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

            {/* §6 Key Takeaway with CTA — skipped in print-mode (no CTA in PDF) */}
            {!printMode && (
              <KeyTakeawayCard
                takeaway={keyTakeaway}
                parsedPolicyId={parsedPolicy.id}
                view={view}
              />
            )}

            {/* Disclaimer */}
            <div className="text-xs text-slate-400 text-center pt-4">
              Disclaimer: This is a general information guide. Please refer
              to policy wordings for exact terms, conditions, limits &amp;
              exclusions.
            </div>
          </>
        )}
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
          <div className="rounded-2xl bg-gradient-to-br from-brand-coral/10 via-white to-rose-50 border-2 border-brand-coral/30 p-5 md:p-6 text-center md:text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-coral mb-1.5">
              At risk today, if a claim happens
            </div>
            <div className="text-4xl md:text-5xl font-bold tabular-nums text-brand-coral leading-none">
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
      <div className="text-[9px] text-brand-slate uppercase tracking-wider font-semibold mb-0.5">
        {label}
      </div>
      <div
        className={clsx(
          "font-bold text-brand-charcoal leading-snug",
          valueClassName ?? "text-sm"
        )}
      >
        {value}
      </div>
    </div>
  );
}

/** Format an ISO date pair as `DD/MM/YY – DD/MM/YY` for the at-a-glance strip. */
function formatPolicyPeriodShort(startIso: string, endIso: string): string {
  return `${shortDate(startIso)} – ${shortDate(endIso)}`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
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
    <div className="rounded-2xl border-2 border-brand-navy/40 bg-white shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-brand-navy to-brand-navy text-white font-bold px-5 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
          5.5
        </div>
        <span className="text-sm md:text-base uppercase tracking-wide">
          Pricing &amp; Savings Snapshot
        </span>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 bg-brand-olive text-brand-ink rounded">
          NEW
        </span>
      </div>
      <div className="bg-gradient-to-br from-white to-brand-navy/10 p-6 space-y-5">
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
          ? "border-brand-navy/40 bg-brand-navy/10"
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
    <details className="rounded-2xl border-2 border-dashed border-brand-plum/40 bg-brand-plum/10 p-6 group">
      <summary className="cursor-pointer flex items-center gap-3 list-none">
        <div className="w-9 h-9 rounded-lg bg-brand-plum/20 flex items-center justify-center">
          <Lock className="w-5 h-5 text-brand-plum" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-brand-plum flex items-center gap-2">
            Behind the Scenes: Ideal Insurer Profile
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-brand-plum/20 text-brand-plum rounded">
              Admin View
            </span>
          </div>
          <div className="text-xs text-brand-plum mt-0.5">
            Customer never sees this. Reveals the platform&apos;s matching logic
            for the pitch demo.
          </div>
        </div>
        <Eye className="w-5 h-5 text-brand-plum group-open:hidden" />
        <EyeOff className="w-5 h-5 text-brand-plum hidden group-open:block" />
      </summary>

      <div className="mt-5 space-y-4">
        <div className="text-sm text-brand-plum bg-white border border-brand-plum/30 rounded-lg p-3">
          The platform&apos;s matching engine pre-selects insurers most likely
          to bid competitively for this customer. The actual{" "}
          <strong>winning bid</strong> is determined by the marketplace&apos;s
          3-tier reverse auction (insurer preferences → real-time API → manual
          underwriter pool), not by these recommendations.
        </div>

        <div>
          <div className="text-xs font-semibold text-brand-plum uppercase mb-2">
            Recommended insurers for this customer profile
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {profile.recommendedInsurers.map((ins) => (
              <div
                key={ins.name}
                className="bg-white border border-brand-plum/30 rounded-lg p-3"
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
          <div className="text-xs font-semibold text-brand-plum uppercase mb-2">
            Selection criteria
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.selectionCriteria.map((c) => (
              <span
                key={c}
                className="text-xs bg-white border border-brand-plum/30 px-2.5 py-1 rounded-full text-brand-plum"
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
    <div className="rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-plum text-white p-8 md:p-10 text-center shadow-elevated">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-5">
        <Target className="w-3.5 h-3.5" /> Key Takeaway
      </div>
      <h2 className="text-2xl md:text-4xl font-bold mb-4 max-w-3xl mx-auto leading-tight">
        <Typewriter
          text={takeaway.headline}
          speed={22}
          startDelay={300}
          caretClassName="bg-brand-olive"
        />
      </h2>
      <p className="report-detail text-white/85 max-w-2xl mx-auto mb-7 text-lg">
        {takeaway.body}
      </p>
      {isInvestor ? (
        <>
          <LoadingLink
            href={`/bid/${parsedPolicyId}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-olive text-white font-bold rounded-2xl shadow-glow hover:scale-105 hover:brightness-110 transition-all"
            spinnerPosition="top-right"
          >
            {takeaway.cta}
            <ArrowRight className="w-5 h-5" />
          </LoadingLink>
          <p className="text-white/70 text-xs mt-4">
            Free to see your offers · Insurers compete for your renewal · No
            spam
          </p>
        </>
      ) : (
        <>
          <ReportDownloadGate
            variant="hero"
            label="Get the Full Report"
            reportId={parsedPolicyId}
          />
          <p className="text-white/70 text-xs mt-4 max-w-md mx-auto">
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
