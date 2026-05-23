/**
 * MarketplaceAdminReveal — the "behind the curtain" section that
 * exposes Section 6 (Ideal Insurer Profile) — the LLM-generated
 * insurer-matching reasoning that's HIDDEN from customers but drives
 * the backend bid orchestration.
 *
 * Per V1 spec: section 6 lives in the PolicyReport but the customer
 * report never shows it. It's how RightOffer decides which insurers
 * to invite to bid on the customer's RFQ, without the customer
 * seeing (or trying to game) the matching logic.
 *
 * Reveal rules — three conditions ALL must hold:
 *   1. ?admin=1 in the URL (explicit toggle by the operator)
 *   2. isMarketplaceEnabled() returns true (host-based gate; demo
 *      subdomain only — never exposes on rightoffer.in even with the
 *      query string set)
 *   3. printMode === false (PDFs shipped to customer inboxes must
 *      never carry the admin content)
 *
 * When all three hold, renders a distinct plum-tinted card with:
 *   · "BEHIND THE CURTAIN" mono kicker
 *   · explainer line about what this section is
 *   · the recommendedInsurers list with reasoning
 *   · the selectionCriteria as a small mono list
 *
 * Designed for live investor demos: append `?admin=1` to any
 * /report/[id] URL on demo.rightoffer.in and the moat-explaining
 * section appears below the audit.
 */

import { isMarketplaceEnabled } from "@/lib/feature-flags";
import type { PolicyReport } from "@/lib/types";

interface Props {
  report: PolicyReport;
  /** Has the operator opted into admin view via ?admin=1? */
  showAdmin: boolean;
  /** PDF render — admin reveal MUST stay hidden in PDFs since they're
   *  shared / forwarded / archived for customers. */
  printMode?: boolean;
}

export async function MarketplaceAdminReveal({
  report,
  showAdmin,
  printMode,
}: Props) {
  if (!showAdmin) return null;
  if (printMode) return null;
  const enabled = await isMarketplaceEnabled();
  if (!enabled) return null;

  const profile = report.idealInsurerProfile;
  if (!profile) return null;
  const insurers = profile.recommendedInsurers ?? [];
  const criteria = profile.selectionCriteria ?? [];
  if (insurers.length === 0 && criteria.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-brand-plum/30">
      {/* Banner — high contrast plum on muted background so this
       *  visibly separates from the customer-facing report. */}
      <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-brand-plum text-brand-offwhite rounded-md">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] font-bold">
          · Behind the curtain ·
        </span>
      </div>

      <h2 className="font-serif font-medium text-[22px] md:text-[26px] leading-[1.2] tracking-[-0.015em] text-brand-charcoal m-0 mb-3">
        Section 6 &mdash;{" "}
        <span className="italic text-brand-plum">
          Ideal insurer profile
        </span>
      </h2>

      <p className="font-serif italic text-[14.5px] text-brand-slate max-w-2xl mb-6">
        This section is generated for every audit but{" "}
        <strong className="not-italic font-semibold">never shown to the customer</strong>.
        It&rsquo;s how RightOffer decides which insurers to invite into the
        bid &mdash; matching the customer&rsquo;s profile, RTO, vehicle age,
        and gap pattern to insurer strengths. The customer sees a clean
        verdict; the auction reads this.
      </p>

      {/* Selection criteria — the matching logic itself */}
      {criteria.length > 0 && (
        <div className="mb-6">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold mb-2">
            &middot; Selection criteria &middot;
          </div>
          <ul className="list-disc pl-5 m-0 space-y-1.5">
            {criteria.map((c, i) => (
              <li
                key={`crit-${i}`}
                className="font-serif text-[14px] text-brand-charcoal leading-[1.5]"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended insurers — ranked list with reasoning */}
      {insurers.length > 0 && (
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold mb-2">
            &middot; Recommended insurers &middot;
          </div>
          <ol className="list-decimal pl-5 m-0 space-y-3">
            {insurers.map((ins, i) => (
              <li
                key={`ins-${i}-${ins.name}`}
                className="font-serif text-[14px] text-brand-charcoal leading-[1.5]"
              >
                <span className="font-semibold">{ins.name}</span>
                <span className="text-brand-slate">
                  {" "}&mdash; {ins.reasoning}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-brand-plum/20 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
        &middot; Admin reveal &middot; This block is hidden from customers and
        absent from the PDF render &middot;
      </div>
    </section>
  );
}
