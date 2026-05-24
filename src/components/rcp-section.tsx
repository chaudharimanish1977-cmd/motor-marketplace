/**
 * Recommended Coverage Profile (RCP) section for the report page.
 *
 * Surfaces the canonical "what we believe your policy should look like"
 * view. Three lists:
 *   - Required (must have for your car/profile)
 *   - Optional (nice to have, doesn't impact RCP-completeness)
 *   - Unnecessary (currently in your policy but you don't need it)
 *
 * Every item carries its "why" — the same per-add-on reasoning the
 * report generator emits — so the customer can see the logic, not just
 * the verdict. This is the discipline the Right Offer rule requires:
 * recommendations must be defensible per item.
 */

import { ShieldCheck, Sparkles, X, Info } from "lucide-react";
import type { RecommendedCoverageProfile } from "@/lib/recommended-coverage-profile";
import { formatINR } from "@/lib/format";

interface Props {
  rcp: RecommendedCoverageProfile;
  vehicleLabel: string;
}

export function RcpSection({ rcp, vehicleLabel }: Props) {
  const hasOptional = rcp.optionalAddOns.length > 0;
  const hasUnnecessary = rcp.unnecessaryAddOns.length > 0;

  return (
    <section className="bg-white rounded-2xl border border-brand-light-gray shadow-soft overflow-hidden">
      <header className="px-5 md:px-6 pt-5 pb-3 border-b border-brand-light-gray">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-charcoal">
          <ShieldCheck className="w-3.5 h-3.5" />
          What we recommend
        </div>
        <h2 className="mt-1.5 text-xl md:text-2xl font-bold text-brand-charcoal tracking-tight">
          The Right Offer profile for your {vehicleLabel}
        </h2>
        <p className="mt-1.5 text-xs md:text-sm text-brand-slate leading-relaxed">
          The coverage we believe is right for your car &amp; profile.
          Every quote you consider — yours or ours — is scored against this.
        </p>
      </header>

      {/* Required */}
      <div className="px-5 md:px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-charcoal">
            Required add-ons
          </div>
          <div className="text-[10px] text-brand-slate tabular-nums">
            ~ {formatINR(rcp.requiredAddOnsPremiumTotal)}/yr together
          </div>
        </div>
        {rcp.requiredAddOns.length === 0 ? (
          <p className="text-xs text-brand-slate">
            No specific add-ons strictly required for your profile. The base
            cover should suffice.
          </p>
        ) : (
          <ul className="space-y-2">
            {rcp.requiredAddOns.map((a) => (
              <li
                key={a.name}
                className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/40 border border-emerald-100"
              >
                <div className="w-6 h-6 shrink-0 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-semibold text-brand-charcoal text-sm">
                      {a.name}
                    </div>
                    <div className="text-[11px] tabular-nums text-brand-slate">
                      ~ {formatINR(a.estimatedAnnualPremium)}/yr
                    </div>
                  </div>
                  <div className="text-xs text-brand-slate leading-snug mt-0.5">
                    {a.why}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Optional */}
      {hasOptional && (
        <div className="px-5 md:px-6 py-4 border-t border-brand-light-gray bg-brand-offwhite/30">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-charcoal mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-brand-charcoal" />
            Worth considering
          </div>
          <ul className="space-y-1.5">
            {rcp.optionalAddOns.map((a) => (
              <li
                key={a.name}
                className="flex items-start gap-2 text-xs leading-snug"
              >
                <span className="mt-0.5 w-1 h-1 rounded-full bg-brand-charcoal/70 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-brand-charcoal">
                    {a.name}
                  </span>
                  <span className="text-brand-slate">
                    {" — "}
                    {a.why}
                    {" "}
                    <span className="tabular-nums text-brand-slate/80">
                      (~ {formatINR(a.estimatedAnnualPremium)}/yr)
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unnecessary (over-coverage flags) */}
      {hasUnnecessary && (
        <div className="px-5 md:px-6 py-4 border-t border-brand-light-gray">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-charcoal mb-2 flex items-center gap-1.5">
            <X className="w-3 h-3 text-rose-600" />
            You have but probably don&rsquo;t need
          </div>
          <ul className="space-y-1.5">
            {rcp.unnecessaryAddOns.map((a) => (
              <li
                key={a.name}
                className="flex items-start gap-2 text-xs leading-snug"
              >
                <span className="mt-0.5 w-1 h-1 rounded-full bg-rose-500/80 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-brand-charcoal">
                    {a.name}
                  </span>
                  <span className="text-brand-slate">
                    {" — "}
                    {a.why}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* IDV guidance */}
      <div className="px-5 md:px-6 py-4 border-t border-brand-light-gray bg-brand-offwhite/40">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 shrink-0 rounded-lg bg-brand-plum/15 text-brand-plum flex items-center justify-center mt-0.5">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-slate">
              IDV check
            </div>
            <div className="text-xs text-brand-charcoal mt-0.5 leading-snug">
              <span className="font-semibold">
                {formatINR(rcp.idv.current)}
              </span>
              {" · "}
              <IdvAssessmentBadge assessment={rcp.idv.assessment} />
            </div>
            <div className="text-[11px] text-brand-slate mt-1 leading-relaxed">
              {rcp.idv.note}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IdvAssessmentBadge({
  assessment,
}: {
  assessment: "appropriate" | "low" | "high";
}) {
  const cfg =
    assessment === "appropriate"
      ? { label: "Appropriate", cls: "text-emerald-700" }
      : assessment === "low"
        ? { label: "Possibly too low", cls: "text-amber-700" }
        : { label: "Possibly too high", cls: "text-amber-700" };
  return (
    <span className={`font-semibold ${cfg.cls}`}>{cfg.label}</span>
  );
}
