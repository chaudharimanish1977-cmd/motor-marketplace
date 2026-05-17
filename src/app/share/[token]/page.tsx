import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { findById, findOne, Tables, updateById } from "@/lib/db";
import { computeCoverageScore } from "@/lib/coverage-score";
import { totalMoneyAtRisk } from "@/lib/claim-scenarios";
import { formatINR } from "@/lib/format";
import { BrandBlobs } from "@/components/brand-blobs";
import type {
  ParsedPolicy,
  PolicyReport,
  ShareToken,
} from "@/lib/types";

/**
 * /share/[token]  — depersonalized public preview of a customer's
 * audit (Phase 7d.3).
 *
 * What the recipient sees:
 *   · Vehicle make + model + year only (no plate, no owner name)
 *   · Verdict label + coverage band
 *   · "At risk today" rupee figure across all gaps
 *   · Top 3 gap titles (no descriptions that might leak personal
 *     context like "your CNG car parked at Bandra")
 *   · CTA to upload their own policy for a free audit
 *
 * What the recipient does NOT see:
 *   · Owner name, email, mobile, plate, address
 *   · Premium paid, IDV, NCB
 *   · Driving-profile chips
 *   · Gap narrative bodies
 *   · Audit-check trail
 *   · Claim-simulator scenarios
 *
 * Auth: PUBLIC route. The whole point is to be forwarded — but the
 * payload is engineered to be safe even when forwarded to a stranger.
 * Each visit increments the token's viewCount; the owner can later
 * see "this link was viewed N times" from /me. Revoked tokens 404.
 */

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  // Keep metadata generic — the share page shows the audit but the
  // social-preview card (handled by /api/report-card via the rendered
  // page's open-graph image route once we set it up) shouldn't leak
  // either. For now, fall back to the brand-wide OG image.
  void token;
  return {
    title: "A motor insurance audit · RightOffer",
    description:
      "An independent, free motor insurance review. See the gaps, see what's at risk, get yours in under 2 minutes.",
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;
  const shareToken = await findById<ShareToken>(Tables.SHARE_TOKENS, token);
  if (!shareToken || shareToken.revoked) notFound();

  const parsedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    shareToken.parsedPolicyId
  );
  if (!parsedPolicy) notFound();

  const report = await findOne<PolicyReport>(
    Tables.REPORTS,
    (r) => r.parsedPolicyId === shareToken.parsedPolicyId
  );

  // Best-effort visit counter — non-fatal if the write fails (we'd
  // rather render the page than 500 the recipient over an analytics row).
  try {
    await updateById<ShareToken>(Tables.SHARE_TOKENS, token, {
      viewCount: (shareToken.viewCount ?? 0) + 1,
    });
  } catch (err) {
    console.error("[share] viewCount bump failed", err);
  }

  const vehicleAge = Math.max(
    0,
    new Date().getFullYear() - (parsedPolicy.vehicle.yearOfManufacture || 0)
  );
  const coverage = computeCoverageScore(parsedPolicy, report ?? undefined);
  const verdict = verdictLabel(coverage.score);
  const verdictTone = verdictTone_(coverage.score);
  const moneyAtRisk = totalMoneyAtRisk(
    report?.keyGaps.items.map((g) => g.title) ?? [],
    parsedPolicy.idv,
    vehicleAge
  );
  const vehicleLabel =
    `${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`.trim() ||
    "Their car";
  const yearLabel = parsedPolicy.vehicle.yearOfManufacture
    ? `(${parsedPolicy.vehicle.yearOfManufacture})`
    : "";

  // Top 3 gap TITLES only — no body. The body fields can include
  // personal context ("for a CNG car parked at Bandra") that we
  // don't want bleeding through this surface.
  const topGaps = (report?.keyGaps.items ?? []).slice(0, 3);

  return (
    <>
      <BrandBlobs />
      <article className="relative z-10 max-w-2xl mx-auto px-6 md:px-8 py-12 md:py-16 font-serif text-brand-charcoal">
        {/* Masthead */}
        <header className="border-b border-brand-charcoal/15 pb-5 mb-10">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
            · A friend shared their RightOffer audit ·
          </div>
          <h1 className="font-serif font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
            {vehicleLabel}{" "}
            {yearLabel && (
              <span className="italic text-brand-plum">{yearLabel}</span>
            )}
          </h1>
          <p
            className={`mt-3 font-serif italic text-[17px] md:text-[19px] ${verdictTone}`}
          >
            {verdict}
          </p>
        </header>

        {/* At risk hero */}
        {moneyAtRisk.total > 0 && (
          <section className="my-8 pl-5 border-l-4 border-brand-alert">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-alert font-bold">
              · At risk today, if a claim happens ·
            </div>
            <div className="mt-2 font-serif font-semibold text-[44px] md:text-[60px] tabular-nums leading-none text-brand-charcoal">
              {formatINR(moneyAtRisk.total)}
            </div>
            <p className="mt-2 font-serif italic text-[15px] md:text-[16px] text-brand-slate">
              estimated out-of-pocket across {moneyAtRisk.count}{" "}
              {moneyAtRisk.count === 1 ? "gap" : "gaps"} on their policy.
            </p>
          </section>
        )}

        {/* Top gap titles only */}
        {topGaps.length > 0 && (
          <section className="my-10">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
              · Top gaps the audit found ·
            </div>
            <ul className="mt-3 space-y-3">
              {topGaps.map((gap, i) => (
                <li
                  key={i}
                  className="flex gap-3 items-baseline border-b border-brand-charcoal/10 pb-3 last:border-0"
                >
                  <span
                    className="font-mono text-[12px] font-bold text-brand-alert"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif font-semibold text-[16px] md:text-[18px] text-brand-charcoal">
                    {gap.title}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-serif italic text-[13px] text-brand-slate">
              We&rsquo;ve hidden the audit&rsquo;s personal details — what you&rsquo;re
              seeing is what your friend&rsquo;s policy missed.
            </p>
          </section>
        )}

        {/* CTA */}
        <section className="mt-12 border-t border-brand-charcoal/15 pt-8">
          <h2 className="font-serif font-medium text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
            Want the same audit on{" "}
            <span className="italic text-brand-plum">your</span> car?
          </h2>
          <p className="mt-3 font-serif text-[15px] md:text-[16px] leading-[1.55] text-brand-slate max-w-md">
            Free. Independent. No sales calls. We read your policy with AI
            and tell you what&rsquo;s missing — in under 2 minutes.
          </p>
          <Link
            href={`/?ref=share-${token.slice(0, 6)}`}
            className="mt-5 inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3.5 rounded-full font-serif italic font-medium text-[16px] min-h-[48px] hover:opacity-90 transition-opacity"
          >
            Audit my car <span aria-hidden>→</span>
          </Link>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
            · Free to see · No sales calls · DPDP-aligned ·
          </div>
        </section>
      </article>
    </>
  );
}

function verdictLabel(score: number): string {
  if (score >= 85) return "Excellent — strong cover across the board.";
  if (score >= 70) return "Good — solid base with a couple of opportunities.";
  if (score >= 50) return "Decent — meaningful gaps worth closing.";
  if (score >= 30) return "Gaps to watch — claim-time exposure is real.";
  return "Critical — major gaps in current cover.";
}

function verdictTone_(score: number): string {
  if (score >= 70) return "text-brand-success";
  if (score >= 50) return "text-brand-plum";
  return "text-brand-alert";
}
